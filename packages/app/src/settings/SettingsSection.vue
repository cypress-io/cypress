<template>
  <section>
    <h2 class="font-medium text-size-16px text-gray-900 leading-24px inline-flex items-baseline align-middle relative">
      <div
        :id="`${anchorId}-anchor`"
        class="top-[-10px] left-0 absolute"
      />
      <slot name="title" />
      <code
        v-if="code"
        class="rounded font-normal bg-gray-50 h-20px mx-8px px-4px text-size-14px text-purple-500 leading-24px"
      >
        {{ code }}
      </code>
    </h2>
    <p class="text-sm mb-16px text-gray-600">
      <slot name="description" />
    </p>
    <slot />
  </section>
</template>

<script lang="ts" setup>
defineProps<{
  code?: string
  anchorId?: string
}>()
</script>
