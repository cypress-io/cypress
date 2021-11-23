<template>
  <div
    :class="props.class"
    @click.prevent="openExternal"
    v-html="compiledMarkdown"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'
import MarkdownItClass from '@toycode/markdown-it-class'
import { gql, useMutation } from '@urql/vue'
import { ExternalLink_OpenExternalDocument } from '../../generated/graphql'

gql`
mutation ExternalLink_OpenExternal ($url: String!) {
  openExternal(url: $url)
}
`

const openExternalMutation = useMutation(ExternalLink_OpenExternalDocument)

const props = withDefaults(defineProps<{
  class: string,
  codeClass: string,
  text: string,
}>(), {
  class: '',
  codeClass: '',
})

const md = MarkdownIt({
  html: true,
  linkify: true,
  highlight (str) {
    return `<pre class="border rounded-sm p-3 ${props.codeClass}"><code>${str}</code></pre>`
  },
})

// defines classes to apply to elements that may be in the rendered markdown
// <pre> is handled above in the `highlight` method
md.use(MarkdownItClass, {
  h1: ['font-medium', 'text-4xl', 'mb-6'],
  h2: ['font-medium', 'text-3xl', 'mb-5'],
  h3: ['font-medium', 'text-2xl', 'mb-4'],
  h4: ['font-medium', 'text-1xl', 'mb-3'],
  h5: ['font-medium', 'text-sm', 'mb-3'],
  h6: ['font-medium', 'text-xs', 'mb-3'],
  p: ['my-3 first:mt-0'],
  code: [`border rounded-sm px-2px ${props.codeClass}`],
  a: ['text-blue-500', 'hover:underline'],
  ul: ['list-disc pl-6 my-3'],
  ol: ['list-decimal pl-6 my-3'],
})

const compiledMarkdown = computed(() => md.render(props.text, { sanitize: true }))
const openExternal = (e) => {
  const url = e.target?.href

  if (url) {
    openExternalMutation.executeMutation({ url })
  }
}
</script>
