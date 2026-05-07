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
          :key="cta.href"
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

// Namespaced bannerId — matches the dismissal-bookkeeping convention so cloud
// message ids never collide with the static `BannerIds` enum.
const bannerId = computed(() => `cloud:${props.message.id}`)

const alertStatus = computed(() => {
  return props.message.visualStyle === 'warning' ? 'warning' : 'info'
})

const messageIcon = computed(() => {
  // Warning messages get the warning glyph; info renders without an icon —
  // there isn't a generic "info" glyph in the design system, and using the
  // warning icon for info-style content would misframe the visual severity.
  return props.message.visualStyle === 'warning' ? WarningIcon : undefined
})

const eventData = computed(() => {
  return {
    campaign: props.message.analytics.campaign,
    medium: 'Cloud Message Banner',
    cohort: props.message.analytics.category,
  }
})

// Composables — must be called once during setup, not inside event handlers
// (they internally use `useMutation` which relies on component-instance
// injection). The returned functions are then safe to call from handlers.
const openExternal = useExternalLink()
const { record } = useRecordEvent()

// Impression event is already wired via `TrackedBanner`'s `recordBannerShown`
// (fires once per banner per project, gated on `hasBannerBeenShown`). Click
// and dismiss events are wired below — they don't fire from `TrackedBanner`
// today, so we add them explicitly for cloud messages.

// UTM keys the catalog can populate. `source`, `medium`, and `campaign` are
// auto-derived (binary context, fixed string, and `analytics.campaign`
// respectively) and are NOT in this list — including them would invite drift
// between catalog values and the rest of the binary's UTM convention.
const UTM_FIELDS = ['content', 'term', 'id'] as const

function resolveUtmParams (cta: AppMessageCtaShape): Record<string, string> {
  // Per-field cascade: CTA-level wins, falls back to message-level. Truthy
  // (not nullish) coalescing is intentional — `''` from the catalog should
  // be treated as "not set," otherwise we'd emit `utm_content=` (a real-but-
  // empty parameter that confuses analytics).
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
  // Fires `recordEvent` mutation → `/machine-collect` (because
  // `includeMachineId: true`) → Hightouch `App Message Clicked`. The
  // cypress-services side calls `tracker.identify(req.ctx.user)` first when
  // there's a session cookie, so logged-in users get linked to the event;
  // logged-out users still produce a row keyed by machineId.
  //
  // `messageId` is forwarded explicitly from `TrackedBanner`'s slot scope so
  // it matches the impression and dismiss events fired for the same banner
  // instance — this is the warehouse join key for the funnel
  // (shown → clicked → dismissed).
  //
  // Only `cta_href` is echoed to the analytics event — the bare URL is the
  // stable, queryable key for funnel queries. CTA text/style are not
  // forwarded; UTM params live in the destination URL only.
  void record({
    campaign: props.message.analytics.campaign,
    medium: 'Cloud Message Banner',
    includeMachineId: true,
    messageId: bannerInstanceId,
    payload: {
      action: 'click',
      cta_href: cta.href,
    },
  })

  // Decorate the destination URL with UTMs. `getUrlWithParams` auto-injects
  // `utm_source` from the binary context (Binary: App vs Binary: Launchpad);
  // we add `utm_medium` (fixed) + `utm_campaign` (the message's analytics
  // campaign id, which changes when a message is re-pitched) + any optional
  // `utm_content / utm_term / utm_id` resolved via the cascade above.
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
