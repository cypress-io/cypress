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
        :specs="specsList"
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

const specsList = computed(() => {
  if (props.gql.currentProject?.cloudProject?.__typename === 'CloudProject') {
    const specs = props.gql.currentProject.cloudProject.runByNumber?.specs || []
    const tests = props.gql.currentProject.cloudProject.runByNumber?.testsForReview || []

    const mappedTests = tests.reduce((acc, curr) => {
      // console.log(`test specId = ${ curr.specId}`)
      let spec = acc[curr.specId]

      if (!spec) {
        const foundSpec = specs.find((spec) => spec.id === curr.specId)

        spec = { spec: foundSpec }
        // console.log('looking for spec', spec)
        if (foundSpec) {
          acc[curr.specId] = spec
        } else {
          //TODO better handle error case
          throw new Error(`Could not find spec for id ${ curr.specId}`)
        }
      }

      spec.tests = [...(spec.tests || []), curr]

      // console.log('spec.tests', spec.tests)

      return acc
    }, {})

    // console.log(mappedTests)

    return Object.values(mappedTests)
  }

  return []
})

</script>
