<template>
  <template v-if="props.browsers.length">
    <span>[</span>
    <span
      v-for="(browser, i) in props.browsers"
      :key="browser.name"
    >
      <template v-if="browser && typeof browser === 'object'">
        <RenderObject
          :value="browser"
          :color-classes="colorClasses"
          :from="props.from"
        />
        <span v-if="i !== browsers.length - 1">,</span>
      </template>
    </span>
    <span>]</span>
  </template>
  <span
    v-else
    :class="colorClasses"
  >None</span>
</template>

<script lang="ts" setup>
import RenderObject from '../renderers/RenderObject.vue'

const props = defineProps<{
  browsers: any[]
  colorClasses?: string
  from: string
}>()

</script>
