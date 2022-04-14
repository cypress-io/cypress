<template>
  <span
    v-if="!props.value.length"
    :class="props.colorClasses"
  >[]</span>
  <template v-else>
    <span :class="props.colorClasses">[</span>
    <br>
    <span
      v-for="v in props.value"
      :key="v"
      :class="props.colorClasses"
      :style="`margin-left:${(props.depth + 1) * 24}px`"
    >
      {{ renderPrimitive(v) }},
      <br>
    </span>
    <span
      :class="props.colorClasses"
      :style="`margin-left:${(props.depth) * 24}px`"
    >]</span>
  </template>
</template>

<script lang="ts" setup>
import { renderPrimitive } from './renderPrimitive'

const props = withDefaults(defineProps<{
  value: any[]
  depth: number
  colorClasses?: string
}>(), {
  colorClasses: '',
})

</script>
