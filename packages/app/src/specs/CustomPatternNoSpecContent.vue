<template>
  <SpecPatterns :gql="props.gql" />

  <div class="flex mt-[32px] gap-[16px] justify-center">
    <OpenConfigFileInIDE
      v-slot="{onClick}"
      :gql="props.gql"
    >
      <Button
        size="40"
        @click="onClick"
      >
        <i-cy-code-editor_x16 class="icon-dark-white mr-[8px]" />
        {{ t('createSpec.updateSpecPattern') }}
      </Button>
    </OpenConfigFileInIDE>

    <Button
      size="40"
      variant="outline-light"
      @click="emit('showCreateSpecModal')"
    >
      <i-cy-add-large_x16 class="icon-dark-gray-500 mr-[8px]" />
      {{ t('createSpec.newSpec') }}
    </Button>
  </div>
</template>

<script lang="ts" setup>
import Button from '@cypress-design/vue-button'
import { gql } from '@urql/core'
import type { CustomPatternNoSpecContentFragment } from '../generated/graphql'
import SpecPatterns from '../components/SpecPatterns.vue'
import { useI18n } from '@cy/i18n'
import OpenConfigFileInIDE from '@packages/frontend-shared/src/gql-components/OpenConfigFileInIDE.vue'

const { t } = useI18n()

gql`
fragment CustomPatternNoSpecContent on CurrentProject {
  id
  ...SpecPatterns
  ...OpenConfigFileInIDE
  configFileAbsolutePath
}
`

const props = defineProps<{
  gql: CustomPatternNoSpecContentFragment
}>()

const emit = defineEmits<{
  (e: 'showCreateSpecModal'): void
}>()

</script>
