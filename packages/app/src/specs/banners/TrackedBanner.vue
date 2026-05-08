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
import { TrackedBanner_StateDocument, TrackedBanner_RecordBannerSeenDocument, TrackedBanner_RecordBannerDismissedDocument, TrackedBanner_SetProjectStateDocument, TrackedBanner_SetGlobalStateDocument } from '../../generated/graphql'
import { set } from 'lodash'
import { nanoid } from 'nanoid'

type EventData = {
  campaign: string
  medium: string
  cohort?: string
}

type DismissalScope = 'user' | 'project'

type AlertComponentProps = InstanceType<typeof Alert>['$props']
interface TrackedBannerComponentProps extends AlertComponentProps {
  bannerId: string
  hasBannerBeenShown: boolean
  eventData: EventData | undefined
  // Optional. Only honored for cloud banners; onboarding banners always
  // persist to project savedState regardless of value.
  dismissalScope?: DismissalScope
}

gql`
query TrackedBanner_State {
  currentProject {
    id
    savedState
  }
  localSettings {
    preferences {
      banners
    }
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
mutation TrackedBanner_SetGlobalState($value: String!) {
  setPreferences(type: global, value: $value) {
    localSettings {
      preferences {
        banners
      }
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
mutation TrackedBanner_recordBannerDismissed($campaign: String!, $messageId: String!, $medium: String!, $cohort: String, $payload: String!, $includeMachineId: Boolean) {
  recordEvent(campaign: $campaign, messageId: $messageId, medium: $medium, cohort: $cohort, payload: $payload, includeMachineId: $includeMachineId)
}
`

const props = withDefaults(defineProps<TrackedBannerComponentProps>(), {
  dismissalScope: 'project',
})

const stateQuery = useQuery({ query: TrackedBanner_StateDocument })
const setProjectStateMutation = useMutation(TrackedBanner_SetProjectStateDocument)
const setGlobalStateMutation = useMutation(TrackedBanner_SetGlobalStateDocument)
const reportSeenMutation = useMutation(TrackedBanner_RecordBannerSeenDocument)
const reportDismissedMutation = useMutation(TrackedBanner_RecordBannerDismissedDocument)
const bannerInstanceId = ref(nanoid())
const isAlertDisplayed = ref(true)

// `includeMachineId: true` routes cloud-banner events to /machine-collect for
// warehouse dedup. Onboarding banners stay on /anon-collect to preserve
// existing analytics continuity. Declared before `watchEffect` to avoid the
// TDZ — the watcher fires synchronously during setup.
const isCloudBanner = computed(() => props.bannerId.startsWith('cloud:'))

// User-scoping is opt-in and only meaningful for cloud banners. Onboarding
// banners are always project-scoped to preserve their existing behavior.
const isUserScoped = computed(() => isCloudBanner.value && props.dismissalScope === 'user')

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
  if (isUserScoped.value) {
    const globalBanners = stateQuery.data.value?.localSettings?.preferences?.banners ?? {}

    set(globalBanners, [props.bannerId, field], Date.now())
    await setGlobalStateMutation.executeMutation({ value: JSON.stringify({ banners: globalBanners }) })

    return
  }

  const projectBanners = stateQuery.data.value?.currentProject?.savedState?.banners ?? {}

  set(projectBanners, [props.bannerId, field], Date.now())
  await setProjectStateMutation.executeMutation({ value: JSON.stringify({ banners: projectBanners }) })
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
  // Same `messageId` as the impression event — joins the funnel.
  reportDismissedMutation.executeMutation({
    campaign,
    messageId: bannerInstanceId.value,
    medium,
    cohort: cohort || null,
    payload: JSON.stringify({ action: 'dismiss' }),
    includeMachineId: isCloudBanner.value,
  })
}

async function dismiss (): Promise<void> {
  await updateBannerState('dismissed')
}

</script>
