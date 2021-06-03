<template>
  <label 
    class="text-left inline-block border-2 rounded-lg mx-2 p-3 w-xs cursor-pointer" 
    :class="selected ? 'border-blue-500': 'border-gray-500'" 
  >
    <input 
      type="radio" 
      class="mr-3" 
      :name="testingType"
      :checked="selected"
    />
      <img
        class="mr-3 inline" 
        src="https://via.placeholder.com/50" 
      />
      {{ testingType }}
  </label>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { TestingType } from '../types/shared'

export default defineComponent({
  props: {
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