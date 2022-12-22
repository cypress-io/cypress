<template>
  <div>
    <DebugError
      v-if="showError"
    />
    <div
      v-else-if="loginConnectStore.user.isLoggedIn && loginConnectStore.project.isProjectConnected && run"
    >
      <DebugPageHeader
        :gql="run"
        :commits-ahead="0"
      />
      <DebugSpecList
        :specs="debugSpecsArray"
      />
    </div>
    <div
      v-else
      data-cy="debug-empty"
    >
      <DebugNotLoggedIn v-if="!loginConnectStore.user.isLoggedIn" />
      <DebugNoProject v-else-if="!loginConnectStore.project.isProjectConnected" />
      <DebugNoRuns v-else-if="!run" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { gql } from '@urql/vue'
import { computed } from '@vue/reactivity'
import type { DebugSpecsFragment } from '../generated/graphql'
import { useLoginConnectStore } from '@packages/frontend-shared/src/store/login-connect-store'
import DebugPageHeader from './DebugPageHeader.vue'
import DebugSpecList from './DebugSpecList.vue'
import DebugNotLoggedIn from './empty/DebugNotLoggedIn.vue'
import DebugNoProject from './empty/DebugNoProject.vue'
import DebugNoRuns from './empty/DebugNoRuns.vue'
import DebugError from './empty/DebugError.vue'
import { specsList } from './utils/DebugMapping'

gql`
fragment DebugSpecs on Query {
  currentProject {
    id
    cloudProject {
      __typename
      ... on CloudProject {
        id
        runByNumber(runNumber: 6) {
          ...DebugPage
          id
          runNumber
          status
          overLimitActionType
          overLimitActionUrl
          testsForReview {
            id
            ...DebugSpecListTests
          }
          specs {
            id
            ...DebugSpecListSpec
          }
        }
      }
    }
  }
}
`

const props = defineProps<{
  gql?: DebugSpecsFragment
  // This prop is just to stub the error state for now
  showError?: boolean
}>()

const loginConnectStore = useLoginConnectStore()

const run = computed(() => {
  return props.gql?.currentProject?.cloudProject?.__typename === 'CloudProject' ? props.gql.currentProject.cloudProject.runByNumber : null
})

const debugSpecsArray = computed(() => {
  if (run.value) {
    const specs = run.value.specs || []
    const tests = run.value.testsForReview || []

    return specsList(specs, tests)
  }

  return []
})

</script>
