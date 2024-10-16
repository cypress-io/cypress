<template>
  <StandardModal
    :model-value="props.open"
    variant="bare"
    help-link="https://on.cypress.io/file-opener-preference"
    :help-text="t('links.needHelp')"
    data-cy="choose-editor-modal"
    @update:model-value="close"
  >
    <template #title>
      {{ t("globalPage.externalEditorPreferences") }}
    </template>

    <div class="m-[24px]">
      <div>
        <p class="font-normal text-sm text-gray-600 select-none">
          <slot name="description">
            <span id="choose-editor-label">{{ t("globalPage.externalEditorPreferencesDescription1") }}</span>
          </slot>
        </p>
        <p class="font-normal text-sm text-gray-600 select-none">
          <slot name="description">
            <i18n-t
              scope="global"
              keypath="globalPage.externalEditorPreferencesDescription2"
            >
              <strong>{{ t("globalPage.settings") }}</strong>
            </i18n-t>
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
          {{ t("globalPage.saveChanges") }}
        </Button>

        <Button
          variant="outline"
          @click="close"
        >
          {{ t("globalPage.cancel") }}
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
import type { ChooseExternalEditorModalFragment } from '../generated/graphql'
import { ChooseExternalEditorModal_SetPreferredEditorBinaryDocument } from '../generated/graphql'

const { t } = useI18n()

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
