import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import rehypeSlug from 'rehype-slug'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'

export const ReactMarkdownPlugins = {
   remarkPlugins: [remarkGfm, remarkBreaks],
   rehypePlugins: [rehypeRaw, rehypeSlug, rehypeHighlight]
}
