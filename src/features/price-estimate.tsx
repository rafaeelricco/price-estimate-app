'use client'

import * as React from 'react'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { useAnimatedText } from '@/hooks/useAnimatedText'
import { useCopyToClipboard } from '@/hooks/useCopyToClipBoard'
import { calculateTotal, formatCurrency } from '@/utils/formatters'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Copy, Plus, Sparkles, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'

import MarkdownIt from 'markdown-it'

// Inicializa o markdown parser com opções específicas
const md = new MarkdownIt({
   breaks: true,
   html: true,
   linkify: true,
   typographer: true
})

const AiAnalysisSchema = z.object({
   suggestedTotal: z
      .number()
      .nonnegative('O valor sugerido deve ser positivo ou zero'),
   explanation: z.string(),
   marketAnalysis: z.string(),
   confidence: z.number().min(0).max(100).optional(),
   factors: z.array(z.string()).optional(),
   recommendations: z.array(z.string()).optional()
})

const PriceEstimate: React.FC = () => {
   return (
      <div className="grid min-h-[calc(100vh-4rem)] place-items-center">
         <Card className="w-full max-w-screen-md border-none px-6 py-8 shadow-none transition-all duration-300 md:py-0">
            <CardContent className="p-0">
               <AiCalculator />
            </CardContent>
         </Card>
      </div>
   )
}

