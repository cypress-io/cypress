<template>
  <RenderArray
    v-if="Array.isArray(value)"
    :value="value"
    :depth="props.depth"
    :color-classes="props.colorClasses"
  /><template v-else>
    <span
      :class="props.colorClasses"
    >{</span><br><template
      v-for="(val, k) in value"
      :key="k"
    >
      <span
        :class="props.colorClasses"
        :style="`margin-left:${(props.depth + 1) * 24}px`"
      >'{{ k }}': </span><RenderObject
        v-if="typeof val === 'object'"
        :record-key="k"
        :value="val"
        :color-classes="props.colorClasses"
        :depth="props.depth + 1"
      /><span
        v-else
        :class="props.colorClasses"
      >{{ renderPrimitive(val) }},</span><br>
    </template>
    <span
      :class="props.colorClasses"
      :style="`margin-left:${props.depth * 24}px`"
    >}</span>
  </template>
</template>

<script lang="ts" setup>
import RenderArray from './RenderArray.vue'
import { renderPrimitive } from './renderPrimitive'

const props = withDefaults(defineProps<{
  value: Record<string, any> | any[]
  colorClasses?: string
  depth?: number
}>(), {
  colorClasses: '',
  depth: 0,
})

</script>
