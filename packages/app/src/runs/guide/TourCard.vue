<template>
  <PromoCard
    :title="t('runs.slideshow.tour.title')"
    :body="t('runs.slideshow.tour.description')"
  >
    <template #image>
      <div class="h-[310px] xl:h-[305px]">
        <RecordGuideImage class="ml-[-20px] mr-[-40px] mt-[-20px]" />
      </div>
    </template>
    <template #action>
      <PromoAction
        :action="action"
        :left-icon="IconObjectTassel"
        :right-label="t('runs.slideshow.controls.view')"
      />
    </template>
  </PromoCard>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import PromoCard from '../../components/promo/PromoCard.vue'
import PromoAction from '../../components/promo/PromoAction.vue'

import { IconObjectTassel } from '@cypress-design/vue-icon'

import RecordGuideImage from '../../assets/record-guide.svg'

const { t } = useI18n()

defineProps<{
  action: () => void
}>()

</script>
