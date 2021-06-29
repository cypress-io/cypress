<template>
  <div class="header-wrapper" @click="$emit('update:modelValue', !modelValue)">
    <slot name="header"></slot>
  </div>
  <slot name="default" v-if="modelValue"></slot>
</template>

<script lang="ts">
import { ref, defineComponent } from 'vue'

export default defineComponent({
  props: {
    modelValue: {
      default: false,
      type: Boolean
    },
  }
})
</script>

<style scoped>
.header-wrapper {
  cursor: pointer;
}
</style>
