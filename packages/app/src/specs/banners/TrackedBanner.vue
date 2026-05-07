<template>
  <Alert
    v-model="isAlertDisplayed"
    v-bind="$attrs"
  >
    <slot
      :dismiss="dismiss"
      :bannerInstanceId="bannerInstanceId"
    />
  </Alert>
</template>

<script setup lang="ts">
import Alert from '@packages/frontend-shared/src/components/Alert.vue'
import { computed, onMounted, ref, watchEffect, watch } from 'vue'
import { gql, useMutation, useQuery } from '@urql/vue'
import { TrackedBanner_ProjectStateDocument, TrackedBanner_RecordBannerSeenDocument, TrackedBanner_RecordBannerDismissedDocument, TrackedBanner_SetProjectStateDocument } from '../../generated/graphql'
import { set } from 'lodash'
import { nanoid } from 'nanoid'

type EventData = {
  campaign: string
  medium: string
  cohort?: string
}

type AlertComponentProps = InstanceType<typeof Alert>['$props']
interface TrackedBannerComponentProps extends AlertComponentProps {
  bannerId: string
  hasBannerBeenShown: boolean
  eventData: EventData | undefined
}

gql`
query TrackedBanner_ProjectState {
  currentProject {
    id
    savedState
  }
}
`

gql`
mutation TrackedBanner_SetProjectState($value: String!) {
  setPreferences(type: project, value: $value) {
    ...TestingPreferences
    ...SpecRunner_Preferences
    currentProject {
      id
      savedState
    }
  }
}
`

gql`
mutation TrackedBanner_recordBannerSeen($campaign: String!, $messageId: String!, $medium: String!, $cohort: String, $includeMachineId: Boolean) {
  recordEvent(campaign: $campaign, messageId: $messageId, medium: $medium, cohort: $cohort, includeMachineId: $includeMachineId)
}
`

gql`
mutation TrackedBanner_recordBannerDismissed($campaign: String!, $messageId: String!, $medium: String!, $payload: String!, $includeMachineId: Boolean) {
  recordEvent(campaign: $campaign, messageId: $messageId, medium: $medium, payload: $payload, includeMachineId: $includeMachineId)
}
`

const props = withDefaults(defineProps<TrackedBannerComponentProps>(), {})

const stateQuery = useQuery({ query: TrackedBanner_ProjectStateDocument })
const setStateMutation = useMutation(TrackedBanner_SetProjectStateDocument)
const reportSeenMutation = useMutation(TrackedBanner_RecordBannerSeenDocument)
const reportDismissedMutation = useMutation(TrackedBanner_RecordBannerDismissedDocument)
const bannerInstanceId = ref(nanoid())
const isAlertDisplayed = ref(true)

// Cloud-driven banners send `includeMachineId: true` so events route through
// /machine-collect with the binary's machineId attached (used for unique-user
// dedup in the warehouse, since IP alone is unreliable behind NAT/VPN). The
// existing onboarding banners (Login / Connect / Record / CT-Available) keep
// their long-standing /anon-collect path — changing their analytics shape now
// would alter their historical data continuity.
//
// Declared before `watchEffect` below because the watcher fires synchronously
// at component setup, and `recordBannerShown` reads `isCloudBanner.value`. With
// the const declaration after the watcher, the binding is in the temporal dead
// zone when the watcher first runs.
const isCloudBanner = computed(() => props.bannerId.startsWith('cloud:'))

watchEffect(() => {
  if (!props.hasBannerBeenShown && props.eventData) {
    // We only want to record the banner being shown once per user, so only record if this is the *first* time the banner has been shown
    recordBannerShown(props.eventData)
  }
})

watch(() => isAlertDisplayed.value, async (newVal) => {
  if (!newVal) {
    // Fire dismiss event for cloud-driven banners. Existing local banners
    // (Login / Connect / Record / CT Available) historically don't report
    // dismissal, and changing that would alter their analytics in ways their
    // owners didn't sign up for — so we gate the event on the `cloud:`
    // namespace. The funnel (shown → clicked → dismissed) only matters for
    // the cloud channel anyway.
    if (props.bannerId.startsWith('cloud:') && props.eventData) {
      recordBannerDismissed(props.eventData)
    }

    await updateBannerState('dismissed')
  }
})

onMounted(async () => {
  await updateBannerState('lastShown')
})

async function updateBannerState (field: 'lastShown' | 'dismissed') {
  const savedBannerState = stateQuery.data.value?.currentProject?.savedState?.banners ?? {}

  set(savedBannerState, [props.bannerId, field], Date.now())

  // Track total impressions for cloud-driven banners — used by
  // `SpecsListBanners.isCloudMessageEligible` to enforce
  // `dismissal.maxImpressions`. Local onboarding banners don't use the
  // counter (they cap on `dismissed` + cooldowns), so we gate the increment
  // on the `cloud:` namespace to avoid bloating their savedState.
  if (field === 'lastShown' && isCloudBanner.value) {
    const current = (savedBannerState[props.bannerId]?.shownCount ?? 0) as number

    set(savedBannerState, [props.bannerId, 'shownCount'], current + 1)
  }

  await setStateMutation.executeMutation({ value: JSON.stringify({ banners: savedBannerState }) })
}

function recordBannerShown ({ campaign, medium, cohort }: EventData): void {
  reportSeenMutation.executeMutation({
    campaign,
    messageId: bannerInstanceId.value,
    medium,
    cohort: cohort || null,
    includeMachineId: isCloudBanner.value,
  })
}

function recordBannerDismissed ({ campaign, medium, cohort }: EventData): void {
  // Distinguished from impression by `payload.action: 'dismiss'`. Same
  // `messageId` (instance nanoid) so warehouse joins can pair impression ↔
  // dismissal for the same banner instance.
  reportDismissedMutation.executeMutation({
    campaign,
    messageId: bannerInstanceId.value,
    medium,
    payload: JSON.stringify({
      action: 'dismiss',
      banner_id: props.bannerId,
      cohort: cohort ?? null,
    }),
    includeMachineId: isCloudBanner.value,
  })
}

async function dismiss (): Promise<void> {
  await updateBannerState('dismissed')
}

</script>
