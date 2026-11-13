<template>
  <PromoCard
    title="Locally debug failed test runs with visual artifacts"
    body="Easily review screenshots, videos and logs from your tests."
  >
    <template #image>
      <Illustration />
    </template>
    <template #action>
      <PromoAction
        :action="action"
        :left-icon="IconActionRestart"
        right-label="Reset"
      />
    </template>
  </PromoCard>
</template>

<script lang="ts" setup>
import PromoCard from '../../components/promo/PromoCard.vue'
import PromoAction from '../../components/promo/PromoAction.vue'

import { IconActionRestart } from '@cypress-design/vue-icon'

import Illustration from '../../assets/debug-guide-skeleton-3.svg'

defineProps<{
  action: () => void
}>()

</script>
