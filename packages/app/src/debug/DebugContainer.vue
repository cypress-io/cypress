<template>
  <div class="h-full">
    <div
      v-if="loginConnectStore.user.isLoggedIn && loginConnectStore.project.isProjectConnected && run"
      class="h-full flex flex-col"
    >
      <DebugPageHeader
        :gql="run"
        :commits-ahead="0"
      />
      <DebugPageDetails
        :status="run.status"
        :specs="run.specs"
        :total-skipped-count="run.totalSkippedCount"
        :canceled-at="run.cancelledAt"
        :canceled-by-full-name="run.cancelledBy.fullName"
        :is-hidden-by-usage-limits="run.isHiddenByUsageLimits"
        :over-limit-action-type="run.overLimitActionType"
      />
      <DebugSpecList
        v-if="run.totalFailed > 0 && ['ERRORED','CANCELLED','TIMEDOUT'].includes(run.status)"
        :specs="debugSpecsArray"
      />
    </div>
    <div
      v-else
      data-cy="debug-empty"
    >
      <div
        v-if="!loginConnectStore.user.isLoggedIn"
      >
        {{ t('debugPage.notLoggedIn') }}
      </div>
      <div
        v-else-if="!loginConnectStore.project.isProjectConnected"
      >
        {{ t('debugPage.notConnected' ) }}
      </div>
      <div
        v-else-if="!run"
      >
        {{ t('debugPage.noRuns') }}
      </div>
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
import DebugPageDetails from './DebugPageDetails.vue'
import { useI18n } from 'vue-i18n'
import { specsList } from './utils/DebugMapping'

const { t } = useI18n()

gql`
fragment DebugSpecs on Query {
  currentProject {
    id
    cloudProject {
      __typename
      ... on CloudProject {
        id
        runByNumber(runNumber: 1) {
          ...DebugPage
          cancelledBy {
            id
            fullName
          }
          cancelledAt
          id
          runNumber
          status
          overLimitActionType
          overLimitActionUrl
          isHiddenByUsageLimits
          totalSkipped
          totalTests
          testsForReview {
            id
            ...DebugSpecListTests
          }
          specs {
            id
            status
            ...DebugSpecListSpec
          }
        }
      }
    }
  }
}
`

const props = defineProps<{
  gql: DebugSpecsFragment
}>()

const loginConnectStore = useLoginConnectStore()

const run = computed(() => {
  return props.gql.currentProject?.cloudProject?.__typename === 'CloudProject' ? props.gql.currentProject.cloudProject.runByNumber : null
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
