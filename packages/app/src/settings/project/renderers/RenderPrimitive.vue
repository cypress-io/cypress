<template>
  <Tooltip
    class="inline"
    placement="right"
  >
    <span
      :class="props.class"
      :data-cy-config="props.from"
    >
      {{ content }},
    </span>
    <template #popper>
      {{ props.from }}
    </template>
  </Tooltip>
</template>

<script lang="ts" setup>
import Tooltip from '@packages/frontend-shared/src/components/Tooltip.vue'
import { computed } from 'vue'

const props = defineProps<{
  value?: string | number| null
  from: string
  class?: string
}>()

const content = computed(() => {
  if (props.value === null || props.value === undefined) {
    return 'null'
  }

  if (typeof props.value === 'string') {
    if (props.value.startsWith('[Function')) {
      return `${props.value.slice(10, -1)} ( ) { ... }`
    }

    return `'${props.value.replaceAll('\'', '\\\'')}'`
  }

  return props.value.toString()
})

</script>
