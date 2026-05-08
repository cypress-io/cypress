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

// `includeMachineId: true` routes cloud-banner events to /machine-collect for
// warehouse dedup. Onboarding banners stay on /anon-collect to preserve
// existing analytics continuity. Declared before `watchEffect` to avoid the
// TDZ — the watcher fires synchronously during setup.
const isCloudBanner = computed(() => props.bannerId.startsWith('cloud:'))

watchEffect(() => {
  if (!props.hasBannerBeenShown && props.eventData) {
    recordBannerShown(props.eventData)
  }
})

watch(() => isAlertDisplayed.value, async (newVal) => {
  if (!newVal) {
    // Onboarding banners historically don't report dismissal; gating the
    // event on the `cloud:` namespace preserves their analytics shape.
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

function recordBannerDismissed ({ campaign, medium }: EventData): void {
  // Same `messageId` as the impression event — joins the funnel.
  reportDismissedMutation.executeMutation({
    campaign,
    messageId: bannerInstanceId.value,
    medium,
    payload: JSON.stringify({ action: 'dismiss' }),
    includeMachineId: isCloudBanner.value,
  })
}

async function dismiss (): Promise<void> {
  await updateBannerState('dismissed')
}

</script>
