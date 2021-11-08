<template>
  <StandardModal
    class="transition duration-200 transition-all"
    :click-outside="false"
    variant="bare"
    :title="t('testingType.modalTitle')"
    :model-value="show"
    data-cy="switch-modal"
    @update:model-value="emits('close')"
  >
    <TestingTypePicker
      :gql="props.gql"
      @pick="reconfigure"
    />
  </StandardModal>
</template>

<script lang="ts" setup>
import { gql, useMutation } from '@urql/vue'
import { SwitchTestingType_ReconfigureProjectDocument, SwitchTestingTypeModalFragment } from '../generated/graphql'
import StandardModal from '@cy/components/StandardModal.vue'
import TestingTypePicker from '@cy/gql-components/TestingTypePicker.vue'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

gql`
fragment SwitchTestingTypeModal on Query {
  ...TestingTypePicker
}
`

gql`
mutation SwitchTestingType_ReconfigureProject {
  reconfigureProject
}
`

const props = defineProps<{
  gql: SwitchTestingTypeModalFragment
  show: boolean
}>()

const emits = defineEmits<{
  (eventName: 'close'): void
}>()

const openElectron = useMutation(SwitchTestingType_ReconfigureProjectDocument)

function reconfigure () {
  openElectron.executeMutation({})
}
</script>
