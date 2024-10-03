<template>
  <div class="rounded border-gray-100 border-[1px] w-full">
    <div class="flex p-[16px] items-center justify-between">
      <FileMatchIndicator :variant="props.variant">
        <span v-if="props.variant === 'info'">specPattern</span>
        <span v-else>{{ t('components.specPattern.matches', props.gql.specs.length) }}</span>
      </FileMatchIndicator>
      <OpenConfigFileInIDE
        v-slot="{onClick}"
        :gql="props.gql"
      >
        <button
          aria-label="open in IDE"
          class="flex outline-transparent text-indigo-500 gap-[8px] items-center group"
          @click="onClick"
        >
          <i-cy-document-text_x16 class="icon-light-gray-100 icon-dark-gray-500" />
          <span class="group-hocus:underline">{{ props.gql.configFile }}</span>
        </button>
      </OpenConfigFileInIDE>
    </div>

    <div class="divide-gray-200 divide-y bg-gray-50 px-[16px]">
      <code
        v-for="pattern in specPatterns"
        :key="pattern"
        class="flex py-[8px] text-gray-600 text-[14px] leading-[24px] block"
        data-cy="spec-pattern"
      >
        {{ pattern }}
      </code>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { gql } from '@urql/core'
import { useI18n } from 'vue-i18n'
import type { SpecPatternsFragment } from '../generated/graphql'
import OpenConfigFileInIDE from '@packages/frontend-shared/src/gql-components/OpenConfigFileInIDE.vue'
import FileMatchIndicator from './FileMatchIndicator.vue'

gql`
fragment SpecPatterns on CurrentProject {
  id
  config
  currentTestingType
  ...OpenConfigFileInIDE
  configFile
  specs {
    id
  }
}
`

const { t } = useI18n()
const props = defineProps<{
  gql: SpecPatternsFragment
  variant?: 'default' | 'info'
}>()

const specPatterns = computed<string[]>(() => {
  const patterns = props.gql.config.find((x) => x.field === 'specPattern')?.value

  if (!patterns) {
    return []
  }

  return typeof patterns === 'string' ? [patterns] : patterns
})
</script>
