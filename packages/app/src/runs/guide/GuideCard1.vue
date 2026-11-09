<template>
  <PromoCard
    title="Monitor test failures in real time"
    body="Uncover high-risk failed and flaky tests in CI before they become a problem in production."
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

import Illustration from '../../assets/runs-guide-skeleton-1.svg'

defineProps<{
  action: () => void
}>()

</script>
