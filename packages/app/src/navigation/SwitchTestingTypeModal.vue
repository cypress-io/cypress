<template>
  <StandardModal
    class="transition duration-200 transition-all"
    :click-outside="false"
    variant="bare"
    :title="t('navigation.testingType.modalTitle')"
    :model-value="show"
    data-cy="switch-modal"
    @update:model-value="emits('close')"
  >
    <div class="flex justify-center m-24px">
      <Card
        v-for="tt in TESTING_TYPES"
        :key="tt.name"
        :title="tt.name"
        :description="tt.description"
        class="m-24px px-40px pt-36px pb-36px w-336px"
        :icon="tt.icon"
        :hover-icon="tt.iconSolid"
        icon-size="64"
        variant="jade"
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
  </StandardModal>
</template>

<script lang="ts" setup>
import { gql } from '@urql/vue'
import type { SwitchTestingTypeModalFragment } from '../generated/graphql'
import StandardModal from '@cy/components/StandardModal.vue'
import Card from '@cy/components/Card.vue'
import StatusBadge from '@cy/components/StatusBadge.vue'
import IconE2E from '~icons/cy/testing-type-e2e_x64.svg'
import IconE2ESolid from '~icons/cy/testing-type-e2e-solid_x64.svg'
import IconComponent from '~icons/cy/testing-type-component_x64.svg'
import IconComponentSolid from '~icons/cy/testing-type-component-solid_x64.svg'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

gql`
fragment SwitchTestingTypeModal on App {
    activeTestingType
    activeProject {
      id
      isCTConfigured
      isE2EConfigured
    }
}
`

const props = defineProps<{
  gql: SwitchTestingTypeModalFragment
  show: boolean
}>()

const emits = defineEmits<{
  (eventName: 'close'): void
}>()

const TESTING_TYPES = [
  {
    name: t('navigation.testingType.e2e.name'),
    description: t('navigation.testingType.e2e.description'),
    icon: IconE2E,
    iconSolid: IconE2ESolid,
    configured: props.gql.activeProject?.isE2EConfigured,
  },
  {
    name: t('navigation.testingType.component.name'),
    description: t('navigation.testingType.component.description'),
    icon: IconComponent,
    iconSolid: IconComponentSolid,
    configured: props.gql.activeProject?.isCTConfigured,
  },
]

</script>
