<template>
  <span
    v-if="!props.value.length"
    :class="props.colorClasses"
  >[]</span>
  <template v-else>
    <span :class="props.colorClasses">[</span>
    <br>
    <span
      v-for="(v) in props.value"
      :key="v"
      :class="props.colorClasses"
      :style="`margin-left:${(props.depth + 1) * 24}px`"
    >
      <template v-if="typeof v === 'object'">
        <RenderObject
          :value="v"
          :color-classes="props.colorClasses"
          :depth="props.depth + 1"
          :from="props.from"
        />
        <span>,</span>
      </template>

      <span v-else>
        {{ renderPrimitive(v) }},
      </span>
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
import RenderObject from '../renderers/RenderObject.vue'

const props = withDefaults(defineProps<{
  value: any[]
  depth: number
  colorClasses?: string
  from: string
}>(), {
  colorClasses: '',
})

</script>
