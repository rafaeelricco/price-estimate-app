import hljs from 'highlight.js'
import bash from 'highlight.js/lib/languages/bash'
import css from 'highlight.js/lib/languages/css'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import type { MDXComponents } from 'mdx/types'
import Image, { ImageProps } from 'next/image'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('tsx', typescript)
hljs.registerLanguage('json', json)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('css', css)

export function useMDXComponents(components: MDXComponents): MDXComponents {
   return {
      h1: ({ children }) => (
         <h1 className="mb-4 text-2xl font-bold">{children}</h1>
      ),
      h2: ({ children }) => (
         <h2 className="mb-3 mt-6 text-xl font-semibold">{children}</h2>
      ),
      p: ({ children }) => <p className="mb-4 text-gray-600">{children}</p>,
      ul: ({ children }) => <ul className="mb-4 list-disc pl-5">{children}</ul>,
      ol: ({ children }) => (
         <ol className="mb-4 list-decimal pl-5">{children}</ol>
      ),
      img: (props) => (
         <Image
            sizes="100vw"
            className="my-4 rounded-lg"
            style={{ width: '100%', height: 'auto' }}
            {...(props as ImageProps)}
         />
      ),
      pre: ({ children }) => (
         <div className="not-prose overflow-x-auto rounded-lg bg-[#0d1117] p-4">
            {children}
         </div>
      ),
      code: ({ children, className }) => {
         const language = className ? className.replace('language-', '') : ''
         const highlightedCode = language
            ? hljs.highlight(String(children), { language }).value
            : String(children)

         return (
            <code
               className={`hljs ${className || ''}`}
               dangerouslySetInnerHTML={{ __html: highlightedCode }}
            />
         )
      },
      ...components
   }
}
