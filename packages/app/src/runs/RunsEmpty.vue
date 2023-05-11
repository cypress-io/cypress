<template>
  <div class="h-full flex mx-[16px] justify-center items-center">
    <RunsTour
      :campaign="RUNS_PROMO_CAMPAIGNS.recordRun"
    />
  </div>
</template>

<script lang="ts" setup>
import RunsTour from './guide/RunsTour.vue'
import { RUNS_PROMO_CAMPAIGNS } from './utils/constants'

</script>
