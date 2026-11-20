<template>
  <PromoCard
    title="Record your first test run to Cypress Cloud"
    body="You're almost there! Start recording your test runs to Cypress Cloud by running the command below in your local or CI terminal."
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
        right-label="View Tour"
      />
    </template>
  </PromoCard>
</template>

<script lang="ts" setup>
import PromoCard from '../../components/promo/PromoCard.vue'
import PromoAction from '../../components/promo/PromoAction.vue'

import { IconObjectTassel } from '@cypress-design/vue-icon'

import RecordGuideImage from '../../assets/record-guide.svg'

defineProps<{
  action: () => void
}>()

</script>
