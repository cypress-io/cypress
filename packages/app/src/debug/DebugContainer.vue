<template>
  <div>
    <div
      v-if="loginConnectStore.user.isLoggedIn && loginConnectStore.project.isProjectConnected && run"
    >
      <DebugPageHeader
        :gql="run"
        commits-ahead="0"
      />
      <DebugSpecList
        :gql="specs"
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
    {{ props.gql }}
  </div>
</template>

<script setup lang="ts">
import { gql } from '@urql/vue'
import { computed } from '@vue/reactivity'
import type { DebugSpecsFragment } from '../generated/graphql-test'
import { useLoginConnectStore } from '@packages/frontend-shared/src/store/login-connect-store'
import DebugPageHeader from './DebugPageHeader.vue'
import DebugSpecList from './DebugSpecList.vue'
import { useI18n } from 'vue-i18n'

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
            overLimitActionTitle
            overLimitActionUrl
            testsForReview {
              specs(viewBy: FAILED, page:1, perPage: 2) {
                id
               ...DebugSpecList 
              }
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

const specs = computed(() => {
  if (props.gql.currentProject?.cloudProject?.__typename === 'CloudProject') {
    return props.gql.currentProject.cloudProject.runByNumber?.testsForReview?.specs || []
  }

  return []
})

</script>
