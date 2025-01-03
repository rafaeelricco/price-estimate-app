import { PriceEstimate } from '@/features/price-estimate.schema'

export const calculateTotal = (values: PriceEstimate) => {
   const baseTotal =
      values.tasks.reduce(
         (sum: number, task: any) => sum + (Number(task.hours) || 0),
         0
      ) * Number(values.config.hourlyRate)

   const withSafetyMargin =
      baseTotal * (1 + Number(values.config.safetyMargin) / 100)

   return {
      baseTotal,
      withSafetyMargin
   }
}

export const formatCurrency = (value: number) => {
   return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
   }).format(value)
}

export const extractSection = (
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
