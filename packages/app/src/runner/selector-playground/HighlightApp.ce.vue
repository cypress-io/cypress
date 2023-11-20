<template>
  <Highlight
    v-for="(style, i) in styles"
    :key="i"
    :selector="selector"
    :style="style"
  />
</template>

<script lang="ts" setup>
import Highlight from './Highlight.ce.vue'

defineProps <{
  selector: string
  styles: any[]
}>()
</script>
