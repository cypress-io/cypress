<template>
  <div class="w-full cursor-default px-24px mb-24px">
    <h3 class="text-gray-900 mb-12px text-18px">
      {{ title }}
    </h3>

    <ul class="text-gray-600 mb-10px">
      <li class="relative mb-4px ml-12px">
        <div
          class="absolute block border w-6px h-6px bg-jade-300 -left-11px top-9px rounded-10px border-jade-400"
        />
        {{ listItems[0] }}
        <InlineCodeFragment class="text-14px">
          {{ codeFragment }}
        </InlineCodeFragment>
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
    <ShikiHighlight
      class="border-1 rounded border-gray-100"
      :code="localCode"
      lang="javascript"
      line-numbers
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ShikiHighlight from '@cy/components/ShikiHighlight.vue'
import InlineCodeFragment from '@cy/components/InlineCodeFragment.vue'

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
