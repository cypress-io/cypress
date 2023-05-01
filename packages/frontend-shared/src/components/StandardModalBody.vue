<template>
  <div :class="variant === 'bare' ? 'p-0' : 'p-[24px]' ">
    <slot />
  </div>
</template>

<script lang="ts" setup>

defineProps<{
  variant?: 'bare'
}>()
</script>
