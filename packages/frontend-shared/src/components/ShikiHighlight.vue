<!--
Styling syntax highlighting is a bit messy.

### There are three main presentational styles:
1. Inline
2. Multi-line with line numbers
3. Multi-line without line numbers

The rules for what conditional classes are applied are inside of the
shikiWrapperClasses computed property.

### The styles are spread across the template and the style block
1. Utility classes that affect all modes and don't need to target a specific
   Shiki-only global style are placed on the top-most div.
2. Styling the line numbers themselves must be done inside of a <style>
   block because the selectors are too complex.
3. When using style blocks without WindiCSS classes, you must use !important.
-->

<template>
  <div class="cursor-text text-left relative">
    <div
      v-if="highlighterInitialized"
      ref="codeEl"
      :class="[
        'shiki-wrapper',

        // All styles contain these utility classes
        'overflow-scroll hover:border-indigo-200 relative text-14px leading-24px font-light',

        /**
         * 1. Single line is forced onto one line without any borders. It loses
         *    any additional padding.
         *
         * 2. Multi-line without line-numbers adds padding to compensate for the
         *    lack of margin-right that the line-numbers usually add. It has a
         *    border.
         *
         * 3. Multi-line with line-numbers doesn't have the padding, because the
         *    line numbers have margin-right.
         *
         * 4. Any of these can be wrapped with whitespace: pre-wrap. When using
         *    with line-numbers, the breaks will create a new line.
         */
        {
          'inline': props.inline,
          'wrap': props.wrap,
          'line-numbers': props.lineNumbers,
          'p-8px': !props.lineNumbers && !props.inline,
        },

        props.class,
      ]"
      @click="copyOnClick && isSupported ? () => copyCode() : () => {}"
      v-html="highlightedCode"
    />
    <pre
      v-else
      class="border rounded font-light border-gray-100 py-8px text-14px leading-24px overflow-scroll"
      :class="[props.class, lineNumbers ? 'pl-56px' : 'pl-8px' ]"
    >{{ trimmedCode }}</pre>
    <CopyButton
      v-if="copyButton && isSupported"
      variant="outline"
      tabindex="-1"
      class="absolute"
      :class="numberOfLines === 1 ? 'bottom-5px right-5px' : 'bottom-8px right-8px'"
      :text="code"
      no-icon
    />
  </div>
</template>

<script lang="ts">
import { Highlighter, getHighlighter, setOnigasmWASM, setCDN } from 'shiki'
import onigasm from 'onigasm/lib/onigasm.wasm?url'

setOnigasmWASM(onigasm)
setCDN(`${import.meta.env.BASE_URL}shiki/`)

let highlighter: Highlighter

export const langsSupported = ['typescript', 'javascript', 'ts', 'js', 'css', 'jsx', 'tsx', 'json', 'yaml', 'html'] as const

let langs = langsSupported.concat([])

export type CyLangType = typeof langsSupported[number] | 'plaintext' | 'txt'| 'text'

export async function initHighlighter () {
  if (highlighter) {
    return
  }

  highlighter = await getHighlighter({
    themes: ['cypress.theme'],
    langs,
  })
}

const inheritAttrs = false

export { highlighter, inheritAttrs }
</script>

<script lang="ts" setup>
import { computed, onBeforeMount, Ref, ref } from 'vue'
import { useClipboard } from '@vueuse/core'
import CopyButton from './CopyButton.vue'

const highlighterInitialized = ref(false)

onBeforeMount(async () => {
  await initHighlighter()
  highlighterInitialized.value = true
})

const props = withDefaults(defineProps<{
  code: string;
  lang: CyLangType | undefined;
  lineNumbers?: boolean,
  inline?: boolean,
  wrap?: boolean,
  copyOnClick?: boolean,
  copyButton?: boolean,
  skipTrim?: boolean,
  class?: string | string[] | Record<string, any>
}>(), {
  lineNumbers: false,
  inline: false,
  wrap: false,
  copyOnClick: false,
  copyButton: false,
  skipTrim: false,
  class: undefined,
})

const resolvedLang = computed(() => {
  if (props.lang === 'javascript' || props.lang === 'js' || props.lang === 'jsx') return 'jsx'

  if (props.lang === 'typescript' || props.lang === 'ts' || props.lang === 'tsx') return 'tsx'

  // if the language is not recognized use plaintext
  return props.lang && (langsSupported as readonly string[]).includes(props.lang) ? props.lang : 'plaintext'
})

const trimmedCode = computed(() => props.skipTrim ? props.code : props.code.trim())

const highlightedCode = computed(() => {
  return highlighter?.codeToHtml(trimmedCode.value, resolvedLang.value)
})

const codeEl: Ref<HTMLElement | null> = ref(null)

const { copy, isSupported } = useClipboard()

const copyCode = () => {
  if (codeEl.value) {
    const text = codeEl.value.innerText

    copy(text)
  }
}

const numberOfLines = computed(() => props.code.trim().split('\n').length)

</script>

<!-- This is a scoped style, but we're able to style *outside* of the
ShikiHighligh component. The reason this is possible is because we're using
the special "deep" selector exposed by Vue.

We want to do this because we want to retain the scoped style block to
avoid colliding with styles elsewhere in the document.
-->

<style lang="scss" scoped>

$offset: 1.1em;

.inline:deep(.shiki) {
  @apply bg-gray-50 py-1 px-2 text-gray-500 inline-block;
}

.shiki-wrapper {
  &:deep(.shiki) {
    @apply border-r-transparent min-w-max border-r-10px;
  }

  &.wrap:deep(.line) {
    white-space: pre-wrap;
  }

  &.line-numbers:deep(.shiki) {
    @apply py-8px;
    code {
      counter-reset: step;
      counter-increment: step 0;

      // Keep bg-gray-50 synced with the box-shadows.
      .line::before, .line:first-child::before {
        @apply bg-gray-50 text-right mr-16px min-w-40px px-8px text-gray-500 inline-block sticky;
        left: 0px !important;
        content: counter(step);
        counter-increment: step;
      }

      // Adding padding to the top and bottom of these children adds unwanted
      // line-height to the line. This doesn't look good when you select the text.
      // To avoid this, we use box-shadows and offset the parent container.
      :not(.line:only-child) {
        &:first-child:before {
          box-shadow: 0 (-1 * $offset) theme('colors.gray.50') !important;
        }

        &:last-child::before {
          box-shadow: 0 $offset theme('colors.gray.50') !important;
        }
      }

      // If this rule was used for all of them, the gray would overlap between rows.
      .line:only-child::before {
        box-shadow: (-1 * $offset) 0 0 $offset theme('colors.gray.50') !important;
      }
    }
  }
}
</style>
