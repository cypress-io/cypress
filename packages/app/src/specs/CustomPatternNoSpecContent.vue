<template>
  <!-- TODO: spread on props.gql is needed due to bug in mountFragment. Fix -->
  <SpecPatterns :gql="{...props.gql}" />

  <div class="flex justify-center gap-16px mt-32px">
    <OpenConfigFileInIDE>
      <Button
        size="lg"
      >
        <template #prefix>
          <i-cy-code-editor_x16 class="icon-dark-white" />
        </template>
        {{ t('createSpec.updateSpecPattern') }}
      </Button>
    </OpenConfigFileInIDE>

    <Button
      size="lg"
      variant="outline"
      @click="emit('newSpec')"
    >
      <template #prefix>
        <i-cy-add-large_x16 class="icon-dark-gray-500" />
      </template>
      {{ t('createSpec.newSpec') }}
    </Button>
  </div>
</template>

<script lang="ts" setup>
import Button from '@cy/components/Button.vue'
import { gql } from '@urql/core'
import type { CustomPatternNoSpecContentFragment } from '../generated/graphql'
import SpecPatterns from './SpecPatterns.vue'
import { useI18n } from '@cy/i18n'
import OpenConfigFileInIDE from '@packages/frontend-shared/src/gql-components/OpenConfigFileInIDE.vue'

const { t } = useI18n()

const emit = defineEmits<{
  (e: 'newSpec'): void
}>()

gql`
fragment CustomPatternNoSpecContent on Query {
  ...SpecPatterns
}
`

const props = defineProps<{
  gql: CustomPatternNoSpecContentFragment
}>()
</script>
