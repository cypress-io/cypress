<template>
  <StandardModal
    class="transition-all duration-200"
    variant="bare"
    :title="t('testingType.modalTitle')"
    help-link="https://on.cypress.io/choosing-testing-type"
    :model-value="show"
    data-cy="switch-modal"
    @update:model-value="emits('close')"
  >
    <TestingTypePicker
      :gql="props.gql"
      @pick="handleTestingType"
    />
  </StandardModal>
</template>

<script lang="ts" setup>
import { gql, useMutation } from '@urql/vue'
import { SwitchTestingTypeAndRelaunchDocument } from '../generated/graphql'
import type { SwitchTestingTypeModalFragment } from '../generated/graphql'
import StandardModal from '@cy/components/StandardModal.vue'
import TestingTypePicker from '@cy/gql-components/TestingTypePicker.vue'
import { useI18n } from '@cy/i18n'
import type { TestingTypeEnum } from '@packages/frontend-shared/src/generated/graphql'

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

function handleTestingType (testingType: TestingTypeEnum, currentTestingType: TestingTypeEnum) {
  if (testingType === currentTestingType) {
    emits('close')

    return
  }

  switchAndRelaunch.executeMutation({ testingType })
}
</script>
