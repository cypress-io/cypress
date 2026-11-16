<template>
  <Promo
    :campaign="campaign"
    :medium="RUNS_TAB_MEDIUM"
  >
    <template #header>
      <PromoHeader title="Connect to view your recorded runs">
        <template #description>
          Cypress Cloud is built for teams who need to do testing at scale.
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

</script>
