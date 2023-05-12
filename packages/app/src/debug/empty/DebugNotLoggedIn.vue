<template>
  <div class="flex h-full">
    <DebugGuide
      :campaign="DEBUG_PROMO_CAMPAIGNS.login"
      class="m-auto"
    />
  </div>
</template>

<script lang="ts" setup>
import DebugGuide from '../guide/DebugGuide.vue'
import { DEBUG_PROMO_CAMPAIGNS } from '../utils/constants'

</script>
