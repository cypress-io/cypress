<template>
  <StandardModal
    :model-value="props.open"
    variant="bare"
    help-link=""
    data-cy="choose-editor-modal"
    @update:model-value="close"
  >
    <template #title>
      {{ t("globalPage.selectPreferredEditor") }}
    </template>

    <div class="m-24px">
      <ChooseExternalEditor
        v-if="props.gql.localSettings"
        :gql="props.gql"
        @chose-editor="val => preferredEditor = val"
      />
      <div
        v-else
        class="h-full flex items-center justify-center"
      >
        <i-cy-loading_x16 class="animate-spin icon-dark-white icon-light-gray-400" />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <Button
          :disabled="!preferredEditor?.length"
          @click="selectEditor"
        >
          {{ t("globalPage.done") }}
        </Button>
      </div>
    </template>
  </StandardModal>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import { gql } from '@urql/core'
import { ref } from 'vue'
import { useMutation } from '@urql/vue'
import ChooseExternalEditor from './ChooseExternalEditor.vue'
import StandardModal from '../components/StandardModal.vue'
import Button from '../components/Button.vue'
import {
  ChooseExternalEditorModalFragment,
  ChooseExternalEditorModal_SetPreferredEditorBinaryDocument,
} from '../generated/graphql'

const { t } = useI18n()

gql`
fragment ChooseExternalEditorModal on Query {
  ...ChooseExternalEditor
}`

gql`
mutation ChooseExternalEditorModal_SetPreferredEditorBinary ($value: String!) {
  setPreferences (value: $value) {
    localSettings {
      preferences {
        preferredEditorBinary
      }
    }
  }
}`

const setPreferredBinaryEditor = useMutation(ChooseExternalEditorModal_SetPreferredEditorBinaryDocument)

const props = defineProps<{
  open: boolean
  gql: ChooseExternalEditorModalFragment
}>()

const emit = defineEmits<{
  (e: 'selected'): void
  (e: 'close'): void
}>()

const preferredEditor = ref('')

function close () {
  preferredEditor.value = ''
  emit('close')
}

async function selectEditor () {
  await setPreferredBinaryEditor.executeMutation({
    value: JSON.stringify({ preferredEditorBinary: preferredEditor.value }),
  })

  emit('selected')
}
</script>
