<template>
  <div class="w-full border-gray-100 rounded border-1px">
    <div class="flex items-center justify-between p-16px">
      <FileMatchIndicator>
        <i18n-t
          scope="global"
          keypath="components.specPattern.matches"
        >
          {{ props.gql.specs.length }}
        </i18n-t>
      </FileMatchIndicator>
      <OpenConfigFileInIDE>
        <span class="flex items-center text-indigo-500 outline-transparent gap-8px group">
          <i-cy-document-text_x16 class="icon-light-gray-50 icon-dark-gray-300" />
          <span class="group-hocus:underline">cypress.config.js</span>
        </span>
      </OpenConfigFileInIDE>
    </div>

    <div class="divide-gray-200 divide-y-1 bg-gray-50 px-16px">
      <code
        v-for="pattern in specPatterns"
        :key="pattern"
        class="flex block text-gray-600 py-8px text-size-14px leading-24px"
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
import type { SpecPatternsFragment } from '../generated/graphql'
import OpenConfigFileInIDE from '@packages/frontend-shared/src/gql-components/OpenConfigFileInIDE.vue'
import FileMatchIndicator from './FileMatchIndicator.vue'

gql`
fragment SpecPatterns on CurrentProject {
  id
  config
  currentTestingType
  specs {
    id
  }
}
`

const props = defineProps<{
  gql: SpecPatternsFragment
}>()

const specPatterns = computed<string[]>(() => {
  let patterns = props.gql.config.find((x) => x.field === props.gql.currentTestingType)?.value?.specPattern

  if (!patterns) {
    return []
  }

  return typeof patterns === 'string' ? [patterns] : patterns
})
</script>
