<template>
  <Promo
    :campaign="campaign"
    :medium="DEBUG_TAB_MEDIUM"
  >
    <template #header>
      <PromoHeader :title="t('debugPage.emptyStates.noRuns.title')">
        <template #description>
          <i18n-t
            scope="global"
            keypath="debugPage.emptyStates.noRuns.description"
          >
            <ExternalLink :href="guideUrl">
              {{ t('debugPage.emptyStates.noRuns.link') }}
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
import { computed } from 'vue'
import { useI18n } from '@cy/i18n'
import { DEBUG_TAB_MEDIUM } from '../utils/constants'
import Promo from '../../components/promo/Promo.vue'
import PromoHeader from '../../components/promo/PromoHeader.vue'
import RecordPromptAdapter from '@cy/gql-components/RecordPromptAdapter.vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import GuideCard1 from './GuideCard1.vue'
import GuideCard2 from './GuideCard2.vue'
import GuideCard3 from './GuideCard3.vue'
import TourCard from './TourCard.vue'

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
      utm_medium: DEBUG_TAB_MEDIUM,
    },
  })
})

</script>
