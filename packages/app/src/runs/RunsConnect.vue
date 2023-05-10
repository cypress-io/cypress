<template>
  <div class="flex h-full mx-[16px]">
    <RunsGuide :campaign="campaign" />
  </div>
</template>

<script lang="ts" setup>
import RunsGuide from './guide/RunsGuide.vue'

defineProps<{
  campaign: string
}>()

</script>
