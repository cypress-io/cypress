<template>
  <div class="flex justify-center m-24px">
    <Card
      v-for="tt in TESTING_TYPES"
      :key="tt.name"
      :title="tt.name"
      :description="tt.description"
      class="m-24px px-24px pt-36px pb-36px w-336px"
      :icon="tt.icon"
      :hover-icon="tt.iconSolid"
      icon-size="64"
      variant="jade"
      @click="emits('pick', tt.key)"
    >
      <template #footer>
        <StatusBadge
          class="mt-16px"
          :title-on="t('setupPage.testingCard.configured')"
          :title-off="t('setupPage.testingCard.notConfigured')"
          :status="tt.configured || false"
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
fragment TestingTypePicker on App {
    activeTestingType
    activeProject {
      id
      isCTConfigured
      isE2EConfigured
    }
}
`

const props = defineProps<{
  gql: TestingTypePickerFragment
}>()

const emits = defineEmits<{
  (eventName: 'pick', testingType: 'component' | 'e2e'): void
}>()

const TESTING_TYPES = [
  {
    key: 'e2e',
    name: t('navigation.testingType.e2e.name'),
    description: t('navigation.testingType.e2e.description'),
    icon: IconE2E,
    iconSolid: IconE2ESolid,
    configured: props.gql.activeProject?.isE2EConfigured,
  },
  {
    key: 'component',
    name: t('navigation.testingType.component.name'),
    description: t('navigation.testingType.component.description'),
    icon: IconComponent,
    iconSolid: IconComponentSolid,
    configured: props.gql.activeProject?.isCTConfigured,
  },
] as const

</script>
