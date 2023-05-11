<template>
  <div class="flex h-full mx-[16px] justify-center items-center">
    <DebugGuide :campaign="DEBUG_PROMO_CAMPAIGNS.connectProject" />
  </div>
</template>

<script lang="ts" setup>
import DebugGuide from '../guide/DebugGuide.vue'
import { DEBUG_PROMO_CAMPAIGNS } from '../utils/constants'

</script>
