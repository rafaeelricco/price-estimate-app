'use client'

import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { GoogleGenerativeAI } from "@google/generative-ai"
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

   const handleAiAnalysis = async () => {
      try {
         const genAI = new GoogleGenerativeAI("AIzaSyBxIxrtZwisINfm8cAeWVg228zfFMujrwM");
         const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

         const prompt = `Analise este projeto freelance e sugira um preço:
            Contexto do projeto: ${projectContext}
            
            Detalhes técnicos:
            - Total de horas estimadas: ${tasks.reduce((sum, task) => sum + (Number(task.hours) || 0), 0)}
            - Taxa horária base: R$${hourlyRate}
            - Margem de segurança: ${safetyMargin}%
            - Valor base calculado: ${formatCurrency(calculateTotal().baseTotal)}
            
            Por favor, forneça:
            1. Um valor sugerido para o projeto
            2. Uma explicação da sua sugestão
            3. Uma breve análise do mercado`;

         const result = await model.generateContent(prompt);
         const response = result.response.text();
         
         // Parse the response and update state
         // This is a simple example - you might want to add more robust parsing
         const aiSuggestion = {
            suggestedTotal: calculateTotal().finalTotal * 1.15, // You'll want to parse this from the response
            explanation: response,
            marketAnalysis: "Baseado na análise do Gemini"
         };
         
         setAiAnalysis(aiSuggestion);
      } catch (error) {
         console.error("Erro na análise da IA:", error);
         // You might want to add error handling UI here
      }
   }

   const AiCalculator: React.FC = () => (
      <div className="space-y-6">
         {/* Cálculo Manual */}
         <div className="space-y-4">
            <h3 className="text-lg font-semibold">1. Lista de Tarefas</h3>
            {tasks.map((task, index) => (
               <div key={index} className="flex gap-4">
                  <Input
                     type="text"
                     placeholder="Descrição da tarefa"
                     value={task.description}
                     onChange={(e) => handleTaskChange(index, 'description', e.target.value)}
                     className="flex-grow rounded border p-2"
                  />
                  <Input
                     type="number"
                     placeholder="Horas"
                     value={task.hours}
                     onChange={(e) => handleTaskChange(index, 'hours', e.target.value)}
                     className="w-24 rounded border p-2"
                  />
                  <button onClick={() => removeTask(index)} className="p-2 text-red-500 hover:text-red-700">
                     <Trash2 size={20} />
                  </button>
               </div>
            ))}
            <Button onClick={addTask} variant="outline" className="flex items-center gap-2">
               <Plus size={20} />
               Adicionar Tarefa
            </Button>
         </div>

         <div className="grid grid-cols-3 gap-6">
            {/* Taxa Horária */}
            <div className="space-y-2">
               <h3 className="text-lg font-semibold">2. Taxa Horária</h3>
               <div className="flex items-center gap-2">
                  <span>R$</span>
                  <Input
                     type="number"
                     placeholder="Valor por hora"
                     value={hourlyRate}
                     onChange={(e) => setHourlyRate(e.target.value)}
                     className="w-32"
                  />
                  <span>/hora</span>
               </div>
            </div>

            {/* Margem de Segurança */}
            <div className="space-y-2">
               <h3 className="text-lg font-semibold">3. Margem</h3>
               <div className="flex items-center gap-2">
                  <Input
                     type="number"
                     value={safetyMargin}
                     onChange={(e) => setSafetyMargin(e.target.value)}
                     className="w-24"
                  />
                  <span>%</span>
               </div>
            </div>

            {/* Ajuste de Valor */}
            <div className="space-y-2">
               <h3 className="text-lg font-semibold">4. Ajuste</h3>
               <div className="flex items-center gap-2">
                  <Input
                     type="number"
                     value={valueAdjustment}
                     onChange={(e) => setValueAdjustment(e.target.value)}
                     className="w-24"
                  />
                  <span>%</span>
               </div>
            </div>
         </div>

         {/* Resumo do Cálculo Manual */}
         <div className="rounded-lg bg-gray-50 p-4">
            <h3 className="text-lg font-semibold">Resumo do Cálculo Base</h3>
            <div className="mt-2 grid grid-cols-3 gap-4">
               <p>Base: {formatCurrency(calculateTotal().baseTotal)}</p>
               <p>Com Margem: {formatCurrency(calculateTotal().withSafetyMargin)}</p>
               <p className="font-semibold">Final: {formatCurrency(calculateTotal().finalTotal)}</p>
            </div>
         </div>

         {/* Análise com IA */}
         <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold">5. Análise com IA</h3>
            <div className="space-y-4">
               <Textarea
                  placeholder="Descreva o contexto do projeto, incluindo complexidade, prazo, tecnologias necessárias e qualquer informação relevante para a análise..."
                  value={projectContext}
                  onChange={(e) => setProjectContext(e.target.value)}
                  className="h-40 w-full rounded border p-3"
               />
               <Button
                  onClick={handleAiAnalysis}
                  className="flex items-center gap-2 rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
               >
                  <Send size={20} />
                  Analisar com IA
               </Button>
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
