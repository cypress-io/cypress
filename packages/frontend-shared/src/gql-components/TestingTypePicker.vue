<template>
  <div
    v-if="props.gql.currentProject"
    class="flex m-24px justify-center"
  >
    <Card
      v-for="tt in testingTypes"
      :key="tt.key"
      :data-cy-testingType="tt.key"
      :title="tt.name"
      :description="tt.description"
      class="m-24px px-24px pt-36px pb-36px w-336px"
      :icon="tt.icon"
      :hover-icon="tt.iconSolid"
      :icon-size="64"
      variant="jade"
      @click="emits('pick', tt.key, currentTestingType)"
      @keyup.enter="emits('pick', tt.key, currentTestingType)"
      @keyup.space="emits('pick', tt.key, currentTestingType)"
    >
      <template #footer>
        <StatusBadge
          class="mt-16px"
          :title-on="tt.key === currentTestingType ? t('setupPage.testingCard.running') : t('setupPage.testingCard.configured')"
          :title-off="t('setupPage.testingCard.notConfigured')"
          :status="tt.configured || false"
          :testing-type="tt.key"
          :is-running="tt.key === currentTestingType"
          :is-app="props.isApp"
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
import { useI18n } from '@cy/i18n'
import { computed } from 'vue'

const { t } = useI18n()

gql`
fragment TestingTypePicker on Query {
  currentProject {
    id
    isCTConfigured
    isE2EConfigured
    currentTestingType
  }
}
`

const props = defineProps<{
  gql: TestingTypePickerFragment
  isApp: boolean
}>()

const emits = defineEmits<{
  (eventName: 'pick', testingType: TestingTypeEnum, currentTestingType: TestingTypeEnum): void
}>()

const testingTypes = computed(() => {
  return [
    {
      key: 'e2e',
      name: t('testingType.e2e.name'),
      description: t('testingType.e2e.description'),
      icon: IconE2E,
      iconSolid: IconE2ESolid,
      configured: props.gql.currentProject?.isE2EConfigured,
    },
    {
      key: 'component',
      name: t('testingType.component.name'),
      description: t('testingType.component.description'),
      icon: IconComponent,
      iconSolid: IconComponentSolid,
      configured: props.gql.currentProject?.isCTConfigured,
    },
  ] as const
})

const currentTestingType = computed(() => props.gql.currentProject?.currentTestingType as TestingTypeEnum)

</script>
