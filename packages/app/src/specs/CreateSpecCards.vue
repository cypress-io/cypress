<template>
  <div>
    <component v-for="generator in generators" :key="generator.id"
      :is="generator.card"
      @click="$emit('select', generator.id)"/>
  </div>
</template>

<script lang="ts" setup>
import { generatorList } from './generators'
import type { GeneratorId } from './generators'
import { computed } from 'vue'

const props = defineProps<{
  testingType: 'component' | 'e2e'
}>()

defineEmits<{
  (eventName: 'select', id: GeneratorId): void
}>()

const generators = computed(() => generatorList.filter(g => g.matches(props.testingType)))
</script>