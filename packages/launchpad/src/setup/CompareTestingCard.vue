<template>
  <div>
    <h3 class="font-medium text-gray-900 mb-8px text-18px">
      {{ title }}
    </h3>

    <ul class="text-gray-600 mb-10px">
      <li
        v-for="item in listItems"
        :key="item"
        class="relative mb-4px ml-10px bullet-item before:w-6px before:h-6px before:bg-jade-300 before:block before:absolute before:-left-12px before:top-9px before:rounded-10px before:border before:border-jade-400"
      >
        {{ item }}
      </li>
    </ul>
    <h3 class="text-gray-900 mb-8px">
      Code Example
    </h3>
    <CodeEditor
      v-model="localCode"
      class="border border-gray-100 rounded h-160px mb-26px"
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
    padding: 8px !important;
    border-right: 1px solid #E1E3ED;
    width: 40px !important;
}

.prism-editor__container {
    padding: 8px 16px !important
}
</style>

<style scoped>
.bullet-item::before {
    content: '';
}
</style>
