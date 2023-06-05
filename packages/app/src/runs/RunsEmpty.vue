<template>
  <div class="h-full flex">
    <RunsTour
      :campaign="RUNS_PROMO_CAMPAIGNS.recordRun"
      class="m-auto"
    />
  </div>
</template>

<script lang="ts" setup>
import RunsTour from './guide/RunsTour.vue'
import { RUNS_PROMO_CAMPAIGNS } from './utils/constants'

</script>
