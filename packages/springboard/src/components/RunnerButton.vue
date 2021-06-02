<template>
  <button class="border-2 border-gray-500 mx-2">{{ testingType }}</button>
</template>

<script lang="ts">
import { useStore } from '../store'
import { TestingType } from '../types/shared'
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  props: {
    testingType: {
      type: String as PropType<TestingType>,
      required: true
    }
  },

  setup() {
    const store = useStore()

    return {
      defaultType: store.getState().testingType
    }
  }
})
</script>