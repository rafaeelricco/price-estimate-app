'use client'

import * as React from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Send, Trash2 } from 'lucide-react'

const PriceEstimate: React.FC = () => {
   // Estados compartilhados
   const [tasks, setTasks] = React.useState([{ description: '', hours: '' }])
   const [hourlyRate, setHourlyRate] = React.useState('')
   const [safetyMargin, setSafetyMargin] = React.useState('20')
   const [valueAdjustment, setValueAdjustment] = React.useState('0')

   // Estado para a aba de IA
   const [projectContext, setProjectContext] = React.useState('')
   const [aiAnalysis, setAiAnalysis] = React.useState<{
      suggestedTotal: number
      explanation: string
      marketAnalysis: string
   } | null>(null)

   const handleTaskChange = (index: number, field: string, value: string) => {
      const newTasks = [...tasks]
      newTasks[index] = { ...newTasks[index], [field]: value }
      setTasks(newTasks)
   }

   const addTask = () => {
      setTasks([...tasks, { description: '', hours: '' }])
   }

   const removeTask = (index: number) => {
      if (tasks.length > 1) {
         const newTasks = tasks.filter((_, i) => i !== index)
         setTasks(newTasks)
      }
   }

   const calculateTotal = () => {
      const baseTotal =
         tasks.reduce((sum, task) => {
            return sum + (Number(task.hours) || 0)
         }, 0) * Number(hourlyRate)

      const withSafetyMargin = baseTotal * (1 + Number(safetyMargin) / 100)
      const finalTotal = withSafetyMargin * (1 + Number(valueAdjustment) / 100)

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

   const handleAiAnalysis = () => {
      // Aqui você implementaria a chamada para a IA
      // Por enquanto, vamos simular uma análise
      const baseCalculation = calculateTotal()
      const aiSuggestion = {
         suggestedTotal: baseCalculation.finalTotal * 1.15,
         explanation: `Com base no contexto fornecido e nas informações do projeto:
      - Complexidade das tarefas indicam necessidade de margem adicional
      - Mercado atual suporta valores mais elevados para este tipo de projeto
      - Recomendo um aumento de 15% sobre o cálculo base para garantir melhor rentabilidade`,
         marketAnalysis:
            'O mercado atual para este tipo de projeto está aquecido, permitindo margens mais elevadas.'
      }
      setAiAnalysis(aiSuggestion)
   }

   const totals = calculateTotal()

   const ManualCalculator = () => (
      <div className="space-y-6">
         {/* Lista de Tarefas */}
         <div className="space-y-4">
            <h3 className="text-lg font-semibold">1. Lista de Tarefas</h3>
            {tasks.map((task, index) => (
               <div key={index} className="flex gap-4">
                  <input
                     type="text"
                     placeholder="Descrição da tarefa"
                     value={task.description}
                     onChange={(e) =>
                        handleTaskChange(index, 'description', e.target.value)
                     }
                     className="flex-grow rounded border p-2"
                  />
                  <input
                     type="number"
                     placeholder="Horas"
                     value={task.hours}
                     onChange={(e) =>
                        handleTaskChange(index, 'hours', e.target.value)
                     }
                     className="w-24 rounded border p-2"
                  />
                  <button
                     onClick={() => removeTask(index)}
                     className="p-2 text-red-500 hover:text-red-700"
                  >
                     <Trash2 size={20} />
                  </button>
               </div>
            ))}
            <button
               onClick={addTask}
               className="flex items-center gap-2 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
               <Plus size={20} />
               Adicionar Tarefa
            </button>
         </div>

         {/* Taxa Horária */}
         <div className="space-y-2">
            <h3 className="text-lg font-semibold">2. Taxa Horária</h3>
            <div className="flex items-center gap-2">
               <span>R$</span>
               <input
                  type="number"
                  placeholder="Valor por hora"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="w-32 rounded border p-2"
               />
               <span>/hora</span>
            </div>
         </div>

         {/* Margem de Segurança */}
         <div className="space-y-2">
            <h3 className="text-lg font-semibold">3. Margem de Segurança</h3>
            <div className="flex items-center gap-2">
               <input
                  type="number"
                  value={safetyMargin}
                  onChange={(e) => setSafetyMargin(e.target.value)}
                  className="w-24 rounded border p-2"
               />
               <span>%</span>
            </div>
         </div>

         {/* Ajuste de Valor */}
         <div className="space-y-2">
            <h3 className="text-lg font-semibold">
               4. Ajuste de Valor Percebido
            </h3>
            <div className="flex items-center gap-2">
               <input
                  type="number"
                  value={valueAdjustment}
                  onChange={(e) => setValueAdjustment(e.target.value)}
                  className="w-24 rounded border p-2"
               />
               <span>%</span>
            </div>
         </div>

         {/* Resultados */}
         <div className="mt-8 space-y-2 rounded-lg bg-gray-50 p-4">
            <h3 className="text-lg font-semibold">Resumo do Orçamento</h3>
            <p>Valor Base: {formatCurrency(totals.baseTotal)}</p>
            <p>
               Com Margem de Segurança:{' '}
               {formatCurrency(totals.withSafetyMargin)}
            </p>
            <p className="text-xl font-bold">
               Valor Final: {formatCurrency(totals.finalTotal)}
            </p>
         </div>
      </div>
   )

   const AiCalculator = () => (
      <div className="space-y-6">
         <div className="space-y-4">
            <h3 className="text-lg font-semibold">Análise com IA</h3>
            <div className="space-y-4">
               <textarea
                  placeholder="Descreva o contexto do projeto, incluindo complexidade, prazo, tecnologias necessárias e qualquer informação relevante para a análise..."
                  value={projectContext}
                  onChange={(e) => setProjectContext(e.target.value)}
                  className="h-40 w-full rounded border p-3"
               />
               <button
                  onClick={handleAiAnalysis}
                  className="flex items-center gap-2 rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
               >
                  <Send size={20} />
                  Analisar com IA
               </button>
            </div>
         </div>

         {aiAnalysis && (
            <div className="mt-8 space-y-4 rounded-lg bg-gray-50 p-4">
               <h3 className="text-lg font-semibold">Análise da IA</h3>
               <div className="space-y-2">
                  <p className="text-gray-700">{aiAnalysis.explanation}</p>
                  <p className="italic text-gray-600">
                     {aiAnalysis.marketAnalysis}
                  </p>
                  <p className="mt-4 text-xl font-bold">
                     Valor Sugerido: {formatCurrency(aiAnalysis.suggestedTotal)}
                  </p>
               </div>
            </div>
         )}
      </div>
   )

   return (
      <Card className="mx-auto w-full max-w-4xl">
         <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">
               Calculadora de Projetos Freelancer
            </CardTitle>
         </CardHeader>
         <CardContent>
            <Tabs defaultValue="manual" className="space-y-4">
               <TabsList className="w-full">
                  <TabsTrigger value="manual" className="w-1/2">
                     Calculadora Manual
                  </TabsTrigger>
                  <TabsTrigger value="ai" className="w-1/2">
                     Análise com IA
                  </TabsTrigger>
               </TabsList>
               <TabsContent value="manual">
                  <ManualCalculator />
               </TabsContent>
               <TabsContent value="ai">
                  <AiCalculator />
               </TabsContent>
            </Tabs>
         </CardContent>
      </Card>
   )
}

export default PriceEstimate
