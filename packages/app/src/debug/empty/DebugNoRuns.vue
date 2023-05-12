<template>
  <div class="flex h-full">
    <DebugTour
      :campaign="DEBUG_PROMO_CAMPAIGNS.recordRun"
      class="m-auto"
    />
  </div>
</template>

<script lang="ts" setup>
import DebugTour from '../guide/DebugTour.vue'
import { DEBUG_PROMO_CAMPAIGNS } from '../utils/constants'

</script>
