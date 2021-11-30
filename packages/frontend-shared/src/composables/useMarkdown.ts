import { computed, Ref } from 'vue'
import MarkdownIt from 'markdown-it'
import MarkdownItClass from '@toycode/markdown-it-class'
import { useEventListener, whenever } from '@vueuse/core'
import { useExternalLink } from '../gql-components/useExternalLink'

export interface UseMarkdownOptions {
  openExternal?: boolean
  classes?: {
    h1?: string[]
    h2?: string[]
    h3?: string[]
    h4?: string[]
    h5?: string[]
    h6?: string[]
    code?: string[]
    p?: string[]
    a?: string[]
    ul?: string[]
    li?: string[]
    ol?: string[]
  }
}

export const useMarkdown = (target: Ref<HTMLElement>, text: string, options: UseMarkdownOptions = {}) => {
  const classes = options.classes || {}

  options.openExternal = options.openExternal || true

  const md = MarkdownIt({
    html: true,
    linkify: true,
    highlight (str) {
      return `<pre class="rounded p-3"><code>${str}</code></pre>`
    },
  })

  md.use(MarkdownItClass, {
    h1: ['font-medium', 'text-4xl', 'mb-6'].concat(classes.h1 || []),
    h2: ['font-medium', 'text-3xl', 'mb-5'].concat(classes.h2 || []),
    h3: ['font-medium', 'text-2xl', 'mb-4'].concat(classes.h3 || []),
    h4: ['font-medium', 'text-1xl', 'mb-3'].concat(classes.h4 || []),
    h5: ['font-medium', 'text-sm', 'mb-3'].concat(classes.h5 || []),
    h6: ['font-medium', 'text-xs', 'mb-3'].concat(classes.h6 || []),
    p: ['my-3 first:mt-0 text-sm'].concat(classes.p || []),
    code: [`font-medium rounded text-sm px-4px py-2px`].concat(classes.code || []),
    a: ['text-blue-500', 'hover:underline text-sm'].concat(classes.a || []),
    ul: ['list-disc pl-6 my-3 text-sm'].concat(classes.ul || []),
    ol: ['list-decimal pl-6 my-3 text-sm'].concat(classes.ol || []),
  })

  if (options.openExternal) {
    const open = useExternalLink()

    whenever(target, () => {
      useEventListener(target, 'click', (e: MouseEvent) => {
        e.preventDefault()
        const url = (e.target as HTMLElement).getAttribute('href')

        if (url) {
          open(url)
        }
      })
    })
  }

  return {
    markdown: computed(() => md.render(text, { sanitize: true })),
  }
}
