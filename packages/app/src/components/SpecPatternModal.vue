<template>
  <StandardModal
    class="transition-all transition duration-200"
    variant="bare"
    :title="t('components.specPatternModal.title')"
    :model-value="show"
    data-cy="spec-pattern-modal"
    help-link="https://on.cypress.io/test-type-options"
    @update:model-value="emits('close')"
  >
    <div
      class="w-full p-[24px] sm:min-w-[640px]"
    >
      <SpecPatterns
        :gql="props.gql"
        class="border-px rounded border-gray-100"
      />
    </div>
    <StandardModalFooter
      class="flex gap-[16px] items-center"
    >
      <OpenConfigFileInIDE
        v-slot="{onClick}"
        :gql="props.gql"
      >
        <Button
          size="40"
          class="gap-[8px]"
          data-cy="open-config-file"
          @click="onClick"
        >
          <IconTechnologyCodeEditor />
          {{ t('createSpec.updateSpecPattern') }}
        </Button>
      </OpenConfigFileInIDE>
      <Button
        variant="outline-indigo"
        size="40"
        @click="emits('close')"
      >
        {{ t('components.modal.dismiss') }}
      </Button>
    </StandardModalFooter>
  </StandardModal>
</template>

<script lang="ts" setup>
import StandardModal from '@cy/components/StandardModal.vue'
import SpecPatterns from '../components/SpecPatterns.vue'
import { useI18n } from '@cy/i18n'
import type { SpecPatternModalFragment } from '../generated/graphql'
import { gql } from '@urql/core'
import StandardModalFooter from '@cy/components/StandardModalFooter.vue'
import Button from '@cypress-design/vue-button'
import { IconTechnologyCodeEditor } from '@cypress-design/vue-icon'
import OpenConfigFileInIDE from '../../../frontend-shared/src/gql-components/OpenConfigFileInIDE.vue'

gql`
fragment SpecPatternModal on CurrentProject {
  id
  ...SpecPatterns
  ...OpenConfigFileInIDE
}
`

const props = defineProps<{
  gql: SpecPatternModalFragment
  show: boolean
}>()

const { t } = useI18n()

const emits = defineEmits<{
  (eventName: 'close'): void
}>()
</script>
