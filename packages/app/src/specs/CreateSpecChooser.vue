<template>
  <component v-for="generator in generators" :key="generator.id"
      :is="generator.card"
      @click="$emit('select', generator.id)"/>
</template>

<script lang="ts" setup>
import type { TestingTypeEnum } from '../generated/graphql'
import { generators as _generators } from './generators'
import type { SpecGenerator } from './generators'
import type { Ref } from 'vue'
import { computed, ref } from 'vue'

const props = defineProps<{
  testingType: TestingTypeEnum
}>()

const generators = computed(() => _generators.filter(g => g.matches(props.testingType)))
</script>