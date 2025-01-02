'use client'

import * as React from 'react'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
   Form,
   FormControl,
   FormField,
   FormItem,
   FormLabel,
   FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Send, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'

import MarkdownIt from 'markdown-it'

// Inicializa o markdown parser com opções específicas
const md = new MarkdownIt({
   breaks: true,
   html: true,
   linkify: true,
   typographer: true
})

// Schema para uma única tarefa
const TaskSchema = z.object({
   description: z
      .string()
      .min(3, 'Descrição deve ter no mínimo 3 caracteres')
      .max(200, 'Descrição muito longa'),
   hours: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Horas devem ser um número positivo'
   })
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
   context: ProjectContextSchema
})

// Schema para o retorno da API
const AiAnalysisSchema = z.object({
   suggestedTotal: z.number().positive('O valor sugerido deve ser positivo'),
   explanation: z.string().min(1, 'A explicação é obrigatória'),
   marketAnalysis: z.string().min(1, 'A análise de mercado é obrigatória'),
   confidence: z.number().min(0).max(100).optional(),
   factors: z.array(z.string()).optional(),
   recommendations: z.array(z.string()).optional()
})

// Types inferidos do schema
type Task = z.infer<typeof TaskSchema>
type CalculationConfig = z.infer<typeof CalculationConfigSchema>
type ProjectContext = z.infer<typeof ProjectContextSchema>
type PriceEstimate = z.infer<typeof PriceEstimateSchema>
type AiAnalysis = z.infer<typeof AiAnalysisSchema>

