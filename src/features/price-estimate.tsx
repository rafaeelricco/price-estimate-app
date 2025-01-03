'use client'

import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle
} from '@/components/ui/dialog'
import {
   Form,
   FormControl,
   FormField,
   FormItem,
   FormLabel,
   FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { TooltipGenericMessage } from '@/components/ui/tooltip'
import { PriceEstimateResult } from '@/features/price-estimate-result'
import {
   PriceEstimate,
   PriceEstimateSchema
} from '@/features/price-estimate.schema'
import { calculateTotal, formatCurrency } from '@/features/price-estimate.utils'
import { useAnimatedText } from '@/hooks/useAnimatedText'
import { useCopyToClipboard } from '@/hooks/useCopyToClipBoard'
import { useDisclosure } from '@/hooks/useDisclosure'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Copy, Plus, Sparkles, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'

const PriceEstimateCalculator: React.FC = () => {
   return (
      <div className="grid min-h-[calc(100vh-4rem)] place-items-center">
         <Card className="w-full max-w-screen-md border-none px-4 py-8 shadow-none transition-all duration-300 md:py-0">
            <CardContent className="p-0">
               <AiCalculator />
            </CardContent>
         </Card>
      </div>
   )
}

const AiCalculator: React.FC = () => {
   const dialog = useDisclosure()
   const { isCopied, copyToClipboard } = useCopyToClipboard()

   const [isLoading, setIsLoading] = React.useState(false)
   const [streamedText, setStreamedText] = React.useState('')
   const [isCompleted, setIsCompleted] = React.useState(false)
   const [error, setError] = React.useState('')

   const formattedAnimatedText = useAnimatedText(streamedText)
   const form = useForm<PriceEstimate>({
      resolver: zodResolver(PriceEstimateSchema),
      defaultValues: {
         tasks: [{ description: '', hours: '', difficulty: 2 }],
         config: {
            hourlyRate: '',
            safetyMargin: ''
         },
         context: { projectContext: '' },
         aiAnalysis: null
      }
   })

   const onSubmit = async (values: PriceEstimate) => {
      setIsLoading(true)
      setStreamedText('')
      try {
         const result = await handleAiAnalysis(values, (text) =>
            setStreamedText(text)
         )

         if (result) {
            const valueMatch = result.match(
               /Valor sugerido:.*?R\$\s*([\d,.]+)/i
            )
            form.setValue('aiAnalysis', {
               suggestedTotal: valueMatch
                  ? Number(valueMatch[1].replace(/\./g, '').replace(',', '.'))
                  : 0,
               explanation: result
            })
         }
      } catch (error) {
         console.error('Erro:', error)
      } finally {
         setIsLoading(false)
      }
   }

   const handleAiAnalysis = async (
      values: PriceEstimate,
      onStreamUpdate: (text: string) => void
   ) => {
      setIsCompleted(false)
      setStreamedText('')
      setIsLoading(true)
      try {
         const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
         if (!apiKey) {
            console.error('API Key não encontrada!')
            setError('API Key não encontrada!')
            dialog.open()
            return
         }

         const genAI = new GoogleGenerativeAI(apiKey)
         const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

         const totalHours = values.tasks.reduce(
            (sum, task) => sum + (Number(task.hours) || 0),
            0
         )
         const baseTotal = values.tasks.reduce(
            (sum, task) =>
               sum +
               (Number(task.hours) || 0) * Number(values.config.hourlyRate),
            0
         )

         const prompt = `Você é um especialista em precificação de projetos freelance com vasta experiência no mercado.
            Analise cuidadosamente os dados fornecidos e gere uma resposta detalhada e profissional em Markdown.

            IMPORTANTE: Sua resposta DEVE seguir EXATAMENTE esta estrutura, mantendo a formatação Markdown:

            # Valor sugerido: R$ [VALOR_CALCULADO]
            > Confiança da análise: 85%


            ## Explicação
            [Explicação clara e objetiva do valor sugerido, considerando o valor base calculado e justificando eventuais ajustes. Foque em demonstrar o valor para o cliente.]

            ## Análise de mercado
            [Análise do cenário atual do mercado, posicionamento do projeto e justificativa do valor em relação à concorrência.]

            ## Fatores considerados
            [Liste em tópicos os principais fatores que influenciaram a precificação, como:
            - Valor percebido pelo cliente
            - Complexidade técnica
            - Expertise necessária
            - Prazos e urgência
            - Outros fatores relevantes]

            ## Recomendações
            [Recomendações práticas para o sucesso do projeto e da negociação, incluindo:
            - Sugestões contratuais
            - Estratégias de comunicação
            - Possíveis pacotes ou opções
            - Pontos de atenção]

            ## Conclusão
            [Resumo final justificando o valor e destacando os principais benefícios para o cliente]

            ## Negociação
            [Estratégias e dicas para a negociação do valor, incluindo possíveis margens de flexibilidade]

            DADOS DO PROJETO:
            ${values.context.projectContext}

            INFORMAÇÕES TÉCNICAS:
            - Horas totais estimadas: ${totalHours}h
            - Taxa horária: R$${values.config.hourlyRate}/h
            - Margem de segurança: ${values.config.safetyMargin}%
            - Valor base: ${formatCurrency(baseTotal)}

            ESCOPO E TAREFAS:
            ${values.tasks
               .map(
                  (task) =>
                     `- ${task.description} (${task.hours}h)
                     Complexidade: ${['Muito fácil', 'Fácil', 'Médio', 'Intermediário', 'Difícil', 'Muito difícil'][task.difficulty]}`
               )
               .join('\n')}
            `

         const result = await model.generateContentStream(prompt)
         let fullResponse = ''

         for await (const chunk of result.stream) {
            const chunkText = chunk.text()
            fullResponse += chunkText
            onStreamUpdate(fullResponse)
         }

         const valueMatch = fullResponse.match(
            /Valor sugerido:.*?R\$\s*([\d,.]+)/i
         )
         const suggestedTotal = valueMatch
            ? Number(valueMatch[1].replace(/\./g, '').replace(',', '.'))
            : 0

         form.setValue('aiAnalysis', {
            suggestedTotal,
            explanation: fullResponse
         })

         setIsCompleted(true)
         return fullResponse
      } catch (error: any) {
         console.error('Erro na análise da IA:', error)
         setError(
            `Erro ao processar resposta da IA: ${error.message || 'Não foi possível processar a resposta da IA.'}`
         )
         dialog.open()
      } finally {
         setIsLoading(false)
      }
   }

   return (
      <React.Fragment>
         <div className="space-y-6 py-8">
            <Form {...form}>
               <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
               >
                  <div className="space-y-4">
                     <h3 className="text-lg font-semibold">Lista de tarefas</h3>
                     {form.watch('tasks').map((task, index) => (
                        <div
                           key={index}
                           className="space-y-4 rounded-lg bg-gray-50 p-4"
                        >
                           <div className="flex flex-col gap-4 sm:flex-row">
                              <FormField
                                 control={form.control}
                                 name={`tasks.${index}.description`}
                                 render={({ field }) => (
                                    <FormItem className="flex-grow">
                                       <FormLabel>
                                          Descrição da tarefa
                                       </FormLabel>
                                       <FormControl>
                                          <Input
                                             placeholder="Ex: Desenvolver a tela de login"
                                             {...field}
                                          />
                                       </FormControl>
                                       <FormMessage />
                                    </FormItem>
                                 )}
                              />
                              <FormField
                                 control={form.control}
                                 name={`tasks.${index}.hours`}
                                 render={({ field }) => (
                                    <FormItem className="sm:w-56">
                                       <FormLabel>Horas previstas</FormLabel>
                                       <FormControl>
                                          <Input
                                             type="number"
                                             placeholder="Ex: 10"
                                             {...field}
                                          />
                                       </FormControl>
                                       <FormMessage />
                                    </FormItem>
                                 )}
                              />
                              <Button
                                 type="button"
                                 variant="ghost"
                                 className="self-end p-2 text-red-500 hover:text-red-700 sm:mt-8"
                                 onClick={() =>
                                    form.watch('tasks').length > 1 &&
                                    form.setValue(
                                       'tasks',
                                       form
                                          .watch('tasks')
                                          .filter((_, i) => i !== index)
                                    )
                                 }
                              >
                                 <Trash2 size={20} />
                              </Button>
                           </div>
                           <FormField
                              control={form.control}
                              name={`tasks.${index}.difficulty`}
                              render={({ field }) => (
                                 <FormItem>
                                    <FormLabel className="no-selection">
                                       Nível de dificuldade
                                    </FormLabel>
                                    <FormControl>
                                       <div className="space-y-2">
                                          <Slider
                                             min={0}
                                             max={5}
                                             step={1}
                                             value={field.value}
                                             onValueChange={(value) =>
                                                field.onChange(value)
                                             }
                                          />
                                          <div className="no-selection text-sm text-gray-600">
                                             {
                                                [
                                                   'Muito fácil',
                                                   'Fácil',
                                                   'Médio',
                                                   'Intermediário',
                                                   'Difícil',
                                                   'Muito difícil'
                                                ][field.value]
                                             }
                                          </div>
                                       </div>
                                    </FormControl>
                                    <FormMessage />
                                 </FormItem>
                              )}
                           />
                        </div>
                     ))}
                     <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                           form.setValue('tasks', [
                              ...form.watch('tasks'),
                              { description: '', hours: '', difficulty: 0 }
                           ])
                        }
                        className="no-selection flex items-center gap-2"
                     >
                        <Plus size={20} />
                        Adicionar Tarefa
                     </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                     <FormField
                        control={form.control}
                        name="config.hourlyRate"
                        render={({ field }) => (
                           <FormItem>
                              <FormLabel
                                 tooltip={
                                    <TooltipGenericMessage
                                       title="Taxa horária"
                                       description="É o valor que você cobra por hora de trabalho."
                                    />
                                 }
                              >
                                 Taxa horária
                              </FormLabel>
                              <div className="flex items-center gap-2">
                                 <FormControl>
                                    <Input
                                       type="number"
                                       placeholder="Valor por hora"
                                       {...field}
                                    />
                                 </FormControl>
                              </div>
                              <FormMessage />
                           </FormItem>
                        )}
                     />
                     <FormField
                        control={form.control}
                        name="config.safetyMargin"
                        render={({ field }) => (
                           <FormItem>
                              <FormLabel
                                 tooltip={
                                    <TooltipGenericMessage
                                       title="Margem"
                                       description="É o valor que você adiciona ao valor base para garantir uma margem de lucro."
                                    />
                                 }
                              >
                                 Margem de segurança (%)
                              </FormLabel>
                              <div className="flex items-center gap-2">
                                 <FormControl>
                                    <Input
                                       type="number"
                                       placeholder="Ex: 20"
                                       {...field}
                                    />
                                 </FormControl>
                              </div>
                              <FormMessage />
                           </FormItem>
                        )}
                     />
                  </div>
                  <FormField
                     control={form.control}
                     name="context.projectContext"
                     render={({ field }) => (
                        <FormItem>
                           <FormLabel
                              tooltip={
                                 <TooltipGenericMessage
                                    title="Contexto do projeto"
                                    description="Descreva o contexto do seu projeto para que a IA possa analisar e sugerir um valor adequado. A IA considerará: complexidade técnica, escopo, prazos, tecnologias, e gerará um relatório detalhado com valor sugerido, explicação, análise de mercado, fatores considerados e recomendações específicas."
                                 />
                              }
                           >
                              Contexto do projeto
                           </FormLabel>
                           <FormControl>
                              <Textarea
                                 placeholder="Descreva o contexto do projeto, incluindo complexidade, prazo, tecnologias necessárias..."
                                 className="h-40"
                                 {...field}
                              />
                           </FormControl>
                           <FormMessage />
                        </FormItem>
                     )}
                  />
                  <Button
                     loading={isLoading}
                     type="submit"
                     className="flex items-center gap-2"
                  >
                     <Sparkles size={20} className="mr-1.5" />
                     Analisar com IA
                  </Button>
               </form>
            </Form>
            {form.watch('tasks').length > 0 && (
               <div className="rounded-lg bg-gray-50 p-4">
                  <h3 className="text-lg font-semibold">
                     Resumo do cálculo base
                  </h3>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-4">
                     <p>
                        Base:{' '}
                        {formatCurrency(calculateTotal(form.watch()).baseTotal)}
                     </p>
                     <p>
                        Com margem:{' '}
                        {formatCurrency(
                           calculateTotal(form.watch()).withSafetyMargin
                        )}
                     </p>
                     <p className="font-semibold">
                        Final:{' '}
                        {formatCurrency(
                           calculateTotal(form.watch()).withSafetyMargin
                        )}
                     </p>
                  </div>
               </div>
            )}
            <PriceEstimateResult
               isLoading={isLoading}
               formattedText={formattedAnimatedText}
               isCompleted={isCompleted}
               isCopied={isCopied}
               onCopy={() => copyToClipboard(formattedAnimatedText)}
            />
         </div>
         <Dialog open={error !== ''} onOpenChange={() => setError('')}>
            <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
               <DialogHeader>
                  <DialogTitle>Erro ao processar resposta</DialogTitle>
               </DialogHeader>
               <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                     <div className="relative">
                        <pre className="w-full whitespace-pre-wrap break-words rounded-lg bg-gray-100 p-4">
                           <code className="break-all text-sm">{error}</code>
                        </pre>
                     </div>
                     <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="bg-transparent"
                        onClick={() => copyToClipboard(error)}
                     >
                        {isCopied ? (
                           <Check size={20} className="text-green-500" />
                        ) : (
                           <Copy size={20} className="text-gray-500" />
                        )}
                     </Button>
                  </div>
               </div>
            </DialogContent>
         </Dialog>
      </React.Fragment>
   )
}

export default PriceEstimateCalculator
