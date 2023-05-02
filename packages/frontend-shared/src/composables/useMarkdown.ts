/**
 * Add styling for markdown components here.
 * NOTICE: For Syntax Highlighting, please use the ShikiHighlight component.
 * We could eventually use Shiki as a Markdown plugin, but I don't want to get into it right now.
 */
import type { Ref } from 'vue'
import { computed, unref } from 'vue'
import MarkdownIt from 'markdown-it'
import MarkdownItClass from '@toycode/markdown-it-class'
import { useEventListener, whenever } from '@vueuse/core'
import type { MaybeRef } from '@vueuse/core'
import { useExternalLink } from '../gql-components/useExternalLink'
import { mapValues, isArray, flatten } from 'lodash'

export interface UseMarkdownOptions {
  openExternal?: boolean
  classes?: {
    overwrite?: boolean
    h1?: string[] | string
    h2?: string[] | string
    h3?: string[] | string
    h4?: string[] | string
    h5?: string[] | string
    h6?: string[] | string
    pre?: string[] | string
    p?: string[] | string
    a?: string[] | string
    ul?: string[] | string
    li?: string[] | string
    ol?: string[] | string
    code?: string[] | string
  }
}

const defaultClasses = {
  h1: ['font-medium', 'text-4xl', 'mb-6'],
  h2: ['font-medium', 'text-3xl', 'mb-5'],
  h3: ['font-medium', 'text-2xl', 'mb-4'],
  h4: ['font-medium', 'text-1xl', 'mb-3'],
  h5: ['font-medium', 'text-sm', 'mb-3'],
  h6: ['font-medium', 'text-xs', 'mb-3'],
  p: ['my-3 first:mt-0 text-sm mb-4'],
  pre: ['rounded p-3 bg-white mb-2'],
  code: ['font-medium rounded text-sm px-[4px] py-[2px]'],
  a: ['text-blue-500', 'hover:underline text-sm'],
  ul: ['list-disc pl-6 my-3 text-sm'],
  ol: ['list-decimal pl-6 my-3 text-sm'],
}

const buildClasses = (options) => {
  // --- Normalize + Merge the classes ---
  // Array notation supports a single class or space-delimited classes.
  // Input: `['bg-pink text-pink-500', 'text-medium']`
  // Output: `[...defaults, 'bg-pink', 'text-pink-500', 'text-medium']`

  // String notation is also supported and split by empty space
  // Input: `'bg-pink text-pink-500'`
  // Output: `[...defaults, 'bg-pink', text-pink-500']`

  const _classes = defaultClasses // Constant above

  const buildFlat = (value) => {
    if (isArray(value)) {
      return flatten<string>(value).map((arrValue) => arrValue.split(' '))
    }

    return value?.split(' ') ?? []
  }

  // Transform each value from defaultClasses and merge it with the user
  // input classes.
  if (options.classes) {
    return mapValues(_classes, (defaultValue, key) => {
      const inputClasses = buildFlat(options.classes[key])

      if (options.classes.overwrite) return flatten([...inputClasses])

      return flatten([...buildFlat(defaultValue), ...inputClasses])
    })
  }

  return _classes
}

export const useMarkdown = (target: Ref<HTMLElement>, text: MaybeRef<string>, options: UseMarkdownOptions = {}) => {
  const normalizedOptions: UseMarkdownOptions = {
    ...options,
    openExternal: options.openExternal ?? true,
  }

  const classes = buildClasses(normalizedOptions)

  const md = new MarkdownIt({
    html: true,
    linkify: true,
    highlight (str) {
      return `<pre class="${classes.pre.join(' ')}"><code>${str}</code></pre>`
    },
  })

  md.use(MarkdownItClass, classes)

  if (normalizedOptions.openExternal) {
    const open = useExternalLink()

    whenever(target, () => {
      useEventListener(target, 'click', (e: MouseEvent) => {
        const link = (e.target as HTMLElement).closest('a[href]')

        if (!link) {
          return
        }

        e.preventDefault()

        const url = link.getAttribute('href')

        if (url) {
          open(url)
        }
      })
    })
  }

  return {
    markdown: computed(() => md.render(unref(text), { sanitize: true })),
  }
}
