<template>
  <PromoCard
    title="Check if failed CI test runs also fail locally"
    body="Use the Test Runner to run only the tests that failed in your last recorded run."
  >
    <template #image>
      <Illustration />
    </template>
    <template #action>
      <PromoAction
        :action="action"
        left-label="2 of 3"
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

import Illustration from '../../assets/runs-guide-skeleton-2.svg'

defineProps<{
  action: () => void
}>()

</script>
