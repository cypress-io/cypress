<template>
  <OpenFileInIDE>
    <button
      class="hocus-link-default underline-purple-500"
    >
      <span
        class="text-purple-500 cursor-pointer"
      >
        {{ configFile }}
      </span>
    </button>
  </OpenFileInIDE>
</template>

<script lang="ts" setup>
defineProps<{configFile: string}>()
</script>
