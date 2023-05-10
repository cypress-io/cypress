<template>
  <Promo
    :campaign="campaign"
    :medium="RUNS_TAB_MEDIUM"
  >
    <template #header>
      <PromoHeader :title="t('runs.connect.title')">
        <template #description>
          {{ t('runs.connect.description') }}
        </template>
        <template #control>
          <CloudConnectButton
            :utm-medium="RUNS_TAB_MEDIUM"
          />
        </template>
      </PromoHeader>
    </template>

    <template #cards="{ step, goForward, reset }">
      <GuideCard1
        v-if="step === 0"
        :action="goForward"
      />
      <GuideCard2
        v-else-if="step === 1"
        :action="goForward"
      />
      <GuideCard3
        v-else-if="step === 2"
        :action="reset"
      />
    </template>
  </Promo>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import { RUNS_TAB_MEDIUM } from '../utils/constants'
import CloudConnectButton from '../CloudConnectButton.vue'
import Promo from '../../components/promo/Promo.vue'
import PromoHeader from '../../components/promo/PromoHeader.vue'
import GuideCard1 from './GuideCard1.vue'
import GuideCard2 from './GuideCard2.vue'
import GuideCard3 from './GuideCard3.vue'

defineProps<{
  campaign: string
}>()

const { t } = useI18n()

</script>
