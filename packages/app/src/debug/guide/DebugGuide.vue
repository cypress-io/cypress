<template>
  <Promo
    :campaign="campaign"
    :medium="DEBUG_TAB_MEDIUM"
  >
    <template #header>
      <PromoHeader title="Connect to debug your tests">
        <template #description>
          Cypress Cloud is built for teams who need to do testing at scale.
        </template>
        <template #control>
          <CloudConnectButton
            :utm-medium="DEBUG_TAB_MEDIUM"
          />
        </template>
      </PromoHeader>
    </template>

    <template #cards="{ step, goForward, reset }">
      <GuideCard1
        v-if="step === 0"
        :action="goForward"
        data-cy="guide-card"
      />
      <GuideCard2
        v-else-if="step === 1"
        :action="goForward"
        data-cy="guide-card"
      />
      <GuideCard3
        v-else-if="step === 2"
        :action="reset"
        data-cy="guide-card"
      />
    </template>
  </Promo>
</template>

<script lang="ts" setup>
import CloudConnectButton from '../../runs/CloudConnectButton.vue'
import { DEBUG_TAB_MEDIUM } from '../utils/constants'
import Promo from '../../components/promo/Promo.vue'
import PromoHeader from '../../components/promo/PromoHeader.vue'
import GuideCard1 from '../guide/GuideCard1.vue'
import GuideCard2 from '../guide/GuideCard2.vue'
import GuideCard3 from '../guide/GuideCard3.vue'

defineProps<{
  campaign: string
}>()

</script>
