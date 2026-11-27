<template>
  <PromoCard
    title="Review how many tests failed during a CI test run"
    body="The Debug page shows the latest completed test run for your current checked out commit."
  >
    <template #image>
      <Illustration />
    </template>
    <template #action>
      <PromoAction
        :action="action"
        left-label="1 of 3"
        right-label="Next"
        :right-icon="IconChevronRightSmall"
      />
    </template>
  </PromoCard>
</template>

<script lang="ts" setup>
import PromoCard from '../../components/promo/PromoCard.vue'
import PromoAction from '../../components/promo/PromoAction.vue'

import { IconChevronRightSmall } from '@cypress-design/vue-icon'

import Illustration from '../../assets/debug-guide-skeleton-1.svg'

defineProps<{
  action: () => void
}>()

</script>
