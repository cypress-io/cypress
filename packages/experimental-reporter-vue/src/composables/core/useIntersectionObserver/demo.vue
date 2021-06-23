<script setup lang="ts">
import { ref } from 'vue'
import { useIntersectionObserver } from '.'

const root = ref(null)
const target = ref(null)
const isVisible = ref(false)

useIntersectionObserver(
  target,
  ([{ isIntersecting }]) => {
    isVisible.value = isIntersecting
  },
  { root },
)
</script>

<template>
  <div ref="root" class="root">
    <p class="notice">
      Scroll me down!
    </p>
    <div ref="target" class="target">
      <p>Hello world!</p>
    </div>
  </div>
  <div class="text-center">
    Element
    <BooleanDisplay
      :value="isVisible"
      true="inside"
      false="outside"
      class="font-bold"
    />
    the viewport
  </div>
</template>

<style scoped>
.root {
  border: 2px dashed #ccc;
  height: 200px;
  margin: 0 2rem 1rem;
  overflow-y: scroll;
}
.notice {
  text-align: center;
  padding: 2em 0;
  margin-bottom: 300px;
  font-style: italic;
  font-size: 1.2rem;
  opacity: 0.8;
}
.target {
  border: 2px dashed var(--c-brand);
  padding: 10px;
  max-height: 150px;
  margin: 0 2rem 1rem;
  margin-bottom: 400px;
}
</style>
