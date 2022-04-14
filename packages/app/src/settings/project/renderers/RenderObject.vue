<template>
  <RenderArray
    v-if="Array.isArray(value)"
    :value="value"
    :depth="props.depth"
    :color-classes="props.colorClasses"
    :data-cy-config="props.from"
  /><template v-else>
    <span
      :class="props.colorClasses"
      :data-cy-config="props.from"
    >{</span><br><template
      v-for="(val, k) in value"
      :key="k"
    >
      <span
        :class="props.colorClasses"
        :style="`margin-left:${(props.depth + 1) * 24}px`"
        :data-cy-config="props.from"
      >{{ k }}: </span><RenderObject
        v-if="typeof val === 'object'"
        :record-key="k"
        :value="val"
        :color-classes="props.colorClasses"
        :depth="props.depth + 1"
        :from="props.from"
      /><span
        v-else
        :class="props.colorClasses"
        :data-cy-config="props.from"
      >{{ renderPrimitive(val) }},</span><br>
    </template>
    <span
      :class="props.colorClasses"
      :data-cy-config="props.from"
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
  from: string
}>(), {
  colorClasses: '',
  depth: 0,
})

</script>
