<template>
  <PromoCard
    :title="t('debugPage.emptyStates.slideshow.step3.title')"
    :body="t('debugPage.emptyStates.slideshow.step3.description')"
  >
    <template #image>
      <Illustration />
    </template>
    <template #action>
      <PromoAction
        :action="action"
        :left-icon="IconActionRestart"
        :right-label="t('debugPage.emptyStates.slideshow.controls.reset')"
      />
    </template>
  </PromoCard>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import PromoCard from '../../components/promo/PromoCard.vue'
import PromoAction from '../../components/promo/PromoAction.vue'

import { IconActionRestart } from '@cypress-design/vue-icon'

import Illustration from '../../assets/debug-guide-skeleton-3.svg'

const { t } = useI18n()

defineProps<{
  action: () => void
}>()

</script>
