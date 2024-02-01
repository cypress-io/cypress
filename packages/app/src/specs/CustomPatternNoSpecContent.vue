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
        <IconTechnologyCodeEditor
          stroke-color="white"
          class="mr-[8px]"
        />

        {{ t('createSpec.updateSpecPattern') }}
      </Button>
    </OpenConfigFileInIDE>

    <Button
      size="40"
      variant="outline-light"
      @click="emit('showCreateSpecModal')"
    >
      <IconActionAddLarge
        strake-color="gray-500"
        class="mr-[8px]"
      />

      {{ t('createSpec.newSpec') }}
    </Button>
  </div>
</template>

<script lang="ts" setup>
import Button from '@cypress-design/vue-button'
import { IconActionAddLarge, IconTechnologyCodeEditor } from '@cypress-design/vue-icon'
import { gql } from '@urql/core'
import type { CustomPatternNoSpecContentFragment } from '../generated/graphql'
import SpecPatterns from '../components/SpecPatterns.vue'
import { useI18n } from '@cy/i18n'
import OpenConfigFileInIDE from '@cy/gql-components/OpenConfigFileInIDE.vue'

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
