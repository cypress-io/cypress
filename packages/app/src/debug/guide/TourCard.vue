<template>
  <PromoCard
    :title="t('debugPage.emptyStates.slideshow.tour.title')"
    :body="t('debugPage.emptyStates.slideshow.tour.description')"
  >
    <template #image>
      <RecordGuideImage />
    </template>
    <template #action>
      <PromoAction
        :action="action"
        :left-icon="IconObjectTassel"
        :right-label="t('debugPage.emptyStates.slideshow.controls.view')"
      />
    </template>
  </PromoCard>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import PromoCard from '@packages/frontend-shared/src/gql-components/promo/PromoCard.vue'
import PromoAction from '@packages/frontend-shared/src/gql-components/promo/PromoAction.vue'

import { IconObjectTassel } from '@cypress-design/vue-icon'

import RecordGuideImage from '../../assets/record-guide.svg'

const { t } = useI18n()

defineProps<{
  action: () => void
}>()

</script>
