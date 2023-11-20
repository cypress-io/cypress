<template>
  <div class="cursor-default w-full px-[24px]">
    <h3 class="mb-[12px] text-gray-900 text-[18px]">
      {{ title }}
    </h3>

    <ul class="mb-[10px] text-gray-600">
      <li class="mb-[4px] ml-[12px] relative">
        <div
          class="border bg-jade-300 border-jade-400 rounded-[10px] h-[6px] top-[9px] left-[-11px] w-[6px] absolute block"
        />
        {{ listItems[0] }}
        <InlineCodeFragment class="text-[14px]">
          {{ codeFragment }}
        </InlineCodeFragment>
      </li>
      <li class="mb-[4px] ml-[12px] relative">
        <div
          class="border bg-jade-300 border-jade-400 rounded-[10px] h-[6px] top-[9px] left-[-11px] w-[6px] absolute block"
        />
        {{ listItems[1] }}
      </li>
      <li class="mb-[4px] ml-[12px] relative">
        <div
          class="border bg-jade-300 border-jade-400 rounded-[10px] h-[6px] top-[9px] left-[-11px] w-[6px] absolute block"
        />
        {{ listItems[2] }}
      </li>
    </ul>
    <h3 class="mb-[8px] text-gray-900">
      Code Example
    </h3>
    <ShikiHighlight
      class="rounded border border-gray-100"
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
