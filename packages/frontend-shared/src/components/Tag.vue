<template>
  <component
    :is="code?'code':'span'"
    class="rounded bg-gray-50 mx-4px px-4px text-14px leading-24px"
  >
    <slot />
  </component>
</template>

<script lang="ts" setup>
defineProps<{
  code?: boolean
}>()
</script>
