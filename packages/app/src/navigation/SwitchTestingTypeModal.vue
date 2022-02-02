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
      @pick="switchAndRelaunchFn"
    />
  </StandardModal>
</template>

<script lang="ts" setup>
import { gql, useMutation } from '@urql/vue'
import { SwitchTestingTypeAndRelaunchDocument, SwitchTestingTypeModalFragment } from '../generated/graphql'
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
mutation SwitchTestingTypeAndRelaunch($testingType: TestingTypeEnum!) {
  switchTestingTypeAndRelaunch(testingType: $testingType)
}
`

const props = defineProps<{
  gql: SwitchTestingTypeModalFragment
  show: boolean
}>()

const emits = defineEmits<{
  (eventName: 'close'): void
}>()

const switchAndRelaunch = useMutation(SwitchTestingTypeAndRelaunchDocument)

function switchAndRelaunchFn (testingType: 'component' | 'e2e') {
  switchAndRelaunch.executeMutation({ testingType })
}
</script>
