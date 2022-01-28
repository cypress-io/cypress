<template>
  <StandardModal
    class="transition-all transition duration-200"
    variant="bare"
    :title="t('components.specPatternModal.title')"
    :model-value="show"
    data-cy="spec-pattern-modal"
    help-link="https://on.cypress.io"
    @update:model-value="emits('close')"
  >
    <div
      class="w-full p-24px sm:min-w-640px"
    >
      <SpecPatterns
        :gql="props.gql"
        class="border-gray-100 rounded border-px"
      />
    </div>
    <StandardModalFooter
      class="flex items-center h-72px gap-16px"
    >
      <OpenConfigFileInIDE>
        <Button size="lg">
          <template #prefix>
            <i-cy-code-editor_x16 class="icon-dark-white" />
          </template>
          {{ t('createSpec.updateSpecPattern') }}
        </Button>
      </OpenConfigFileInIDE>
      <Button
        variant="outline"
        size="lg"
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
import Button from '../../../frontend-shared/src/components/Button.vue'
import OpenConfigFileInIDE from '../../../frontend-shared/src/gql-components/OpenConfigFileInIDE.vue'

gql`
fragment SpecPatternModal on CurrentProject {
  id
  ...SpecPatterns
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
