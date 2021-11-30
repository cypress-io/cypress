<template>
  <div class="flex justify-center m-24px">
    <Card
      v-for="tt in TESTING_TYPES"
      :key="tt.key"
      :data-cy-testingType="tt.key"
      :title="tt.name"
      :description="tt.description"
      class="m-24px px-24px pt-36px pb-36px w-336px"
      :icon="tt.icon"
      :hover-icon="tt.iconSolid"
      :icon-size="64"
      variant="jade"
      @click="emits('pick', tt.key)"
    >
      <template #footer>
        <StatusBadge
          class="mt-16px"
          :title="tt.title"
          :status="tt.configured"
        />
      </template>
    </Card>
  </div>
</template>

<script lang="ts" setup>
import { gql } from '@urql/vue'
import type { TestingTypePickerFragment } from '../generated/graphql'
import Card from '@cy/components/Card.vue'
import StatusBadge from '@cy/components/StatusBadge.vue'
import IconE2E from '~icons/cy/testing-type-e2e_x64.svg'
import IconE2ESolid from '~icons/cy/testing-type-e2e-solid_x64.svg'
import IconComponent from '~icons/cy/testing-type-component_x64.svg'
import IconComponentSolid from '~icons/cy/testing-type-component-solid_x64.svg'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

gql`
fragment TestingTypePicker on CurrentProject {
  id
  componentSetupState
  e2eSetupState
  currentTestingType
}
`

const props = defineProps<{
  gql: TestingTypePickerFragment
}>()

const emits = defineEmits<{
  (eventName: 'pick', testingType: 'component' | 'e2e'): void
}>()

const StateMapping = {
  NEW: 'off',
  NEEDS_CHANGES: 'warning',
  READY: 'on',
} as const
const StateTitleMapping = {
  NEW: t('setupPage.testingCard.notConfigured'),
  NEEDS_CHANGES: t('setupPage.testingCard.needsChanges'),
  READY: t('setupPage.testingCard.configured'),
} as const

const TESTING_TYPES = [
  {
    key: 'e2e',
    name: t('testingType.e2e.name'),
    description: t('testingType.e2e.description'),
    icon: IconE2E,
    iconSolid: IconE2ESolid,
    configured: props.gql.e2eSetupState ? StateMapping[props.gql.e2eSetupState] : null,
    title: props.gql.e2eSetupState ? StateTitleMapping[props.gql.e2eSetupState] : null,
  },
  {
    key: 'component',
    name: t('testingType.component.name'),
    description: t('testingType.component.description'),
    icon: IconComponent,
    iconSolid: IconComponentSolid,
    configured: props.gql.componentSetupState ? StateMapping[props.gql.componentSetupState] : null,
    title: props.gql.componentSetupState ? StateTitleMapping[props.gql.componentSetupState] : null,

  },
] as const

</script>
