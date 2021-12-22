<template>
  <div
    data-cy="no-runs"
    class="flex flex-col mx-auto min-h-full max-w-688px leading-24px items-center justify-center"
  >
    <i-cy-dashboard-checkmark_x48 class="h-48px w-48px icon-dark-gray-500 icon-light-gray-100" />
    <h2 class="mt-32px mb-8px text-gray-900 text-18px">
      {{ t("runs.empty.title") }}
    </h2>
    <p class="h-48px mb-8px text-gray-600">
      {{ t("runs.empty.description") }}
    </p>
    <TerminalPrompt
      :command="recordCommand"
      :project-folder-name="projectName"
      class="max-w-700px"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { gql } from '@urql/vue'
import TerminalPrompt from '@cy/components/TerminalPrompt.vue'
import type { RunsEmptyFragment } from '../generated/graphql'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

gql`
fragment RunsEmpty on CurrentProject {
  id
  title
  projectId
  configFile
  cloudProject {
    __typename
    ... on CloudProject {
      id
      recordKeys {
        id
        ...RecordKey
      }
    }
    
  }
}
`

const props = defineProps<{
  gql: RunsEmptyFragment,
}>()

const projectName = computed(() => props.gql.title)
const firstRecordKey = computed(() => {
  return props.gql.cloudProject?.__typename === 'CloudProject' && props.gql.cloudProject.recordKeys?.[0]?.key
    ? props.gql.cloudProject.recordKeys[0].key
    : '<record-key>'
})
const recordCommand = computed(() => {
  return `cypress run --record --key ${firstRecordKey.value}`
})
</script>

<style scoped lang="scss">
// make the marker black while the rest of the line is gray
ol li::marker{
  @apply text-gray-900;
}
</style>
