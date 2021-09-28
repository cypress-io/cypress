<template>
  <section>
    <h2 class="text-xl font-medium text-cool-gray-900 leading-normal">
      <slot name="title" />
    </h2>
    <p class="text-sm text-cool-gray-600 leading-snug mb-16px">
      <slot name="description" />
    </p>
    <slot />
  </section>
</template>

<script lang="ts" setup>
</script>
