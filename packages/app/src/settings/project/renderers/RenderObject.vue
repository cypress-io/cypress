<template>
  <span
    :class="props.colorClasses"
    :style="`margin-left:${props.depth * 24}px`"
  >{{ props.recordKey.replaceAll('\'', '\\\'') }}': {{ Array.isArray(value) ?'[': '{' }}</span><br>
  <template v-if="Array.isArray(value)">
    <template
      v-if="Array.isArray(value)"
    >
      <span
        v-for="v in value"
        :key="v"
        :class="props.colorClasses"
        :style="`margin-left:${(props.depth + 1) * 24}px`"
      >'{{ v }}', <br></span>
      <span
        :class="props.colorClasses"
        :style="`margin-left:${(props.depth) * 24}px`"
      >]</span>
    </template>
  </template><template v-else>
    <template
      v-for="(val, k) in value"
      :key="k"
    >
      <RenderObject
        v-if="typeof val === 'object'"
        :record-key="k"
        :value="val"
        :color-classes="props.colorClasses"
        :depth="props.depth + 1"
      /><span
        v-else
        :class="props.colorClasses"
        :style="`margin-left:${(props.depth + 1) * 24}px`"
      >'{{ k }}': <template
        v-if="typeof val === 'string'"
      >'{{ val }}'</template><template
        v-else
      >{{ val }}</template>,</span><br>
    </template>
    <span
      :class="props.colorClasses"
      :style="`margin-left:${props.depth * 24}px`"
    >}</span>
  </template>
</template>

<script lang="ts" setup>
const props = withDefaults(defineProps<{
  recordKey: string
  value: Record<string, any> | any[]
  colorClasses?: string
  depth?: number
}>(), {
  colorClasses: '',
  depth: 1,
})
</script>