const AiCalculator: React.FC = () => {
   const { isCopied, copyToClipboard } = useCopyToClipboard()
   console.log('isCopied', isCopied)
   const form = useForm<PriceEstimate>({
      resolver: zodResolver(PriceEstimateSchema),
      defaultValues: {
         tasks: [{ description: '', hours: '', difficulty: 2 }],
         config: {
            hourlyRate: '',
            safetyMargin: '',
            valueAdjustment: ''
         },
         context: { projectContext: '' },
         aiAnalysis: null
      }
   })
   console.log('form', form.getValues())

   const [isLoading, setIsLoading] = React.useState(false)
   const [streamedText, setStreamedText] = React.useState('')
   const [isCompleted, setIsCompleted] = React.useState(false)

   const formattedAnimatedText = useAnimatedText(streamedText)
   console.log('formattedAnimatedText', formattedAnimatedText)

   const onSubmit = async (values: PriceEstimate) => {
      setIsLoading(true)
      setStreamedText('')
      try {
         const result = await handleAiAnalysis(values, (text) => {
            setStreamedText(text)
         })
         if (result) {
            const valueMatch = result.match(
               /Valor sugerido:.*?R\$\s*([\d,.]+)/i
            )
            form.setValue('aiAnalysis', {
               suggestedTotal: valueMatch
                  ? Number(valueMatch[1].replace(/\./g, '').replace(',', '.'))
                  : 0,
               explanation: result,
               marketAnalysis: '',
               confidence: 85,
               factors: [],
               recommendations: []
            })
         }
      } catch (error) {
         console.error('Erro:', error)
      } finally {
         setIsLoading(false)
      }
   }

   const aiAnalysis = form.watch('aiAnalysis')

   const handleAiAnalysis = async (
      values: PriceEstimate,
      onStreamUpdate: (text: string) => void
   ) => {
      setIsCompleted(false)
      try {
         const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
         if (!apiKey) {
            console.error('API Key não encontrada!')
            throw new Error('API Key não configurada')
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

         // Estrutura o prompt para o Gemini
         const prompt = `Você é um especialista em precificação de projetos freelance. 
            Por favor, analise este projeto e forneça uma resposta estruturada usando Markdown.
            A resposta deve seguir exatamente esta estrutura:
   
            <div class="rounded-md bg-white p-4 shadow-sm mb-4">
               <p class="text-2xl font-bold text-green-600">Valor sugerido: R$ [valor]</p>
               <p class="text-sm text-gray-500">Confiança da análise: 85%</p>
            </div>
   
            <div class="space-y-2">
               <h4 class="text-gray-700 mt-4 font-semibold">Explicação</h4>
               [explicação em markdown]
            </div>
   
            <div class="space-y-2">
               <h4 class="text-gray-700 mt-4 font-semibold">Análise de mercado</h4>
               [análise em markdown]
            </div>

            <div class="space-y-2">
               <h4 class="text-gray-700 mt-4 font-semibold">Fatores considerados</h4>
               [fatores considerados em markdown]
            </div>

            <div class="space-y-2">
               <h4 class="text-gray-700 mt-4 font-semibold">Recomendações</h4>
               [recomendações em markdown]
            </div>

            <div class="space-y-2">
               <h4 class="text-gray-700 mt-4 font-semibold">Conclusão</h4>
               [conclusão em markdown]
            </div>
   
            [outras seções conforme necessário, seguindo o mesmo padrão]
   
            CONTEXTO DO PROJETO:
            ${values.context.projectContext}
   
            DETALHES TÉCNICOS:
            - Total de horas estimadas: ${totalHours}h (quebra de linha) 
            - Taxa horária base: R$${values.config.hourlyRate}/h (quebra de linha)
            - Margem de segurança aplicada: ${values.config.safetyMargin}% (quebra de linha)
            - Valor base calculado: ${formatCurrency(baseTotal)} (quebra de linha)
   
            TAREFAS DO PROJETO:
            ${values.tasks
               .map(
                  (task) =>
                     `- ${task.description} (${task.hours}h)
                Nível de dificuldade: ${['Muito fácil', 'Fácil', 'Médio', 'Intermediário', 'Difícil', 'Muito difícil'][task.difficulty]}
               `
               )
               .join('\n')}
               `

         // Gera o conteúdo usando streaming
         const result = await model.generateContentStream(prompt)
         let fullResponse = ''

         // Processa cada chunk da resposta
         for await (const chunk of result.stream) {
            const chunkText = chunk.text()
            fullResponse += chunkText
            // Emite o chunk para animação
            onStreamUpdate(fullResponse)
         }

         // Extrai o valor sugerido para o state (usando regex mais flexível)
         const valueMatch = fullResponse.match(
            /Valor sugerido:.*?R\$\s*([\d,.]+)/i
         )
         const suggestedTotal = valueMatch
            ? Number(valueMatch[1].replace(/\./g, '').replace(',', '.'))
            : 0

         // Atualiza o state com o valor sugerido e o texto completo
         form.setValue('aiAnalysis', {
            suggestedTotal,
            explanation: fullResponse,
            marketAnalysis: '',
            confidence: 85,
            factors: [],
            recommendations: []
         })

         setIsCompleted(true)
         return fullResponse
      } catch (error) {
         console.error('Erro na análise da IA:', error)
         throw new Error('Falha ao processar resposta da IA')
         setIsCompleted(false)
      }
   }

   return (
      <div className="space-y-6">
         <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
               {/* Lista de Tarefas */}
               <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Lista de Tarefas</h3>
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
                                    <FormLabel>Descrição da tarefa</FormLabel>
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

               {/* Configurações - make it stack on mobile */}
               <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
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
                              Margem de segurança
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

                  <FormField
                     control={form.control}
                     name="config.valueAdjustment"
                     render={({ field }) => (
                        <FormItem>
                           <FormLabel
                              tooltip={
                                 <TooltipGenericMessage
                                    title="Ajuste de valor"
                                    description="É o valor que você adiciona ao valor base para garantir uma margem de lucro."
                                 />
                              }
                           >
                              Ajuste de valor
                           </FormLabel>
                           <div className="flex items-center gap-2">
                              <FormControl>
                                 <Input
                                    type="number"
                                    placeholder="Ex: 10"
                                    {...field}
                                 />
                              </FormControl>
                           </div>
                           <FormMessage />
                        </FormItem>
                     )}
                  />
               </div>

               {/* Contexto do Projeto */}
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
                           Análise com IA
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
               <Button type="submit" className="flex items-center gap-2">
                  <Sparkles size={20} />
                  Analisar com IA
               </Button>
            </form>
         </Form>

         {/* Resumo do Cálculo - make it stack on mobile */}
         {form.watch('tasks').length > 0 && (
            <div className="rounded-lg bg-gray-50 p-4">
               <h3 className="text-lg font-semibold">Resumo do cálculo base</h3>
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
                     {formatCurrency(calculateTotal(form.watch()).finalTotal)}
                  </p>
               </div>
            </div>
         )}

         {/* Resultado da IA */}
         {isLoading ? (
            <div className="mt-8 space-y-4 rounded-lg bg-gray-50 p-4 sm:p-6">
               <h3 className="text-xl font-semibold text-gray-900">
                  Análise da IA
               </h3>
               <div className="flex">
                  <div
                     className="prose prose-gray max-w-none"
                     dangerouslySetInnerHTML={{ __html: formattedAnimatedText }}
                  />
                  <span className="animate-pulse text-gray-500">|</span>
               </div>
            </div>
         ) : aiAnalysis ? (
            <div className="mt-8 space-y-4 rounded-lg bg-gray-50 p-4 sm:p-6">
               <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">
                     Análise da IA
                  </h3>
               </div>
               <div
                  className="prose prose-gray max-w-none"
                  dangerouslySetInnerHTML={{ __html: formattedAnimatedText }}
               />
               {isCompleted && (
                  <Button
                     type="button"
                     variant="outline"
                     size="icon"
                     className="bg-transparent"
                     onClick={() => {
                        copyToClipboard(formattedAnimatedText)
                     }}
                  >
                     {isCopied ? (
                        <Check size={20} className="text-green-500" />
                     ) : (
                        <Copy size={20} className="text-gray-500" />
                     )}
                  </Button>
               )}
            </div>
         ) : null}
      </div>
   )
}

// Schema para uma única tarefa
const TaskSchema = z.object({
   description: z
      .string()
      .min(3, 'Descrição deve ter no mínimo 3 caracteres')
      .max(200, 'Descrição muito longa'),
   hours: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Horas devem ser um número positivo'
   }),
   difficulty: z.number().min(0).max(5).default(2)
})

