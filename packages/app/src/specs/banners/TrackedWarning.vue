<template>
  <Warning
    v-model="displayWarning"
    :title="props.title"
    :message="props.message"
  />
</template>

<script lang="ts" setup>
import Warning from '@packages/frontend-shared/src/warning/Warning.vue'
import { gql, useMutation, useQuery } from '@urql/vue'
import { ref, watch } from 'vue'
import { TrackedBanner_SetProjectStateDocument, TrackedBanner_ProjectStateDocument } from '../../generated/graphql'
import { set } from 'lodash'

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

const props = defineProps<{
  title: string
  message: string
  bannerId: string
}>()

const stateQuery = useQuery({ query: TrackedBanner_ProjectStateDocument })
const setStateMutation = useMutation(TrackedBanner_SetProjectStateDocument)
const displayWarning = ref(true)

watch(() => displayWarning.value, async (newVal) => {
  if (!newVal) {
    await updateBannerState('dismissed')
  }
})

async function updateBannerState (field: 'dismissed') {
  const savedBannerState = stateQuery.data.value?.currentProject?.savedState.banners ?? {}

  set(savedBannerState, [props.bannerId, field], Date.now())

  await setStateMutation.executeMutation({ value: JSON.stringify({ banners: savedBannerState }) })
}

</script>
