<template>
  <div>Wrapper inside my component
    <slot :value="value"></slot>
    <button @click="value++">Click me</button>
  </div>
</template>

<script>
import {defineComponent} from 'vue'

export default defineComponent({
  data() {
    return {
      value: 2
    }
  },
  methods: {
    increment() {
      this.value = this.value * 2
    }
  }
})
</script>