<template>
  <span
    v-if="Object.keys(value).length"
  >
    {<br>
    <template
      v-for="(val, key) in value"
      :key="key"
    >
      <RenderObject
        v-if="typeof val === 'object'"
        :record-key="key"
        :value="val"
        :color-classes="colorClasses"
      /><span
        v-else
        class="ml-24px"
        :class="colorClasses"
      >'{{ key.replaceAll('\'', '\\\'') }}': <template
        v-if="typeof val === 'string'"
      >'{{ val }}'</template><template
        v-else
      >{{ val }}</template>,</span><br>
    </template>
    }
  </span>
  <span
    v-else
  >{}</span>
</template>

<script lang="ts" setup>
import RenderObject from './RenderObject.vue'

defineProps<{
  value: Record<string, any>
  colorClasses?: string
}>()
</script>
