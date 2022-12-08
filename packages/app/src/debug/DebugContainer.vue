<template>
  <div>
    <div
      v-if="loginConnectStore.user.isLoggedIn && loginConnectStore.project.isProjectConnected && run"
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
      data-cy="debug-empty"
    >
      <div
        v-if="!loginConnectStore.user.isLoggedIn"
      >
        {{ t('debugPage.notLoggedIn') }}
      </div>
      <div
        v-if="loginConnectStore.user.isLoggedIn && !loginConnectStore.project.isProjectConnected"
      >
        {{ t('debugPage.notConnected' ) }}
      </div>
      <div
        v-if="loginConnectStore.user.isLoggedIn && loginConnectStore.project.isProjectConnected && !run"
      >
        {{ t('debugPage.noRuns') }}
      </div>
    </div>
    <!-- <pre>{{ JSON.stringify(props.gql, null, 2) }}</pre> -->
  </div>
</template>

<script setup lang="ts">
import { gql } from '@urql/vue'
import { computed } from '@vue/reactivity'
import type { DebugSpecsFragment } from '../generated/graphql'
import { useLoginConnectStore } from '@packages/frontend-shared/src/store/login-connect-store'
import DebugPageHeader from './DebugPageHeader.vue'
import DebugSpecList from './DebugSpecList.vue'
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
          runByNumber(runNumber: 2) {
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
  gql: DebugSpecsFragment
}>()

const loginConnectStore = useLoginConnectStore()

const run = computed(() => {
  return props.gql.currentProject?.cloudProject?.__typename === 'CloudProject' && props.gql.currentProject.cloudProject.runByNumber
})

const debugSpecsArray = computed(() => {
  if (props.gql.currentProject?.cloudProject?.__typename === 'CloudProject') {
    const specs = props.gql.currentProject.cloudProject.runByNumber?.specs || []
    const tests = props.gql.currentProject.cloudProject.runByNumber?.testsForReview || []

    return specsList(specs, tests)
  }

  return []
})

</script>