// Schema para as configurações do cálculo
const CalculationConfigSchema = z.object({
   hourlyRate: z
      .string()
      .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
         message: 'Taxa horária deve ser um número positivo'
      }),
   safetyMargin: z
      .string()
      .min(1, 'Margem de segurança é obrigatória')
      .refine(
         (val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100,
         { message: 'Margem de segurança deve ser entre 0 e 100%' }
      ),
   valueAdjustment: z
      .string()
      .refine((val) => !isNaN(Number(val)) && Number(val) >= -100, {
         message: 'Ajuste de valor deve ser maior que -100%'
      })
})

// Schema para o contexto do projeto
const ProjectContextSchema = z.object({
   projectContext: z
      .string()
      .min(30, 'Forneça mais detalhes sobre o projeto')
      .max(1000, 'Contexto muito longo')
})

// Schema completo da aplicação
const PriceEstimateSchema = z.object({
   tasks: z.array(TaskSchema).min(1, 'Adicione pelo menos uma tarefa'),
   config: CalculationConfigSchema,
   context: ProjectContextSchema,
   aiAnalysis: AiAnalysisSchema.nullable().optional()
})

// Types inferidos do schema
type Task = z.infer<typeof TaskSchema>
type CalculationConfig = z.infer<typeof CalculationConfigSchema>
type ProjectContext = z.infer<typeof ProjectContextSchema>
export type PriceEstimate = z.infer<typeof PriceEstimateSchema>
export type AiAnalysis = z.infer<typeof AiAnalysisSchema>

export default PriceEstimate
