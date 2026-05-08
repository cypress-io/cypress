<template>
  <TrackedBanner
    :banner-id="bannerId"
    data-cy="cloud-message-banner"
    :status="alertStatus"
    :title="message.title"
    class="mb-[16px]"
    :icon="messageIcon"
    dismissible
    :has-banner-been-shown="hasBannerBeenShown"
    :event-data="eventData"
    :dismissal-scope="message.dismissal.scope"
  >
    <template #default="{ bannerInstanceId }">
      <p
        v-if="message.body"
        class="mb-[24px] whitespace-pre-line"
      >
        {{ message.body }}
      </p>
      <div
        v-if="message.ctas.length"
        class="flex flex-row flex-wrap gap-x-[12px] gap-y-[8px] mt-[8px]"
      >
        <Button
          v-for="cta in message.ctas"
          :key="cta.id"
          :variant="cta.style === 'primary' ? 'primary' : 'outline'"
          :data-cy="`cloud-message-cta-${cta.style}`"
          @click="onCtaClick(cta, bannerInstanceId)"
        >
          {{ cta.text }}
        </Button>
      </div>
    </template>
  </TrackedBanner>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TrackedBanner from './TrackedBanner.vue'
import Button from '@cy/components/Button.vue'
import WarningIcon from '~icons/cy/warning_x16.svg'
import { useExternalLink } from '@packages/frontend-shared/src/gql-components/useExternalLink'
import { getUrlWithParams } from '@packages/frontend-shared/src/utils/getUrlWithParams'
import { useRecordEvent } from '../../composables/useRecordEvent'
import type { SpecsListBannersFragment } from '../../generated/graphql'

type AppMessageShape = NonNullable<SpecsListBannersFragment['cloudAppMessages']>[number]
type AppMessageCtaShape = AppMessageShape['ctas'][number]

const props = defineProps<{
  hasBannerBeenShown: boolean
  message: AppMessageShape
}>()

// `cloud:` namespace keeps cloud-message ids from colliding with `BannerIds`.
const bannerId = computed(() => `cloud:${props.message.id}`)

const alertStatus = computed(() => {
  return props.message.visualStyle === 'warning' ? 'warning' : 'info'
})

const messageIcon = computed(() => {
  return props.message.visualStyle === 'warning' ? WarningIcon : undefined
})

const eventData = computed(() => {
  return {
    campaign: props.message.analytics.campaign,
    medium: 'Cloud Message Banner',
    cohort: props.message.analytics.category,
  }
})

// useMutation depends on component-instance injection, so these have to
// resolve during setup, not inside event handlers.
const openExternal = useExternalLink()
const { record } = useRecordEvent()

// `source / medium / campaign` are auto-derived; the catalog only populates
// these supplementary keys.
const UTM_FIELDS = ['content', 'term', 'id'] as const

function resolveUtmParams (cta: AppMessageCtaShape): Record<string, string> {
  // CTA-level overrides message-level, per field. Truthy coalescing
  // (not `??`) so empty strings in the catalog count as "not set."
  const ctaUtm = cta.utm
  const messageUtm = props.message.analytics.utm
  const params: Record<string, string> = {}

  for (const field of UTM_FIELDS) {
    const value = ctaUtm?.[field] || messageUtm?.[field]

    if (value) {
      params[`utm_${field}`] = value
    }
  }

  return params
}

function onCtaClick (cta: AppMessageCtaShape, bannerInstanceId: string): void {
  // `messageId` joins this click to its impression and (eventual) dismiss for
  // the shown → clicked → dismissed funnel; `cta_id` is the stable
  // analytical key for which CTA was clicked (URL-revision-resilient).
  void record({
    campaign: props.message.analytics.campaign,
    medium: 'Cloud Message Banner',
    includeMachineId: true,
    messageId: bannerInstanceId,
    payload: {
      action: 'click',
      cta_id: cta.id,
    },
  })

  // `getUrlWithParams` auto-injects `utm_source` from the running context.
  const decoratedUrl = getUrlWithParams({
    url: cta.href,
    params: {
      utm_medium: 'Cloud Message Banner',
      utm_campaign: props.message.analytics.campaign,
      ...resolveUtmParams(cta),
    },
  })

  openExternal(decoratedUrl)
}
</script>
