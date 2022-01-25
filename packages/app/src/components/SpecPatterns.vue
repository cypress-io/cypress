<template>
  <div class="rounded border-gray-100 border-1px w-full">
    <div class="flex p-16px justify-between items-center">
      <FileMatchIndicator>
        <i18n-t
          scope="global"
          keypath="components.specPattern.matches"
        >
          {{ props.gql.specsBare?.edges.length }}
        </i18n-t>
      </FileMatchIndicator>
      <OpenConfigFileInIDE>
        <span class="flex outline-transparent text-indigo-500 gap-8px items-center group">
          <i-cy-document-text_x16 class="icon-light-gray-100 icon-dark-gray-500" />
          <span class="group-hocus:underline">cypress.config.js</span>
        </span>
      </OpenConfigFileInIDE>
    </div>

    <div class="divide-gray-200 divide-y-1 bg-gray-50 px-16px">
      <code
        v-for="pattern in specPatterns"
        :key="pattern"
        class="flex py-8px text-gray-600 text-size-14px leading-24px block"
        data-cy="spec-pattern"
      >
        {{ pattern }}
      </code>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import Button from '@cy/components/Button.vue'
import { gql } from '@urql/core'
import type { SpecPatternsFragment } from '../generated/graphql'
import OpenConfigFileInIDE from '@packages/frontend-shared/src/gql-components/OpenConfigFileInIDE.vue'
import FileMatchIndicator from './FileMatchIndicator.vue'

gql`
fragment SpecPatterns on CurrentProject {
  id
  config
  currentTestingType
  specsBare: specs(first: 100) {
    edges {
      node {
        id
      }
    }
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
