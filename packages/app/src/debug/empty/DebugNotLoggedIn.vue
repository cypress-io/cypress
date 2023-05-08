<template>
  <div class="m-[10%]">
    <Promo
      :campaign="DEBUG_PROMO_CAMPAIGNS.login"
      :medium="DEBUG_TAB_MEDIUM"
    >
      <template #header>
        <PromoHeader :title="t('debugPage.emptyStates.notLoggedIn.title')">
          <template #description>
            {{ t('debugPage.emptyStates.notLoggedIn.description') }}
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
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import CloudConnectButton from '../../runs/CloudConnectButton.vue'
import { DEBUG_PROMO_CAMPAIGNS, DEBUG_TAB_MEDIUM } from '../utils/constants'
import Promo from '@packages/frontend-shared/src/gql-components/promo/Promo.vue'
import PromoHeader from '@packages/frontend-shared/src/gql-components/promo/PromoHeader.vue'
import GuideCard1 from '../guide/GuideCard1.vue'
import GuideCard2 from '../guide/GuideCard2.vue'
import GuideCard3 from '../guide/GuideCard3.vue'

const { t } = useI18n()

</script>
