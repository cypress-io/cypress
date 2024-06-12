<template>
  <div class="flex flex-col items-center border border-gray-100 rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.08)]">
    <slot name="header" />
    <Slideshow>
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
  instanceId?: string
}>()

const promoSeenMutation = useMutation(Promo_PromoSeenDocument)

const promoInstanceId = props.instanceId || nanoid()

useQuery({ query: PromoDocument })
.then((queryResult) => {
  const value = queryResult.data.value

  if (value?.currentProject?.savedState) {
    // This is the first time the user is seeing the slideshow within this context (props.slideshowCampaign)
    promoSeenMutation.executeMutation({
      campaign: props.campaign,
      medium: props.medium,
      cohort: props.cohort ?? null,
      messageId: promoInstanceId,
    })
  }
})

</script>
