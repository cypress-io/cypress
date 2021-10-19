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
2. Styling the line numbers themselves must be done inside of a <script>
   block because the selectors are too complex.
3. When using style blocks without WindiCSS classes, you must use !important.
-->

<template>
  <div
    v-if="highlighterInitialized"
    :class="[

      'shiki-wrapper',

      // All styles contain these utility classes
      'overflow-scroll relative text-14px leading-24px font-light rounded',

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
        'border-1 border-gray-100': !props.inline,
        'wrap': props.wrap,
        'line-numbers': props.lineNumbers,
        'p-8px': !props.lineNumbers && !props.inline,
      },
    ]"
    v-html="highlightedCode"
  />
</template>

<script lang="ts">
import { Highlighter, getHighlighter, setOnigasmWASM, setCDN } from 'shiki'
import onigasm from 'onigasm/lib/onigasm.wasm?url'

setOnigasmWASM(onigasm)
setCDN('/shiki/')

let highlighter: Highlighter

export async function initHighlighter () {
  if (highlighter) {
    return
  }

  highlighter = await getHighlighter({
    themes: ['cypress.theme'],
    langs: ['typescript', 'javascript', 'css', 'jsx', 'tsx', 'json', 'yaml'],
  })
}

export { highlighter }
</script>

<script lang="ts" setup>
import { computed, onBeforeMount, ref } from 'vue'

const highlighterInitialized = ref(false)

onBeforeMount(async () => {
  await initHighlighter()
  highlighterInitialized.value = true
})

const props = withDefaults(defineProps<{
  code: string;
  lang: 'javascript' | 'typescript' | 'json' | 'js' | 'ts' | 'tsx' | 'jsx' | 'yaml';
  lineNumbers?: boolean,
  inline?: boolean,
  wrap?: boolean,
}>(), {
  lineNumbers: false,
  inline: false,
  wrap: false,
})

const resolvedLang = computed(() => {
  if (props.lang === 'javascript' || props.lang === 'js' || props.lang === 'jsx') return 'jsx'

  if (props.lang === 'typescript' || props.lang === 'ts' || props.lang === 'tsx') return 'tsx'

  return props.lang
})

const highlightedCode = computed(() => {
  return highlighter?.codeToHtml(props.code.trim(), resolvedLang.value)
})

</script>

<!-- This is a scoped style, but we're able to style *outside* of the
ShikiHighligh component. The reason this is possible is because we're using
the special "deep" selector exposed by Vue.

We want to do this because we want to retain the scoped style block to
avoid colliding with styles elsewhere in the document.
-->

<style lang="scss" scoped>

$offset: 1em;

.inline:deep(.shiki) {
  @apply py-1 px-2 bg-gray-50 text-gray-500 inline-block;
}

.shiki-wrapper {

  &:deep(.shiki) {
    @apply min-w-max border-r-10px border-r-transparent py-8px;
  }

  &.wrap:deep(.line) {
    white-space: pre-wrap;
  }

  &.line-numbers:deep(.shiki) {
    code {
      counter-reset: step;
      counter-increment: step 0;

      // Keep bg-gray-50 synced with the box-shadows.
      .line::before, .line:first-child::before {
        @apply bg-gray-50 text-gray-500 min-w-40px inline-block text-right px-8px mr-16px sticky;
        left: 0px !important;
        content: counter(step);
        counter-increment: step;
      }

      // Adding padding to the top and bottom of these children adds unwanted
      // line-height to the line. This doesn't look good when you select the text.
      // To avoid this, we use box-shadows and offset the parent container.
      .line:first-child::before {
        box-shadow: 0 (-1 * $offset) theme('colors.gray.50') !important;
      }

      .line:last-child::before {
        box-shadow: 0 $offset theme('colors.gray.50') !important;
      }
    }
  }
}
</style>
