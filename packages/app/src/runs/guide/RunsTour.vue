<template>
  <Promo
    :campaign="campaign"
    :medium="RUNS_TAB_MEDIUM"
  >
    <template #header>
      <PromoHeader :title="t('runs.empty.title')">
        <template #description>
          <i18n-t
            scope="global"
            keypath="runs.empty.description"
          >
            <ExternalLink :href="guideUrl">
              {{ t('runs.empty.link') }}
            </ExternalLink>
          </i18n-t>
        </template>
        <template #content>
          <RecordPromptAdapter />
        </template>
      </PromoHeader>
    </template>

    <template #cards="{ step, goForward, reset }">
      <TourCard
        v-if="step === 0"
        :action="goForward"
      />
      <GuideCard1
        v-else-if="step === 1"
        :action="goForward"
      />
      <GuideCard2
        v-else-if="step === 2"
        :action="goForward"
      />
      <GuideCard3
        v-else-if="step === 3"
        :action="reset"
      />
    </template>
  </Promo>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import { computed } from 'vue'
import { RUNS_TAB_MEDIUM } from '../utils/constants'
import Promo from '../../components/promo/Promo.vue'
import PromoHeader from '../../components/promo/PromoHeader.vue'
import RecordPromptAdapter from '@cy/gql-components/RecordPromptAdapter.vue'
import GuideCard1 from './GuideCard1.vue'
import GuideCard2 from './GuideCard2.vue'
import GuideCard3 from './GuideCard3.vue'
import TourCard from './TourCard.vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import { getUrlWithParams } from '@packages/frontend-shared/src/utils/getUrlWithParams'

const props = defineProps<{
  campaign: string
}>()

const { t } = useI18n()

const guideUrl = computed(() => {
  return getUrlWithParams({
    url: 'https://on.cypress.io/recording-project-runs',
    params: {
      utm_campaign: props.campaign,
      utm_medium: RUNS_TAB_MEDIUM,
    },
  })
})
</script>
