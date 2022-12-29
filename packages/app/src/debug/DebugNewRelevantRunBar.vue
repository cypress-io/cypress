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
          :total-skipped="data.totalSkipped || 0"
          :total-failed="data.totalFailed || 0"
          :total-passed="data.totalPassed || 0"
          :total-tests="data.totalTests || 0"
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
import type { DebugNewRelevantRunBarFragment } from '../generated/graphql'
import { gql } from '@urql/core'
import { useI18n } from 'vue-i18n'
import DebugPendingRunCounts from './DebugPendingRunCounts.vue'
import DebugRunNumber from './DebugRunNumber.vue'

gql`
fragment DebugNewRelevantRunBar on CloudRun {
  id
  runNumber
  status
  url
  totalSkipped
  totalFailed
  totalPassed
  totalTests
  commitInfo {
    summary
  }
}
`

const { t } = useI18n()

const props = defineProps<{
  gql: DebugNewRelevantRunBarFragment
}>()

const data = computed(() => props.gql)

function navigateToNewerRun () {
  // TODO GH#24440 Stubbed pending updates to the store so the "viewed run" value can be managed there
  return
}

</script>
<style scoped>
#metadata li:last-child::before {
  content: '.';
  @apply -mt-8px text-lg text-gray-400 pr-8px
}
</style>
