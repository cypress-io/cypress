<template>
  <StandardModal
    class="transition-all transition duration-200"
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
mutation SwitchTestingType_ReconfigureProject($testingType: TestingTypeEnum!) {
  setCurrentTestingType(testingType: $testingType) {
    currentTestingType
  }
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

function reconfigure (testingType: 'component' | 'e2e') {
  openElectron.executeMutation({ testingType })
}
</script>
