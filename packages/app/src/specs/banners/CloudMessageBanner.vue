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
      <div
        v-if="message.body"
        ref="bodyTarget"
        data-cy="cloud-message-banner-body"
        class="cloud-message-body mb-[24px]"
        v-html="bodyMarkdown"
      />
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
import { computed, ref } from 'vue'
import TrackedBanner from './TrackedBanner.vue'
import Button from '@cy/components/Button.vue'
import WarningIcon from '~icons/cy/warning_x16.svg'
import { useExternalLink } from '@packages/frontend-shared/src/gql-components/useExternalLink'
import { useMarkdown } from '@packages/frontend-shared/src/composables/useMarkdown'
import { getUrlWithParams } from '@packages/frontend-shared/src/utils/getUrlWithParams'
import { useRecordEvent } from '../../composables/useRecordEvent'
import type { SpecsListBannersFragment } from '../../generated/graphql'

type AppMessageShape = NonNullable<SpecsListBannersFragment['cloudAppMessages']>[number]
type AppMessageCtaShape = AppMessageShape['ctas'][number]

const props = defineProps<{
  hasBannerBeenShown: boolean
  message: AppMessageShape
}>()

const bannerId = computed(() => `cloud:${props.message.id}`)

// `html: false` so raw HTML in the catalog body is escaped, not rendered.
const bodyTarget = ref()
const { markdown: bodyMarkdown } = useMarkdown(
  bodyTarget,
  computed(() => props.message.body ?? ''),
  { html: false },
)

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

// useMutation must resolve during setup, not inside handlers.
const openExternal = useExternalLink()
const { record } = useRecordEvent()

const UTM_FIELDS = ['content', 'term', 'id'] as const

function resolveUtmParams (cta: AppMessageCtaShape): Record<string, string> {
  // Truthy `||` (not `??`): empty strings in the catalog count as "not set."
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
  void record({
    campaign: props.message.analytics.campaign,
    medium: 'Cloud Message Banner',
    cohort: props.message.analytics.category,
    includeMachineId: true,
    messageId: bannerInstanceId,
    payload: {
      action: 'click',
      cta_id: cta.id,
    },
  })

  // utm_source is injected by getUrlWithParams.
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

<style scoped lang="scss">
.cloud-message-body {
  :deep(p) {
    @apply m-0 text-sm;

    & + p {
      @apply mt-[12px];
    }
  }

  // Tailwind preflight's `font-weight: bolder` on <strong> doesn't render
  // distinctly inside the banner — set it explicitly.
  :deep(strong) {
    @apply font-bold;
  }

  :deep(em) {
    @apply italic;
  }
}
</style>
