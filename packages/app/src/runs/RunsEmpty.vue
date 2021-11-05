<template>
  <div
    data-cy="no-runs"
    class="min-h-full flex flex-col justify-center items-center leading-24px max-w-688px mx-auto"
  >
    <i-cy-dashboard-checkmark_x48 class="h-48px w-48px icon-dark-gray-500 icon-light-gray-100" />
    <h2 class="text-18px mt-32px mb-24px text-gray-900">
      {{ t("runs.empty.title") }}
    </h2>
    <ol class="list-decimal w-full text-gray-600 ml-16px">
      <li>
        <p class="mb-8px">
          <i18n-t keypath="runs.empty.step1">
            <span class="text-indigo-500">{{ configFilePath }}</span>
          </i18n-t>
        </p>
        <ShikiHighlight
          class="rounded border border-gray-100 -ml-16px"
          :code="projectIdCode"
          lang="js"
          line-numbers
        />
      </li>
      <li class="mt-24px">
        <p class="mb-8px">
          <i18n-t keypath="runs.empty.step2">
            <span class="text-indigo-400">{{ configFilePath }}</span>
          </i18n-t>
        </p>
        <TerminalPrompt
          class="-ml-16px"
          command="git add cypress.config.js"
          :project-name="projectName"
        />
      </li>
      <li class="mt-24px">
        <p class="mb-8px">
          {{ t("runs.empty.step3") }}
        </p>
        <TerminalPrompt
          class="-ml-16px"
          :command="recordCommand"
          :project-name="projectName"
        />
      </li>
    </ol>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { gql } from '@urql/vue'
import ShikiHighlight from '@cy/components/ShikiHighlight.vue'
import { useI18n } from '@cy/i18n'
import TerminalPrompt from '@cy/components/TerminalPrompt.vue'
import type { RunsEmptyFragment } from '../generated/graphql'

const { t } = useI18n()

gql`
fragment RunsEmpty on Project {
  title
  projectId
  configFilePath
  cloudProject {
    id
    recordKeys {
      ...RecordKey
    }
  }
}
`

const props = defineProps<{
  gql: RunsEmptyFragment,
}>()

const projectIdCode = computed(() => {
  return `${'export'} default {
  projectId: '${props.gql.projectId}'
}`
})

const projectName = computed(() => props.gql.title)
const configFilePath = computed(() => props.gql.configFilePath)
const firstRecordKey = computed(() => {
  return props.gql.cloudProject?.recordKeys?.[0]
})
const recordCommand = computed(() => {
  return `cypress run --record --key ${firstRecordKey.value?.key}`
})
</script>

<style scoped lang="scss">
// make the marker black while the rest of the line is gray
ol li::marker{
  @apply text-gray-900;
}
</style>
