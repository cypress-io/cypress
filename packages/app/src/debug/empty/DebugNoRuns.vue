<template>
  <div class="flex h-full mx-[16px] justify-center items-center">
    <DebugTour :campaign="DEBUG_PROMO_CAMPAIGNS.recordRun" />
  </div>
</template>

<script lang="ts" setup>
import DebugTour from '../guide/DebugTour.vue'
import { DEBUG_PROMO_CAMPAIGNS } from '../utils/constants'

</script>
