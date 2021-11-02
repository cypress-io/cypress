<template>
  <section>
    <h2 class="text-size-16px font-medium text-cool-gray-900 leading-24px align-middle flex">
      <slot name="title" />
      <code
        v-if="code"
        class="mx-8px px-4px text-size-14px font-thin text-purple-500 bg-gray-50 rounded leading-24px "
      >
        {{ code }}
      </code>
    </h2>
    <p class="text-sm text-cool-gray-600 leading-snug mb-16px">
      <slot name="description" />
    </p>
    <slot />
  </section>
</template>

<script lang="ts" setup>
defineProps<{
  code?: string
}>()
</script>
