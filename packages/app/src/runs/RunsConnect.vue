<template>
  <div class="h-full flex mx-[16px] justify-center items-center">
    <RunsGuide :campaign="campaign" />
  </div>
</template>

<script lang="ts" setup>
import RunsGuide from './guide/RunsGuide.vue'

defineProps<{
  campaign: string
}>()

</script>
