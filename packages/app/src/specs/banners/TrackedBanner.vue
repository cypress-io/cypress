<template>
  <Alert
    v-bind="$attrs"
    :model-value="modelValue"
    @update:model-value="handleBannerDismissed"
  >
    <slot />
  </Alert>
</template>

<script lang="ts">
import { CohortConfig, useCohorts } from '@packages/frontend-shared/src/composables/useCohorts'

export type CohortOption = {
  cohort: string
  value: string
}

export const getOptionForCohort = (name: string, options: CohortOption[]) => {
  const cohortConfig: CohortConfig = {
    name,
    cohorts: options.map((option) => option.cohort),
  }

  const cohortSelected = useCohorts(cohortConfig)

  const emptyOption = { cohort: '', value: '' }

  return computed(() => {
    if (cohortSelected.value) {
      return options.find((option) => option.cohort === cohortSelected.value) || emptyOption
    }

    return emptyOption
  })
}

</script>

<script setup lang="ts">
import Alert from '@packages/frontend-shared/src/components/Alert.vue'
import { ref, watchEffect, computed, watch } from 'vue'
import { gql, useMutation, useQuery } from '@urql/vue'
import { TrackedBanner_ProjectStateDocument, TrackedBanner_RecordBannerSeenDocument, TrackedBanner_SetProjectStateDocument } from '../../generated/graphql'
import { set } from 'lodash'
import { nanoid } from 'nanoid'

type EventData = {
  campaign: string
  medium: string
  cohort?: string
}

type AlertComponentProps = InstanceType<typeof Alert>['$props']
type AlertComponentEmits = InstanceType<typeof Alert>['$emit']
interface TrackedBannerComponentProps extends AlertComponentProps {
  bannerId: string
  modelValue: boolean
  hasBannerBeenShown: boolean
  eventData: EventData
}
interface TrackedBannerComponentEmits extends AlertComponentEmits {
  (e: 'update:modelValue'): void
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
  }
}
`

gql`
mutation TrackedBanner_recordBannerSeen($campaign: String!, $messageId: String!, $medium: String!, $cohort: String) {
  recordEvent(campaign: $campaign, messageId: $messageId, medium: $medium, cohort: $cohort)
}
`

const props = withDefaults(defineProps<TrackedBannerComponentProps>(), {})

const emit = defineEmits<TrackedBannerComponentEmits>()

const stateQuery = useQuery({ query: TrackedBanner_ProjectStateDocument })
const setStateMutation = useMutation(TrackedBanner_SetProjectStateDocument)
const reportSeenMutation = useMutation(TrackedBanner_RecordBannerSeenDocument)
const bannerInstanceId = ref(nanoid())

watch(() => props.eventData?.cohort, () => {
  if (props.modelValue && !props.hasBannerBeenShown && props.eventData) {
    // We only want to record the banner being shown once per user, so only record if this is the *first* time the banner has been shown
    recordBannerShown(props.eventData)
  }
})

watchEffect(() => {
  if (props.modelValue) {
    updateBannerState('lastShown')
  }
})

function handleBannerDismissed (visible: boolean) {
  if (!visible) {
    updateBannerState('dismissed')
  }

  emit('update:modelValue', visible)
}

function updateBannerState (field: 'lastShown' | 'dismissed') {
  const savedState = stateQuery.data.value?.currentProject?.savedState ?? {}

  set(savedState, ['banners', props.bannerId, field], Date.now())

  setStateMutation.executeMutation({ value: JSON.stringify(savedState) })
}

function recordBannerShown ({ campaign, medium, cohort }: EventData): void {
  reportSeenMutation.executeMutation({
    campaign,
    messageId: bannerInstanceId.value,
    medium,
    cohort: cohort || null,
  })
}

</script>
