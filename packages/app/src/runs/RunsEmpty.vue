<template>
  <TransitionQuickFade>
    <Alert
      v-if="_showSuccess"
      type="success"
      class="absolute top-24px left-24px right-24px"
      close-button
      @close="_showSuccess = false"
    >
      This project is now connected to the Cypress Dashboard!
      <template #details>
        <p class="flex items-center leading-24px pt-16px px-16px">
          <i-cy-arrow-outline-right_x16 class="inline align-middle h-16px w-16px mr-8px icon-dark-jade-500" />
          We automatically added the <span class="font-normal text-jade-600 m-4px">projectId</span> to your <span class="font-normal text-jade-600 m-4px">cypress.config.js</span> file.
        </p>
        <p class="flex items-center leading-24px pt-16px px-16px pb-16px">
          <i-cy-arrow-outline-right_x16 class="inline align-middle h-16px w-16px mr-8px icon-dark-jade-500" />
          Please ensure that your <span class="font-normal text-jade-600 m-4px">cypress.config.js</span> file is checked into source control.
        </p>
      </template>
    </Alert>
  </TransitionQuickFade>
  <div
    data-cy="no-runs"
    class="flex flex-col items-center justify-center min-h-full mx-auto leading-24px max-w-688px"
  >
    <i-cy-dashboard-checkmark_x48 class="h-48px w-48px icon-dark-gray-500 icon-light-gray-100" />
    <h2 class="text-gray-900 text-18px mt-32px mb-8px">
      {{ t("runs.empty.title") }}
    </h2>
    <p class="text-gray-600 h-48px mb-8px">
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
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { gql } from '@urql/vue'
import { useI18n } from '@cy/i18n'
import TransitionQuickFade from '@cy/components/transitions/TransitionQuickFade.vue'
import TerminalPrompt from '@cy/components/TerminalPrompt.vue'
import Alert from '@cy/components/Alert.vue'
import type { RunsEmptyFragment } from '../generated/graphql'

const { t } = useI18n()

gql`
fragment RunsEmpty on CurrentProject {
  id
  title
  projectId
  configFilePath
  cloudProject {
    id
    recordKeys {
      id
      ...RecordKey
    }
  }
}
`

const props = defineProps<{
  gql: RunsEmptyFragment,
}>()

const route = useRoute()

const _showSuccess = ref(route.query.showSuccess === 'true')

const projectName = computed(() => props.gql.title)
const firstRecordKey = computed(() => {
  return props.gql.cloudProject?.recordKeys?.[0]?.key ?? '<record-key>'
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
