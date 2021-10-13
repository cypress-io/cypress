<template>
  <div>
    <h3 class="text-gray-900 mb-12px text-18px">
      {{ title }}
    </h3>

    <ul class="text-gray-600 mb-10px">
      <li
        v-for="item in listItems"
        :key="item"
        class="relative mb-4px ml-12px"
      >
        <div class="absolute block border w-6px h-6px bg-jade-300 -left-11px top-9px rounded-10px border-jade-400" />  {{ item }}
      </li>
    </ul>
    <h3 class="text-gray-900 mb-8px">
      Code Example
    </h3>
    <CodeEditor
      v-model="localCode"
      class="border border-gray-100 rounded h-160px mb-26px text-14px"
      readonly
      line-numbers
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(defineProps<{
    title: string
    code: string
    listItems: string[]
}>(), {
  code: '',
})

const localCode = ref(props.code)
</script>

<style>
.prism-editor-wrapper .prism-editor__line-numbers {
    background-color: #f3f4fa !important;
    padding: 4px 8px !important;
    border-right: 1px solid #E1E3ED;
    width: 40px !important;
    line-height: 24px !important;
    font-size: 14px !important;
}

.prism-editor__container {
    padding: 8px 8px !important;
    line-height: 24px !important;
}
</style>
