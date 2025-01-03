import * as z from 'zod'

export const AiAnalysisSchema = z.object({
   suggestedTotal: z
      .number()
      .nonnegative('O valor sugerido deve ser positivo ou zero'),
   explanation: z.string()
})

export const TaskSchema = z.object({
   description: z
      .string()
      .min(3, 'Descrição deve ter no mínimo 3 caracteres')
      .max(200, 'Descrição muito longa'),
   hours: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Horas devem ser um número positivo'
   }),
   difficulty: z.number().min(0).max(5).default(2)
})

export const CalculationConfigSchema = z.object({
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
      )
})

export const ProjectContextSchema = z.object({
   projectContext: z
      .string()
      .min(30, 'Forneça mais detalhes sobre o projeto')
      .max(1000, 'Contexto muito longo')
})

export const PriceEstimateSchema = z.object({
   tasks: z.array(TaskSchema).min(1, 'Adicione pelo menos uma tarefa'),
   config: CalculationConfigSchema,
   context: ProjectContextSchema,
   aiAnalysis: AiAnalysisSchema.nullable().optional()
})

export type Task = z.infer<typeof TaskSchema>
export type CalculationConfig = z.infer<typeof CalculationConfigSchema>
export type ProjectContext = z.infer<typeof ProjectContextSchema>
export type PriceEstimate = z.infer<typeof PriceEstimateSchema>
export type AiAnalysis = z.infer<typeof AiAnalysisSchema>
