<template>
  <PromoCard
    :title="t('runs.slideshow.step1.title')"
    :body="t('runs.slideshow.step1.description')"
  >
    <template #image>
      <Illustration />
    </template>
    <template #action>
      <PromoAction
        :action="action"
        :left-label="t('runs.slideshow.controls.step', [1, 3])"
        :right-label="t('runs.slideshow.controls.next')"
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

import Illustration from '../../assets/runs-guide-skeleton-1.svg'

const { t } = useI18n()

defineProps<{
  action: () => void
}>()

</script>
