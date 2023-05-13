<template>
  <PromoCard
    :title="t('debugPage.emptyStates.slideshow.step2.title')"
    :body="t('debugPage.emptyStates.slideshow.step2.description')"
  >
    <template #image>
      <Illustration />
    </template>
    <template #action>
      <PromoAction
        :action="action"
        :left-label="t('debugPage.emptyStates.slideshow.controls.step', [2, 3])"
        :right-label="t('debugPage.emptyStates.slideshow.controls.next')"
        :right-icon="IconChevronRightSmall"
      />
    </template>
  </PromoCard>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import PromoCard from '../../components/promo/PromoCard.vue'
import PromoAction from '../../components/promo/PromoAction.vue'

import { IconChevronRightSmall } from '@cypress-design/vue-icon'

import Illustration from '../../assets/debug-guide-skeleton-2.svg'

const { t } = useI18n()

defineProps<{
  action: () => void
}>()

</script>
