<template>
  <div>
    <h3 class="font-medium text-gray-900 mb-8px text-18px">
      {{ title }}
    </h3>

    <ul class="text-gray-600 mb-10px">
      <li
        v-for="item in listItems"
        :key="item"
        class="relative mb-4px ml-8px before:content-open-square before:mr-4px before:rounded-r-md before:text-transparent before:h-40px before:w-4px"
      >
        {{ item }}
      </li>
    </ul>
    <h3 class="text-gray-900 mb-8px">
      Code Example
    </h3>
    <CodeEditor
      v-model="localCode"
      class="border rounded h-160px mb-26px"
      readonly
      line-numbers
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
    title: string
    code: string
    listItems: string[]
}>()

const localCode = ref(props.code)
</script>
