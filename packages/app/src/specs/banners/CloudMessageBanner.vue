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
  switch (props.message.visualStyle) {
    case 'critical':
      return 'error'
    case 'warning':
      return 'warning'
    case 'promotional':
      return 'promo'
    case 'educational':
    case 'info':
    default:
      return 'info'
  }
})

const messageIcon = computed(() => {
  // Only warning/critical messages get an icon (the warning glyph). info /
  // educational / promotional messages render without an icon — there isn't a
  // generic "info" glyph in the design system, and using the warning icon for
  // info-style content would misframe the visual severity.
  return props.message.visualStyle === 'warning' || props.message.visualStyle === 'critical'
    ? WarningIcon
    : undefined
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
  // (shown → clicked → dismissed). Without explicit forwarding,
  // `useRecordEvent` would mint a fresh `nanoid()` per call and the click
  // would be unjoinable to its own impression.
  void record({
    campaign: props.message.analytics.campaign,
    medium: 'Cloud Message Banner',
    includeMachineId: true,
    messageId: bannerInstanceId,
    payload: {
      action: 'click',
      message_id: props.message.id,
      cta_text: cta.text,
      cta_href: cta.href,
      cta_style: cta.style,
    },
  })

  openExternal(cta.href)
}
</script>
