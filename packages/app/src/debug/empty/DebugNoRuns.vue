<template>
  <div class="m-[10%]">
    <Promo
      :campaign="DEBUG_PROMO_CAMPAIGNS.recordRun"
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
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import { computed } from 'vue'
import { DEBUG_PROMO_CAMPAIGNS, DEBUG_TAB_MEDIUM } from '../utils/constants'
import Promo from '@packages/frontend-shared/src/gql-components/promo/Promo.vue'
import PromoHeader from '@packages/frontend-shared/src/gql-components/promo/PromoHeader.vue'
import RecordPromptAdapter from '@cy/gql-components/RecordPromptAdapter.vue'
import GuideCard1 from '../guide/GuideCard1.vue'
import GuideCard2 from '../guide/GuideCard2.vue'
import GuideCard3 from '../guide/GuideCard3.vue'
import TourCard from '../guide/TourCard.vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import { getUrlWithParams } from '@packages/frontend-shared/src/utils/getUrlWithParams'

const { t } = useI18n()

const guideUrl = computed(() => {
  return getUrlWithParams({
    url: 'https://on.cypress.io/recording-project-runs',
    params: {
      utm_campaign: DEBUG_PROMO_CAMPAIGNS.recordRun,
      utm_medium: DEBUG_TAB_MEDIUM,
    },
  })
})

</script>
