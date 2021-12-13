<template>
  <code
    class="font-medium rounded-4px mx-4px px-8px pb-0 text-14px leading-24px inline-block"
    :class="{ 'bg-gray-50': !bg }"
  >
    <slot />
  </code>
</template>
<script lang="ts" setup>
defineProps<{
  bg?: boolean;
}>()
</script>
