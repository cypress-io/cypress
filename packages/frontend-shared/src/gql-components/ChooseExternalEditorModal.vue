<template>
  <StandardModal
    :model-value="props.open"
    variant="bare"
    help-link=""
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
          Done
        </Button>
      </div>
    </template>
  </StandardModal>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import { gql } from '@urql/core'
import ChooseExternalEditor from '@packages/frontend-shared/src/gql-components/ChooseExternalEditor.vue'
import { ref } from 'vue'
import StandardModal from '@packages/frontend-shared/src/components/StandardModal.vue'
import Button from '@packages/frontend-shared/src/components/Button.vue'
import { ChooseExternalEditorModalFragment, SetPreferredEditorBinaryDocument } from '../generated/graphql'
import { useMutation } from '@urql/vue'

const { t } = useI18n()

gql`
fragment ChooseExternalEditorModal on Query {
  ...ChooseExternalEditor
}`

gql`
mutation SetPreferredEditorBinary ($value: String!) {
  setPreferredEditorBinary (value: $value)
}`

const setPreferredBinaryEditor = useMutation(SetPreferredEditorBinaryDocument)

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
  await setPreferredBinaryEditor.executeMutation({ value: preferredEditor.value })
  emit('selected')
}
</script>
