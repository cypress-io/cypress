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
import { useI18n } from 'vue-i18n'
import { specsList } from './utils/DebugMapping'

const { t } = useI18n()

gql`
fragment DebugLocalSpecs on Spec {
  id
  absolute
  relative
}
`

gql`
fragment DebugSpecs on Query {
  currentProject {
    id
    cloudProject {
      __typename
      ... on CloudProject {
        id
        runByNumber(runNumber: 11) {
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
          groups {
            id,
            ...DebugSpecListGroups
          }
        }
      }
    }
    specs {
      id
      ...DebugLocalSpecs
    }
    currentTestingType
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

const localSpecs = computed(() => {
  return props.gql.currentProject?.specs || []
})

const debugSpecsArray = computed(() => {
  if (run.value) {
    const specs = run.value.specs || []
    const tests = run.value.testsForReview || []
    const currentTestingType = props.gql.currentProject?.currentTestingType || 'e2e'

    return specsList({
      specs,
      tests,
      groups: run.value.groups,
      localSpecs: localSpecs.value,
      currentTestingType,
    })
  }

  return []
})
</script>
