<template>
  <div class="w-full border-gray-100 rounded border-1px">
    <div class="flex justify-between p-14px">
      <InlineCodeFragment>specPattern</InlineCodeFragment>
      <div>
        <OpenConfigFileInIDE>
          <button
            class="flex items-center text-indigo-500 gap-8px group outline-transparent"
          >
            <i-cy-document-text_x16 class="icon-light-gray-100 icon-dark-gray-500" />
            <span class="group-hocus:underline">cypress.config.js</span>
          </button>
        </OpenConfigFileInIDE>
      </div>
    </div>

    <div class="divide-gray-200 px-16px bg-gray-50 divide-y-1">
      <code
        v-for="pattern in specPatterns"
        :key="pattern"
        class="flex block text-gray-600 py-8px text-size-14px leading-24px"
      >
        {{ pattern }}
      </code>
    </div>
  </div>
</template>

<script lang="ts" setup>
import InlineCodeFragment from '@cy/components/InlineCodeFragment.vue'
import { computed } from 'vue'
import Button from '@cy/components/Button.vue'
import { gql } from '@urql/core'
import type { SpecPatternsFragment } from '../generated/graphql'
import OpenConfigFileInIDE from '@packages/frontend-shared/src/gql-components/OpenConfigFileInIDE.vue'

gql`
fragment SpecPatterns on Query {
  currentProject {
    id
    config
    currentTestingType
  }
}
`

const props = defineProps<{
  gql: SpecPatternsFragment
}>()

const specPatterns = computed<string[]>(() => {
  let patterns = props.gql.currentProject?.config.find((x) => x.field === props.gql.currentProject?.currentTestingType)?.value?.specPattern

  if (!patterns) {
    return []
  }

  return typeof patterns === 'string' ? [patterns] : patterns
})
</script>
