<script setup lang="ts">
import type { SpecTreeFileNode } from '../tree/deriveTree';

const props = defineProps<{
  node: SpecTreeFileNode
}>()
</script>

<template>
  <div :style="{ paddingLeft: `${((node.parent.depth - 2) * 10) + 22}px` }" class="flex">
    <i-cy-document-blank_x16
      class="icon-light-gray-50 icon-dark-gray-200 group-hocus:icon-light-indigo-200 group-hocus:icon-dark-indigo-400"
    />
    {{ props.node.name }}
  </div>
</template>