<template>
  <button class="border-2 border-gray-500 mx-2">{{ testingType }}</button>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { TestingType } from '../types/shared'

export default defineComponent({
  props: {
    testingType: {
      type: String as PropType<TestingType>,
      required: true
    }
  },
})
</script>