<template>
  <StandardModal
    class="transition duration-200 transition-all"
    :click-outside="false"
    variant="bare"
    :title="t('navigation.chooseTestingType')"
    :model-value="show"
    data-cy="switch-modal"
    @update:model-value="emit('close')"
  >
    <div>
      <div>E2E</div>
      <div>CT</div>
    </div>
  </StandardModal>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { gql } from '@urql/vue'
import { TESTING_TYPES } from '@packages/types/src'
import type { SwitchTestingTypeButtonFragment } from '../generated/graphql'
import StandardModal from '@cy/components/StandardModal.vue'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

gql`
fragment SwitchTestingTypeButton on App {
  activeTestingType
}
`

const props = defineProps<{
  show: boolean
  gql: SwitchTestingTypeButtonFragment
}>()

const emit = defineEmits(['close'])

const testingTypeName = computed(() => {
  return TESTING_TYPES.find((tt) => tt.type === props.gql.activeTestingType)?.title
})

</script>
