<template>
  <StandardModal
    :model-value="props.open"
    variant="bare"
    :help-link="helpLink"
    help-text="Need help"
    data-cy="choose-editor-modal"
    @update:model-value="close"
  >
    <template #title>
      External editor preferences
    </template>

    <div class="m-[24px]">
      <div>
        <p class="font-normal text-sm text-gray-600 select-none">
          <slot name="description">
            <span id="choose-editor-label">Select your preference for opening files on your system.</span>
          </slot>
        </p>
        <p class="font-normal text-sm text-gray-600 select-none">
          <slot name="description">
            You can change this later in the <strong>Settings</strong> page.
          </slot>
        </p>
      </div>

      <div
        v-if="props.gql.localSettings"
        class="mt-[16px]"
      >
        <ChooseExternalEditor
          :gql="props.gql"
          label-id="choose-editor-label"
          @chose-editor="val => preferredEditor = val ?? ''"
        />
      </div>

      <div
        v-else
        class="flex h-full items-center justify-center"
      >
        <i-cy-loading_x16 class="animate-spin icon-dark-white icon-light-gray-400" />
      </div>
    </div>

    <template #footer>
      <div class="flex space-x-4">
        <Button
          :disabled="!preferredEditor?.length"
          @click="selectEditor"
        >
          Save changes
        </Button>

        <Button
          variant="outline"
          @click="close"
        >
          Cancel
        </Button>
      </div>
    </template>
  </StandardModal>
</template>

<script lang="ts" setup>
import { gql } from '@urql/core'
import { ref } from 'vue'
import { useMutation } from '@urql/vue'
import ChooseExternalEditor from './ChooseExternalEditor.vue'
import StandardModal from '../components/StandardModal.vue'
import Button from '../components/Button.vue'
import { getUrlWithParams } from '../utils/getUrlWithParams'
import type { ChooseExternalEditorModalFragment } from '../generated/graphql'
import { ChooseExternalEditorModal_SetPreferredEditorBinaryDocument } from '../generated/graphql'

gql`
fragment ChooseExternalEditorModal on Query {
  ...ChooseExternalEditor
}`

gql`
mutation ChooseExternalEditorModal_SetPreferredEditorBinary ($value: String!) {
  setPreferences (value: $value, type: global) {
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

const helpLink = getUrlWithParams({
  url: 'https://on.cypress.io/file-opener-preference',
  params: {
    utm_medium: 'Choose External Editor',
    utm_content: 'Need Help',
  },
})

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
