<template>
  <!-- TODO: spread on props.gql is needed due to bug in mountFragment. Fix -->
  <SpecPatterns
    :gql="{...props.gql}"
    @showCypressConfigInIDE="emit('showCypressConfigInIDE')"
  />

  <div class="flex justify-center gap-16px mt-32px">
    <Button
      size="lg"
      @click="emit('showCypressConfigInIDE')"
    >
      <template #prefix>
        <i-cy-code-editor_x16 class="icon-dark-white" />
      </template>
      {{ t('createSpec.updateSpecPattern') }}
    </Button>
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
import type { SpecPatternsFragment } from '../generated/graphql'
import SpecPatterns from './SpecPatterns.vue'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

const emit = defineEmits<{
  (e: 'showCypressConfigInIDE'): void
  (e: 'newSpec'): void
}>()

gql`
fragment SpecPatterns on CurrentProject {
  id
  config
}
`

const props = defineProps<{
  gql: SpecPatternsFragment
}>()
</script>
