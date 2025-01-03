import * as React from 'react'

import { Button } from '@/components/ui/button'
import { ReactMarkdownPlugins } from '@/lib/react-markdown'
import { Check, Copy } from 'lucide-react'

import ReactMarkdown from 'react-markdown'

interface PriceEstimateResultProps {
   isLoading: boolean
   formattedText: string
   isCompleted: boolean
   isCopied: boolean
   onCopy: () => void
}

export const PriceEstimateResult: React.FC<PriceEstimateResultProps> = ({
   isLoading,
   formattedText,
   isCompleted,
   isCopied,
   onCopy
}) => {
   const containerClasses = 'mt-8 space-y-4 rounded-lg bg-gray-50 p-4 sm:p-6'
   const proseClasses =
      'prose prose-slate prose-headings:text-xl prose-headings:my-1 prose-headings:font-semibold prose-blockquote:my-1 prose-a:no-underline prose-blockquote:text-gray-600 prose-blockquote:font-normal prose-blockquote:text-base prose-strong:font-semibold max-w-none font-inter'

   return (
      <div className={containerClasses}>
         <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Resultado</h3>
         </div>
         {formattedText ? (
            <React.Fragment>
               <div className={proseClasses}>
                  <ReactMarkdown {...ReactMarkdownPlugins}>
                     {formattedText}
                  </ReactMarkdown>
               </div>
               {!isLoading && isCompleted && (
                  <Button
                     type="button"
                     variant="outline"
                     size="icon"
                     className="bg-transparent"
                     onClick={onCopy}
                  >
                     {isCopied ? (
                        <Check size={20} className="text-green-500" />
                     ) : (
                        <Copy size={20} className="text-gray-500" />
                     )}
                  </Button>
               )}
            </React.Fragment>
         ) : (
            <p className="text-gray-500">Nenhum resultado para exibir</p>
         )}
      </div>
   )
}
