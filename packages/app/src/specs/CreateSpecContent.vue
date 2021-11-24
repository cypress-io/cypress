<template>
  <CreateSpecCards
    data-testid="create-spec-page-cards"
    :gql="props.gql"
    @select="choose"
  />

  <div class="text-center border-t-1 pt-32px mt-32px">
    <p
      data-testid="no-specs-message"
      class="leading-normal text-gray-600 text-16px mb-16px"
    >
      {{ t('createSpec.noSpecsMessage') }}
    </p>
    <Button
      data-testid="view-spec-pattern"
      variant="outline"
      prefix-icon-class="icon-light-gray-50 icon-dark-gray-400"
      :prefix-icon="SettingsIcon"
      class="mx-auto duration-300 hocus:ring-gray-50 hocus:border-gray-200"
      @click.prevent="showCypressConfigInIDE"
    >
      {{ t('createSpec.viewSpecPatternButton') }}
    </Button>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import SettingsIcon from '~icons/cy/settings_x16'
import Button from '@cy/components/Button.vue'
import { ref } from 'vue'
import CreateSpecCards from './CreateSpecCards.vue'
import { gql, useMutation } from '@urql/vue'
import type { CreateSpecContentFragment } from '../generated/graphql'
import { CreateSpecPage_OpenFileInIdeDocument } from '@packages/data-context/src/gen/all-operations.gen'
import { useRunnerUiStore } from '../store/runner-ui-store'
const { t } = useI18n()

gql`
fragment CreateSpecContent on Query {
  ...CreateSpecCards
  ...CreateSpecModal
  ...ChooseExternalEditor

   currentProject {
     id
     currentTestingType
     configFileAbsolutePath
  }
  localSettings {
    preferences {
      preferredEditorBinary
    }
  }
}
`

gql`
mutation CreateSpecPage_OpenFileInIDE ($input: FileDetailsInput!) {
  openFileInIDE (input: $input)
}
`

const props = defineProps<{
  gql: CreateSpecContentFragment
}>()

const openFileInIDE = useMutation(CreateSpecPage_OpenFileInIdeDocument)

const showModal = ref(false)

const generator = ref()

const openInIde = (absolute: string) => {
  openFileInIDE.executeMutation({
    input: {
      absolute,
      line: 1,
      column: 1,
    },
  })
}

const runnerUiStore = useRunnerUiStore()

const openFile = () => {
  runnerUiStore.setShowChooseExternalEditorModal(false)

  if (props.gql.currentProject?.configFileAbsolutePath) {
    openInIde(props.gql.currentProject.configFileAbsolutePath)
  }
}

const showCypressConfigInIDE = () => {
  if (props.gql.localSettings.preferences.preferredEditorBinary && props.gql.currentProject?.configFileAbsolutePath) {
    openInIde(props.gql.currentProject.configFileAbsolutePath)
  } else {
    runnerUiStore.setShowChooseExternalEditorModal(true)
  }
}

const choose = (id) => {
  showModal.value = true
  generator.value = id
}
</script>
