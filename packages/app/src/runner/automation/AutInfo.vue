<template>
  <div
    class="flex flex-col p-[32px] gap-[16px] items-center"
    :style="{width: `${windowWidth}px`}"
  >
    <img
      class="h-[64px] w-[64px]"
      src="../../../../frontend-shared/src/assets/logos/cypress-dark.png"
    >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { useRunnerStyle } from '../useRunnerStyle'

const { windowWidth } = useRunnerStyle()
</script>
