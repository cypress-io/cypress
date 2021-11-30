<template>
  <StandardModal
    :model-value="show"
    :title="t('runs.connect.modal.connectManually.title')"
    @update:model-value="emit('cancel')"
  >
    <Alert type="warning">
      {{ t('runs.connect.modal.connectManually.warning') }}
    </Alert>
    <p class="mb-16px mt-24px leading-24px text-16px">
      <i18n-t keypath="runs.connect.modal.connectManually.mainMessage">
        <template #projectId>
          <code class="border border-gray-200 rounded px-3px py-2px m-2px text-purple-500 text-16px">projectId</code>
        </template>
        <template #configFile>
          <span class="text-indigo-500">cypress.config.js</span>
        </template>
      </i18n-t>
    </p>
    <ShikiHighlight
      class="border-1 border-gray-200 rounded"
      lang="javascript"
      :code="helpCode"
      line-numbers
      copy-button
    />
    <template #footer>
      <div class="flex gap-16px">
        <Button
          size="lg"
          variant="pending"
        >
          <template #prefix>
            <i-cy-loading_x16
              class="animate-spin icon-dark-white icon-light-gray-400"
            />
          </template>
          {{ t('runs.connect.modal.connectManually.waitingButton') }}
        </Button>
        <Button
          variant="outline"
          size="lg"
          @click="emit('cancel')"
        >
          {{ t('runs.connect.modal.cancel') }}
        </Button>
      </div>
    </template>
  </StandardModal>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { gql } from '@urql/vue'
import StandardModal from '@cy/components/StandardModal.vue'
import Button from '@cy/components/Button.vue'
import Alert from '@cy/components/Alert.vue'
import ShikiHighlight from '@cy/components/ShikiHighlight.vue'
import { useI18n } from '@cy/i18n'
import type { NeedManualUpdateModalFragment } from '../../generated/graphql'

const { t } = useI18n()

const emit = defineEmits<{
  (event:'cancel'): void
}>()

gql`
fragment NeedManualUpdateModal on CurrentProject {
  id
  projectId
  # TODO: there should be a fragment for newly created project
  # newCloudProject {
  #   id
  #   projectId
  # }
}`

const props = defineProps<{
  gql: NeedManualUpdateModalFragment
}>()

const show = computed(() => {
  // TODO: this should also check if newCloudProject has a value
  return !props.gql.projectId
})

// TODO: make this projectId come form newCloudProject
const projectIdCode = computed(() => `projectId: '${props.gql.projectId}'`)

const helpCode = computed(() => {
  return `
export default {
  ${projectIdCode.value}, // <- add this line
}`
})

</script>
