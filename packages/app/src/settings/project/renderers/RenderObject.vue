<template>
  <!--
    Render a array, and prevent calling a component that can create circular dependencies
    creating a TS error.
  -->
  <template v-if="Array.isArray(value)">
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
        <template v-if="typeof v === 'object'">
          <RenderObject
            :value="v"
            :color-classes="props.colorClasses"
            :depth="props.depth + 1"
            :from="props.from"
          />
          <span>,</span>
        </template>
        <Tooltip
          v-else
          class="inline"
          placement="right"
        >
          <span
            :class="props.colorClasses"
            :data-cy-config="props.from"
          >
            {{ renderPrimitive(v) }},
          </span>

          <template #popper>
            {{ from }}
          </template>
        </Tooltip>
        <br>
      </span>
      <span
        :class="props.colorClasses"
        :style="`margin-left:${(props.depth) * 24}px`"
      >]</span>
    </template>
  </template>
  <!-- Renders a object structure -->
  <template v-else>
    <span
      :class="props.colorClasses"
      :data-cy-config="props.from"
    >{</span><br><template
      v-for="(val, k) in props.value"
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
      />
      <Tooltip
        v-else
        class="inline"
      >
        <span
          :class="props.colorClasses"
          :data-cy-config="props.from"
        >{{ renderPrimitive(val) }},</span>

        <template #popper>
          {{ from }}
        </template>
      </Tooltip>
      <br>
    </template>
    <span
      :class="props.colorClasses"
      :data-cy-config="props.from"
      :style="`margin-left:${props.depth * 24}px`"
    >}</span>
  </template>
</template>

<script lang="ts" setup>
import { renderPrimitive } from './renderPrimitive'
import Tooltip from '@packages/frontend-shared/src/components/Tooltip.vue'

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
