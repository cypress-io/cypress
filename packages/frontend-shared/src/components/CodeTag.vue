<template>
  <code
    class="font-medium rounded-[4px] mx-[4px] px-[8px] pb-0 text-[14px] leading-[24px] inline-block"
    :class="{ 'bg-gray-50': !bg }"
  >
    <slot />
  </code>
</template>
<script lang="ts" setup>
defineProps<{
  /**
   * In most cases the background will be gray
   * if it should be another color use this flag to
   * eliminate the default
   *
   * NOTE: utility-first css does not allow to adjust
   * specificity, so one cannot "override" a css property
   */
  bg?: boolean
}>()
</script>