const PriceEstimate: React.FC = () => {
   const form = useForm<PriceEstimate>({
      resolver: zodResolver(PriceEstimateSchema),
      defaultValues: {
         tasks: [{ description: '', hours: '' }],
         config: { hourlyRate: '', safetyMargin: '20', valueAdjustment: '0' },
         context: { projectContext: '' }
      }
   })

   function onSubmit(values: z.infer<typeof PriceEstimateSchema>) {
      console.log(values)
   }

   const calculateTotal = (values: PriceEstimate) => {
      const baseTotal =
         values.tasks.reduce(
            (sum, task) => sum + (Number(task.hours) || 0),
            0
         ) * Number(values.config.hourlyRate)

      const withSafetyMargin =
         baseTotal * (1 + Number(values.config.safetyMargin) / 100)
      const finalTotal =
         withSafetyMargin * (1 + Number(values.config.valueAdjustment) / 100)

      return {
         baseTotal,
         withSafetyMargin,
         finalTotal
      }
   }

   const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
         style: 'currency',
         currency: 'BRL'
      }).format(value)
   }

   // Função para parsear a resposta da API
   const parseAiResponse = (response: string): AiAnalysis => {
      try {
         // Limpa a resposta
         const cleanResponse = response.replace(/\n{3,}/g, '\n\n').trim()

         // Extrai o valor sugerido
         const valueMatch = cleanResponse.match(
            /VALOR_SUGERIDO:\s*R?\$?\s*([\d,.]+)/i
         )
         const suggestedTotal = valueMatch
            ? Number(valueMatch[1].replace(/\./g, '').replace(',', '.'))
            : 0

         // Extrai as seções
         const sections = {
            explanation: extractSection(
               cleanResponse,
               'EXPLICAÇÃO:',
               'ANÁLISE_DE_MERCADO:'
            ),
            marketAnalysis: extractSection(
               cleanResponse,
               'ANÁLISE_DE_MERCADO:',
               'FATORES:'
            ),
            factors: extractListItems(
               extractSection(cleanResponse, 'FATORES:', 'RECOMENDAÇÕES:')
            ),
            recommendations: extractListItems(
               extractSection(cleanResponse, 'RECOMENDAÇÕES:', null)
            )
         }

         const analysis: AiAnalysis = {
            suggestedTotal,
            explanation: formatSection(sections.explanation),
            marketAnalysis: formatSection(sections.marketAnalysis),
            confidence: 85,
            factors: sections.factors.map(formatListItem),
            recommendations: sections.recommendations.map(formatListItem)
         }

         return AiAnalysisSchema.parse(analysis)
      } catch (error) {
         console.error('Erro ao parsear resposta da IA:', error)
         throw new Error('Falha ao processar resposta da IA')
      }
   }

   // Helper function to extract sections
   const extractSection = (
      text: string,
      startMarker: string,
      endMarker: string | null
   ): string => {
      const startIndex = text.indexOf(startMarker)
      if (startIndex === -1) return ''

      const start = startIndex + startMarker.length
      const end = endMarker ? text.indexOf(endMarker, start) : text.length

      return text.slice(start, end === -1 ? text.length : end).trim()
   }

   // Helper function to extract list items
   const extractListItems = (text: string): string[] => {
      return text
         .split('\n')
         .map((item) => item.trim())
         .filter(
            (item) =>
               item.length > 0 &&
               (item.startsWith('-') || item.startsWith('**'))
         )
         .map((item) => (item.startsWith('-') ? item.slice(1).trim() : item))
   }

   // Função auxiliar para formatar seções
   const formatSection = (text: string): string => {
      return md.render(text.trim())
   }

   // Função auxiliar para formatar itens de lista
   const formatListItem = (text: string): string => {
      // Remove marcadores de lista existentes e formata como item markdown
      const cleanText = text
         .replace(/^[-•*]\s*/, '')
         .replace(/^\*\*(.*?):\*\*/, '**$1:**')
         .trim()
      return md.render(cleanText)
   }

   // Componente para exibir o resultado da análise
   const AiAnalysisResult: React.FC<{ analysis: AiAnalysis }> = ({
      analysis
   }) => {
      return (
         <div className="mt-8 space-y-4 rounded-lg bg-gray-50 p-6">
            <h3 className="text-xl font-semibold text-gray-900">
               Análise da IA
            </h3>

            {/* Valor Sugerido */}
            <div className="rounded-md bg-white p-4 shadow-sm">
               <p className="text-2xl font-bold text-green-600">
                  Valor Sugerido: {formatCurrency(analysis.suggestedTotal)}
               </p>
               {analysis.confidence && (
                  <p className="text-sm text-gray-500">
                     Confiança da análise: {analysis.confidence}%
                  </p>
               )}
            </div>

            {/* Explicação */}
            <div className="space-y-2">
               <h4 className="font-medium text-gray-700">Explicação</h4>
               <div
                  className="prose prose-gray max-w-none text-gray-600"
                  dangerouslySetInnerHTML={{
                     __html: md.render(analysis.explanation)
                  }}
               />
            </div>

            {/* Análise de Mercado */}
            <div className="space-y-2">
               <h4 className="font-medium text-gray-700">Análise de Mercado</h4>
               <div
                  className="prose prose-gray max-w-none italic text-gray-600"
                  dangerouslySetInnerHTML={{
                     __html: md.render(analysis.marketAnalysis)
                  }}
               />
            </div>

            {/* Fatores Considerados */}
            {analysis.factors && analysis.factors.length > 0 && (
               <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">
                     Fatores Considerados
                  </h4>
                  <ul className="space-y-2">
                     {analysis.factors.map((factor, index) => (
                        <li
                           key={index}
                           className="prose prose-gray max-w-none"
                           dangerouslySetInnerHTML={{
                              __html: md.render(factor)
                           }}
                        />
                     ))}
                  </ul>
               </div>
            )}

            {/* Recomendações */}
            {analysis.recommendations &&
               analysis.recommendations.length > 0 && (
                  <div className="space-y-2">
                     <h4 className="font-medium text-gray-700">
                        Recomendações
                     </h4>
                     <ul className="space-y-2">
                        {analysis.recommendations.map((rec, index) => (
                           <li
                              key={index}
                              className="prose prose-gray max-w-none"
                              dangerouslySetInnerHTML={{
                                 __html: md.render(rec)
                              }}
                           />
                        ))}
                     </ul>
                  </div>
               )}
         </div>
      )
   }

   // Atualização da função handleAiAnalysis
   const handleAiAnalysis = async (values: PriceEstimate) => {
      try {
         const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

         // Debug log
         if (!apiKey) {
            console.error('API Key não encontrada!')
            throw new Error('API Key não configurada')
         }

         // Inicializa o modelo Gemini
         const genAI = new GoogleGenerativeAI(apiKey)
         const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

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
            Por favor, analise este projeto e forneça uma resposta estruturada.

            CONTEXTO DO PROJETO:
            ${values.context.projectContext}

            DETALHES TÉCNICOS:
            - Total de horas estimadas: ${totalHours}h
            - Taxa horária base: R$${values.config.hourlyRate}/h
            - Margem de segurança aplicada: ${values.config.safetyMargin}%
            - Valor base calculado: ${formatCurrency(baseTotal)}

            TAREFAS DO PROJETO:
            ${values.tasks.map((task) => `- ${task.description} (${task.hours}h)`).join('\n')}

            Por favor, forneça sua análise no seguinte formato específico:

            VALOR_SUGERIDO: [apenas o número em reais]

            EXPLICAÇÃO:
            [sua explicação detalhada]

            ANÁLISE_DE_MERCADO:
            [sua análise do mercado]

            FATORES:
            - [liste os fatores considerados]

            RECOMENDAÇÕES:
            - [liste as recomendações]`

         // Gera o conteúdo
         const result = await model.generateContent(prompt)
         const response = result.response.text()

         // Processa a resposta
         try {
            // Extrai o valor sugerido (procura por um número após "VALOR_SUGERIDO:")
            const valueMatch = response.match(
               /VALOR_SUGERIDO:\s*R?\$?\s*([\d,.]+)/i
            )
            const suggestedTotal = valueMatch
               ? Number(valueMatch[1].replace(/\./g, '').replace(',', '.'))
               : baseTotal

            // Extrai as seções usando os marcadores
            const explanation = extractSection(
               response,
               'EXPLICAÇÃO:',
               'ANÁLISE_DE_MERCADO:'
            )
            const marketAnalysis = extractSection(
               response,
               'ANÁLISE_DE_MERCADO:',
               'FATORES:'
            )
            const factorsSection = extractSection(
               response,
               'FATORES:',
               'RECOMENDAÇÕES:'
            )
            const recommendationsSection = extractSection(
               response,
               'RECOMENDAÇÕES:',
               null
            )

            // Processa as listas de fatores e recomendações
            const factors = factorsSection
               .split('\n')
               .filter((line) => line.trim().startsWith('-'))
               .map((line) => line.replace('-', '').trim())

            const recommendations = recommendationsSection
               .split('\n')
               .filter((line) => line.trim().startsWith('-'))
               .map((line) => line.replace('-', '').trim())

            const analysis: AiAnalysis = {
               suggestedTotal,
               explanation: explanation.trim(),
               marketAnalysis: marketAnalysis.trim(),
               confidence: 85,
               factors,
               recommendations
            }

            return AiAnalysisSchema.parse(analysis)
         } catch (error) {
            console.error('Erro ao processar resposta:', error)
            throw new Error('Falha ao processar resposta da IA')
         }
      } catch (error) {
         console.error('Erro na análise da IA:', error)
         throw error
      }
   }

   const AiCalculator: React.FC = () => {
      const form = useForm<PriceEstimate>({
         resolver: zodResolver(PriceEstimateSchema),
         defaultValues: {
            tasks: [{ description: '', hours: '' }],
            config: {
               hourlyRate: '',
               safetyMargin: '20',
               valueAdjustment: '0'
            },
            context: { projectContext: '' }
         }
      })
      const [aiAnalysis, setAiAnalysis] = React.useState<AiAnalysis | null>(
         null
      )
      const [isLoading, setIsLoading] = React.useState(false)

      const onSubmit = async (values: PriceEstimate) => {
         setIsLoading(true)
         try {
            const result = await handleAiAnalysis(values)
            if (result) setAiAnalysis(result)
         } catch (error) {
            console.error('Erro:', error)
         } finally {
            setIsLoading(false)
         }
      }

      return (
         <div className="space-y-6">
            <Form {...form}>
               <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
               >
                  {/* Lista de Tarefas */}
                  <div className="space-y-4">
                     <h3 className="text-lg font-semibold">
                        1. Lista de Tarefas
                     </h3>
                     {form.watch('tasks').map((_, index) => (
                        <div key={index} className="flex gap-4">
                           <FormField
                              control={form.control}
                              name={`tasks.${index}.description`}
                              render={({ field }) => (
                                 <FormItem className="flex-grow">
                                    <FormControl>
                                       <Input
                                          placeholder="Descrição da tarefa"
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
                                 <FormItem className="w-24">
                                    <FormControl>
                                       <Input
                                          type="number"
                                          placeholder="Horas"
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
                              className="p-2 text-red-500 hover:text-red-700"
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
                     ))}
                     <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                           form.setValue('tasks', [
                              ...form.watch('tasks'),
                              { description: '', hours: '' }
                           ])
                        }
                        className="flex items-center gap-2"
                     >
                        <Plus size={20} />
                        Adicionar Tarefa
                     </Button>
                  </div>

                  {/* Configurações */}
                  <div className="grid grid-cols-3 gap-6">
                     <FormField
                        control={form.control}
                        name="config.hourlyRate"
                        render={({ field }) => (
                           <FormItem>
                              <FormLabel>2. Taxa Horária</FormLabel>
                              <div className="flex items-center gap-2">
                                 <span>R$</span>
                                 <FormControl>
                                    <Input
                                       type="number"
                                       placeholder="Valor por hora"
                                       {...field}
                                    />
                                 </FormControl>
                                 <span>/hora</span>
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
                              <FormLabel>3. Margem</FormLabel>
                              <div className="flex items-center gap-2">
                                 <FormControl>
                                    <Input type="number" {...field} />
                                 </FormControl>
                                 <span>%</span>
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
                              <FormLabel>4. Ajuste</FormLabel>
                              <div className="flex items-center gap-2">
                                 <FormControl>
                                    <Input type="number" {...field} />
                                 </FormControl>
                                 <span>%</span>
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
                           <FormLabel>5. Análise com IA</FormLabel>
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
                     <Send size={20} />
                     Analisar com IA
                  </Button>
               </form>
            </Form>

            {/* Resumo do Cálculo */}
            {form.watch('tasks').length > 0 && (
               <div className="rounded-lg bg-gray-50 p-4">
                  <h3 className="text-lg font-semibold">
                     Resumo do Cálculo Base
                  </h3>
                  <div className="mt-2 grid grid-cols-3 gap-4">
                     <p>
                        Base:{' '}
                        {formatCurrency(calculateTotal(form.watch()).baseTotal)}
                     </p>
                     <p>
                        Com Margem:{' '}
                        {formatCurrency(
                           calculateTotal(form.watch()).withSafetyMargin
                        )}
                     </p>
                     <p className="font-semibold">
                        Final:{' '}
                        {formatCurrency(
                           calculateTotal(form.watch()).finalTotal
                        )}
                     </p>
                  </div>
               </div>
            )}

            {/* Resultado da IA */}
            {isLoading ? (
               <div className="mt-8 text-center">
                  <span className="text-gray-600">Analisando projeto...</span>
               </div>
            ) : (
               aiAnalysis && (
                  <div className="mt-8 space-y-4 rounded-lg bg-gray-50 p-6">
                     <h3 className="text-xl font-semibold text-gray-900">
                        Análise da IA
                     </h3>

                     {/* Valor Sugerido */}
                     <div className="rounded-md bg-white p-4 shadow-sm">
                        <p className="text-2xl font-bold text-green-600">
                           Valor Sugerido:{' '}
                           {formatCurrency(aiAnalysis.suggestedTotal)}
                        </p>
                        {aiAnalysis.confidence && (
                           <p className="text-sm text-gray-500">
                              Confiança da análise: {aiAnalysis.confidence}%
                           </p>
                        )}
                     </div>

                     {/* Explicação */}
                     <div className="space-y-2">
                        <h4 className="font-medium text-gray-700">
                           Explicação
                        </h4>
                        <div
                           className="prose prose-gray max-w-none text-gray-600"
                           dangerouslySetInnerHTML={{
                              __html: md.render(aiAnalysis.explanation)
                           }}
                        />
                     </div>

                     {/* Análise de Mercado */}
                     <div className="space-y-2">
                        <h4 className="font-medium text-gray-700">
                           Análise de Mercado
                        </h4>
                        <div
                           className="prose prose-gray max-w-none italic text-gray-600"
                           dangerouslySetInnerHTML={{
                              __html: md.render(aiAnalysis.marketAnalysis)
                           }}
                        />
                     </div>

                     {/* Fatores Considerados */}
                     {aiAnalysis.factors && aiAnalysis.factors.length > 0 && (
                        <div className="space-y-2">
                           <h4 className="font-medium text-gray-700">
                              Fatores Considerados
                           </h4>
                           <ul className="space-y-2">
                              {aiAnalysis.factors.map((factor, index) => (
                                 <li
                                    key={index}
                                    className="prose prose-gray max-w-none"
                                    dangerouslySetInnerHTML={{
                                       __html: md.render(factor)
                                    }}
                                 />
                              ))}
                           </ul>
                        </div>
                     )}

                     {/* Recomendações */}
                     {aiAnalysis.recommendations &&
                        aiAnalysis.recommendations.length > 0 && (
                           <div className="space-y-2">
                              <h4 className="font-medium text-gray-700">
                                 Recomendações
                              </h4>
                              <ul className="space-y-2">
                                 {aiAnalysis.recommendations.map(
                                    (rec, index) => (
                                       <li
                                          key={index}
                                          className="prose prose-gray max-w-none"
                                          dangerouslySetInnerHTML={{
                                             __html: md.render(rec)
                                          }}
                                       />
                                    )
                                 )}
                              </ul>
                           </div>
                        )}
                  </div>
               )
            )}
         </div>
      )
   }

   return (
      <Card className="mx-auto w-full max-w-4xl">
         <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">
               Calculadora de Projetos Freelancer
            </CardTitle>
         </CardHeader>
         <CardContent>
            <Tabs defaultValue="ai" className="space-y-4">
               <TabsList className="w-full">
                  <TabsTrigger value="manual" disabled className="w-1/2">
                     Calculadora Manual
                  </TabsTrigger>
                  <TabsTrigger value="ai" className="w-1/2">
                     Análise com IA
                  </TabsTrigger>
               </TabsList>
               {/* <TabsContent value="manual">
                  <ManualCalculator />
               </TabsContent> */}
               <TabsContent value="ai">
                  <AiCalculator />
               </TabsContent>
            </Tabs>
         </CardContent>
      </Card>
   )
}

export default PriceEstimate
