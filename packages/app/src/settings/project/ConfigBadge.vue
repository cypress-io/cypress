<template>
  <div class="text-sm">
    <p
      class="font-mono whitespace-nowrap rounded px-[2px] w-min"
      data-testid="legend-label"
      v-bind="$attrs"
    >
      {{ label }}
    </p>
    <p class="text-gray-600 leading-snug font-light">
      <slot />
    </p>
  </div>
</template>

<script lang="ts">
export default {
  inheritAttrs: false,
}

</script>
<script lang="ts" setup>
defineProps<{
  label: string
}>()
</script>
