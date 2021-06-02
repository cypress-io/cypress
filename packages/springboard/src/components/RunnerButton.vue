<template>
  <label class="inline-block border-2 rounded-lg mx-2 p-3 w-xs cursor-pointer" :class="selected ? 'border-blue-500': 'border-gray-500' " @click="$emit('click')">
    <input type="radio" class="mr-3" name="testingType"/>{{ testingType }}
  </label>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { TestingType } from '../types/shared'

export default defineComponent({
  emits: ["click"],
  props: {
    inputName: {
      type: String,
      required: true
    },
    testingType: {
      type: String as PropType<TestingType>,
      required: true
    },
    selected: {
      type: Boolean,
      default: false
    }
  },
})
</script>