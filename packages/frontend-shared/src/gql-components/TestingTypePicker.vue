<template>
  <div
    v-if="props.gql.currentProject"
    class="flex m-[24px] justify-center"
  >
    <Card
      v-for="tt in testingTypes"
      :key="tt.key"
      :data-cy-testingType="tt.key"
      :title="tt.name"
      :description="tt.description"
      class="m-[24px] px-[24px] pt-[36px] pb-[36px] w-[336px]"
      :icon="tt.icon"
      :hover-icon="tt.iconSolid"
      :icon-size="64"
      :disabled="tt.status === 'disabled'"
      variant="jade"
      :badge-text="tt.badgeText"
      @click="emits('pick', tt.key, currentTestingType)"
      @keyup.enter="emits('pick', tt.key, currentTestingType)"
      @keyup.space="emits('pick', tt.key, currentTestingType)"
    >
      <template
        v-if="tt.key === 'component' && tt.status === 'disabled'"
        #default
      >
        To test your components you must <ExternalLink href="https://on.cypress.io/installing-cypress">
          install Cypress
        </ExternalLink> as an NPM dependency for this project.
      </template>
      <template #footer>
        <StatusBadge
          class="mt-[16px]"
          :title="statusLabels[tt.status]"
          :status="tt.status === 'configured' || tt.status === 'running'"
          @choose-a-browser="emits('pick', tt.key, currentTestingType)"
        />
      </template>
    </Card>
  </div>
</template>

<script lang="ts" setup>
import { gql } from '@urql/vue'
import type { TestingTypeEnum, TestingTypePickerFragment } from '../generated/graphql'
import Card from '@cy/components/Card.vue'
import StatusBadge from './StatusBadge.vue'
import IconE2E from '~icons/cy/testing-type-e2e_x64.svg'
import IconE2ESolid from '~icons/cy/testing-type-e2e-solid_x64.svg'
import IconComponent from '~icons/cy/testing-type-component_x64.svg'
import IconComponentSolid from '~icons/cy/testing-type-component-solid_x64.svg'
import { computed } from 'vue'
import ExternalLink from './ExternalLink.vue'

gql`
fragment TestingTypePicker on Query {
  currentProject {
    id
    isCTConfigured
    isE2EConfigured
    currentTestingType
  }
  invokedFromCli
}
`

const props = defineProps<{
  gql: TestingTypePickerFragment
}>()

const emits = defineEmits<{
  (eventName: 'pick', testingType: TestingTypeEnum, currentTestingType: TestingTypeEnum): void
}>()

type TestingTypeStatus = 'configured' | 'notConfigured' | 'running' | 'disabled'

const statusLabels: Record<TestingTypeStatus, string> = {
  configured: 'Configured',
  notConfigured: 'Not Configured',
  running: 'Running',
  disabled: 'Disabled',
}

const e2eStatus = computed((): TestingTypeStatus => {
  if (!props.gql.currentProject?.isE2EConfigured) return 'notConfigured'

  return props.gql.currentProject.currentTestingType === 'e2e' ? 'running' : 'configured'
})

const componentStatus = computed((): TestingTypeStatus => {
  if (!props.gql.invokedFromCli) return 'disabled'

  if (!props.gql.currentProject?.isCTConfigured) return 'notConfigured'

  return props.gql.currentProject.currentTestingType === 'component' ? 'running' : 'configured'
})

const testingTypes = computed(() => {
  return [
    {
      key: 'e2e',
      name: 'E2E Testing',
      description: 'Build and test the entire experience of your application from end-to-end to ensure each flow matches your expectations.',
      icon: IconE2E,
      iconSolid: IconE2ESolid,
      status: e2eStatus.value,
      badgeText: '',
    },
    {
      key: 'component',
      name: 'Component Testing',
      description: 'Build and test your components from your design system in isolation in order to ensure each state matches your expectations.',
      icon: IconComponent,
      iconSolid: IconComponentSolid,
      status: componentStatus.value,
      badgeText: '',
    },
  ] as const
})

const currentTestingType = computed(() => props.gql.currentProject?.currentTestingType as TestingTypeEnum)

</script>
