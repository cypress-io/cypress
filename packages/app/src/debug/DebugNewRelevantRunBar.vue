<template>
  <div
    v-if="data.status && data.runNumber"
    data-cy="newer-relevant-run"
    class="w-full px-24px pb-16px gap-y-1"
  >
    <ul
      id="metadata"
      class="rounded flex flex-row bg-indigo-50 border-indigo-100 p-12px gap-x-2 items-center whitespace-nowrap children:flex children:items-center"
    >
      <li>
        <DebugRunNumber
          :status="data.status"
          :value="data.runNumber"
        />
      </li>
      <li class="font-medium text-sm text-gray-800 truncate">
        {{ data.commitInfo?.summary }}
      </li>
      <li class="font-normal text-sm truncate">
        <DebugPendingRunCounts
          v-if="data.status === 'RUNNING'"
          :specs="specCounts"
        />
        <button
          v-else
          class="cursor-pointer text-indigo-500 hocus-link hocus-link-default"
          @click="navigateToNewerRun"
        >
          {{ t('debugPage.viewRun') }}
        </button>
      </li>
    </ul>
  </div>
</template>
<script lang="ts" setup>
import { computed } from 'vue'
import { DebugNewRelevantRunBarFragment, DebugNewRelevantRunBar_MoveToNextDocument, DebugNewRelevantRunBar_SpecsDocument } from '../generated/graphql'
import { gql, useMutation, useSubscription } from '@urql/vue'
import { useI18n } from 'vue-i18n'
import DebugPendingRunCounts from './DebugPendingRunCounts.vue'
import DebugRunNumber from './DebugRunNumber.vue'

gql`
fragment DebugNewRelevantRunBar on CloudRun {
  id
  runNumber
  status
  url
  commitInfo {
    summary
  }
}
`

gql`
mutation DebugNewRelevantRunBar_MoveToNext {
  moveToNextRelevantRun
}
`

gql`
subscription DebugNewRelevantRunBar_Specs {
  relevantRunSpecChange {
    currentProject {
      id
      relevantRunSpecs {
        next {
          ...DebugPendingRunCounts
        }
      }
    }
  }
}
`

const { t } = useI18n()

const props = defineProps<{
  gql: DebugNewRelevantRunBarFragment
}>()

const data = computed(() => props.gql)

const shouldPauseSubscription = computed(() => {
  return props.gql.status !== 'RUNNING'
})

const specs = useSubscription({ query: DebugNewRelevantRunBar_SpecsDocument, pause: shouldPauseSubscription })

const specCounts = computed(() => {
  return specs.data.value?.relevantRunSpecChange?.currentProject?.relevantRunSpecs?.next
})

const moveToNewRun = useMutation(DebugNewRelevantRunBar_MoveToNextDocument)

function navigateToNewerRun () {
  moveToNewRun.executeMutation({})
}

</script>
<style scoped>
#metadata li:last-child::before {
  content: '•';
  @apply text-lg text-gray-400 pr-8px
}
</style>
