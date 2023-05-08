<template>
  <div class="promo-box flex flex-col items-center border-gray-100 rounded-lg w-full max-w-[1004px] m-auto">
    <slot name="header" />
    <Slideshow class="w-full">
      <template #default="{ step, goBack, goForward, reset }">
        <slot
          name="cards"
          :step="step"
          :go-back="goBack"
          :go-forward="goForward"
          :reset="reset"
        />
      </template>
    </Slideshow>
  </div>
</template>

<script lang="ts" setup>
import Slideshow from '../../components/Slideshow.vue'
import { watch } from 'vue'
import { gql, useMutation, useQuery } from '@urql/vue'
import { nanoid } from 'nanoid'

import { PromoDocument, Promo_PromoSeenDocument } from '../../generated/graphql'

gql`
fragment _Promo on Query {
  currentProject {
    id
    savedState
  }
}
`

gql`
query Promo {
  ..._Promo
}
`

gql`
mutation Promo_PromoSeen($campaign: String!, $messageId: String!, $medium: String!, $cohort: String) {
  recordEvent(campaign: $campaign, messageId: $messageId, medium: $medium, cohort: $cohort)
}
`

const props = defineProps<{
  campaign: string
  medium: string
  cohort?: string
}>()

const query = useQuery({ query: PromoDocument })
const promoSeenMutation = useMutation(Promo_PromoSeenDocument)

const promoInstanceId = nanoid()

watch([query.data.value], ([queryResult]) => {
  // Wait for this to be resolved
  if (queryResult?.currentProject?.savedState) {
    // This is the first time the user is seeing the slideshow within this context (props.slideshowCampaign)
    promoSeenMutation.executeMutation({
      campaign: props.campaign,
      medium: props.medium,
      cohort: props.cohort ?? null,
      messageId: promoInstanceId,
    })
  }
}, {
  immediate: true,
})

</script>

<style scoped>
.promo-box {
  /* Drop Shadow/0 0 20px, Black @ 8% */
  box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.08);
}
</style>
