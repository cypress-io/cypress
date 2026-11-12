<template>
  <PromoCard
    title="Build, test, and ship with confidence 🚀"
    body="With Cypress Cloud, you can proactively identify, investigate, and resolve failures, and be a quality champion."
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

import Illustration from '../../assets/runs-guide-skeleton-3.svg'

defineProps<{
  action: () => void
}>()

</script>
