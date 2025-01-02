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
import {
   calculateTotal,
   extractSection,
   formatCurrency
} from '@/utils/formatters'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Sparkles, Trash2 } from 'lucide-react'
import MarkdownIt from 'markdown-it'
import { useForm } from 'react-hook-form'

// Inicializa o markdown parser com opções específicas
const md = new MarkdownIt({
   breaks: true,
   html: true,
   linkify: true,
   typographer: true
})

const AiAnalysisSchema = z.object({
   suggestedTotal: z.number().positive('O valor sugerido deve ser positivo'),
   explanation: z.string().min(1, 'A explicação é obrigatória'),
   marketAnalysis: z.string().min(1, 'A análise de mercado é obrigatória'),
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
            sum + (Number(task.hours) || 0) * Number(values.config.hourlyRate),
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
         ${values.tasks
            .map(
               (task) =>
                  `- ${task.description} (${task.hours}h)
             Nível de dificuldade: ${['Muito fácil', 'Fácil', 'Médio', 'Intermediário', 'Difícil', 'Muito difícil'][task.difficulty]}
            `
            )
            .join('\n')}

         Por favor, considere o nível de dificuldade de cada tarefa ao fazer sua análise e ajuste o valor sugerido de acordo.
         Tarefas mais difíceis podem requerer um valor/hora maior devido à complexidade técnica envolvida.

         Por favor, forneça sua análise no seguinte formato específico:

         VALOR_SUGERIDO: [apenas o número em reais]

         EXPLICAÇÃO:
         [sua explicação detalhada, incluindo como a dificuldade das tarefas influenciou o valor]

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
   const [isLoading, setIsLoading] = React.useState(false)

   const onSubmit = async (values: PriceEstimate) => {
      setIsLoading(true)
      try {
         const result = await handleAiAnalysis(values)
         if (result) form.setValue('aiAnalysis', result)
      } catch (error) {
         console.error('Erro:', error)
      } finally {
         setIsLoading(false)
      }
   }

   const aiAnalysis = form.watch('aiAnalysis')

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

         {/* Resultado da IA - adjust padding for mobile */}
         {isLoading ? (
            <div className="mt-8 text-center">
               <span className="text-gray-600">Analisando projeto...</span>
            </div>
         ) : aiAnalysis ? (
            <div className="mt-8 space-y-4 rounded-lg bg-gray-50 p-4 sm:p-6">
               <h3 className="text-xl font-semibold text-gray-900">
                  Análise da IA
               </h3>

               {/* Valor Sugerido */}
               <div className="rounded-md bg-white p-4 shadow-sm">
                  <p className="text-2xl font-bold text-green-600">
                     Valor sugerido:{' '}
                     {formatCurrency(aiAnalysis?.suggestedTotal ?? 0)}
                  </p>
                  {aiAnalysis?.confidence && (
                     <p className="text-sm text-gray-500">
                        Confiança da análise: {aiAnalysis?.confidence}%
                     </p>
                  )}
               </div>

               {/* Explicação */}
               <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">Explicação</h4>
                  <div
                     className="prose prose-gray max-w-none text-gray-600"
                     dangerouslySetInnerHTML={{
                        __html: md.render(aiAnalysis?.explanation ?? '')
                     }}
                  />
               </div>

               {/* Análise de Mercado */}
               <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">
                     Análise de mercado
                  </h4>
                  <div
                     className="prose prose-gray max-w-none italic text-gray-600"
                     dangerouslySetInnerHTML={{
                        __html: md.render(aiAnalysis?.marketAnalysis ?? '')
                     }}
                  />
               </div>

               {/* Fatores Considerados */}
               {aiAnalysis?.factors?.length &&
                  aiAnalysis?.factors?.length > 0 && (
                     <div className="space-y-2">
                        <h4 className="font-medium text-gray-700">
                           Fatores considerados
                        </h4>
                        <ul className="space-y-2">
                           {aiAnalysis?.factors?.map((factor, index) => (
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
               {aiAnalysis?.recommendations?.length &&
                  aiAnalysis?.recommendations?.length > 0 && (
                     <div className="space-y-2">
                        <h4 className="font-medium text-gray-700">
                           Recomendações
                        </h4>
                        <ul className="space-y-2">
                           {aiAnalysis?.recommendations?.map((rec, index) => (
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
