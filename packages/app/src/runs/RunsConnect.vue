<template>
  <div class="h-full flex">
    <RunsGuide
      :campaign="campaign"
      class="m-auto"
    />
  </div>
</template>

<script lang="ts" setup>
import RunsGuide from './guide/RunsGuide.vue'

defineProps<{
  campaign: string
}>()

</script>
