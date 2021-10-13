<template>
  <div class="w-full px-24px mb-24px">
    <h3 class="text-gray-900 mb-12px text-18px">
      {{ title }}
    </h3>

    <ul class="text-gray-600 mb-10px">
      <li class="relative mb-4px ml-12px">
        <div
          class="absolute block border w-6px h-6px bg-jade-300 -left-11px top-9px rounded-10px border-jade-400"
        />
        {{ listItems[0] }}
        <InlineFragment class="text-14px">
          {{ codeFragment }}
        </InlineFragment>
      </li>
      <li class="relative mb-4px ml-12px">
        <div
          class="absolute block border w-6px h-6px bg-jade-300 -left-11px top-9px rounded-10px border-jade-400"
        />
        {{ listItems[1] }}
      </li>
      <li class="relative mb-4px ml-12px">
        <div
          class="absolute block border w-6px h-6px bg-jade-300 -left-11px top-9px rounded-10px border-jade-400"
        />
        {{ listItems[2] }}
      </li>
    </ul>
    <h3 class="text-gray-900 mb-8px">
      Code Example
    </h3>
    <CodeEditor
      v-model="localCode"
      class="border border-gray-100 rounded h-160px text-14px"
      readonly
      line-numbers
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import InlineFragment from '../components/code/InlineFragment.vue'

const props = withDefaults(defineProps<{
    title: string
    code: string
    listItems: string[]
    codeFragment: string
}>(), {
  code: '',
})

const localCode = ref(props.code)
</script>

<style>
/* very hacky CSS that is going to go away the second we have a better code
rendering solution for our needs than prism */
.prism-editor-wrapper .prism-editor__line-numbers {
    background-color: #f3f4fa !important;
    padding: 8px !important;
    border-right: 1px solid #e1e3ed;
    width: 40px !important;
    line-height: 24px !important;
    font-size: 14px !important;
}

.prism-editor__container {
    padding: 8px 8px !important;
    line-height: 24px !important;
}

.prism-editor-wrapper .token.parameter {
    color: #9095ad !important;
}
</style>
