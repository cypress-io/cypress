<template>
  <Alert
    v-bind="$attrs"
    :model-value="modelValue"
    @update:model-value="handleBannerDismissed"
  >
    <slot />
  </Alert>
</template>

<script setup lang="ts">
import Alert from '@packages/frontend-shared/src/components/Alert.vue'
import { watchEffect } from 'vue'
import { gql, useMutation, useQuery } from '@urql/vue'
import { TrackedBanner_ProjectStateDocument, TrackedBanner_ReportTrackedBannerSeenDocument, TrackedBanner_SetProjectStateDocument } from '../../generated/graphql'
import { set } from 'lodash'

type AlertComponentProps = InstanceType<typeof Alert>['$props']
type AlertComponentEmits = InstanceType<typeof Alert>['$emit']
interface TrackedBannerComponentProps extends AlertComponentProps {
  bannerId: string
  modelValue: boolean
  hasBannerBeenShown: boolean
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
mutation TrackedBanner_reportTrackedBannerSeen($campaign: String!, $messageId: String!, $medium: String!) {
  reportTrackedBannerSeen(campaign: $campaign, messageId: $messageId, medium: $medium)
}
`

const props = withDefaults(defineProps<TrackedBannerComponentProps>(), {})

const emit = defineEmits<TrackedBannerComponentEmits>()

const stateQuery = useQuery({ query: TrackedBanner_ProjectStateDocument })
const setStateMutation = useMutation(TrackedBanner_SetProjectStateDocument)
const reportSeenMutation = useMutation(TrackedBanner_ReportTrackedBannerSeenDocument)

watchEffect(() => {
  if (props.modelValue) {
    if (!props.hasBannerBeenShown) {
      // if the banner hasn't been shown, then this is the first time that the user is seeing it. Send a request to cloud.
      reportSeenMutation.executeMutation({ campaign: props.bannerId, messageId: '', medium: 'dev' })
    }

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

</script>
