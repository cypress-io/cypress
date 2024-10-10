<!--
/**==============================================
 * *             FileMatch.vue
 * Complex component to search and edit multiple
 * text filters at once
 * ==============================================
 * *           Collapsed (default)
 *
 * ? The user is searching by filePattern only as is
 * ? able to see the extensionPattern
 *
 * ? [[v extensionPattern][filePattern][matches]]
 *
 *
 * ----------------------------------------------
 * *               Expanded
 *
 * ? The user has two inputs and can edit filePattern
 * ? and extensionPattern independently.
 *
 * ? 1. The input is bound to extensionPattern.
 * ? 2. The bottom input is bound to the filePattern.
 *
 * ? [[v][extensionPattern][matches]]
 * ? [filePattern                   ]
 * ============================================**/
-->

<template>
  <div>
    <div class="rounded border h-[40px] w-full inline-flex items-center hocus-default focus-within-default truncate">
      <FileMatchButton
        :expanded="expanded"
        :aria-label="t('components.fileSearch.expandToSearchByExtensions')"
        @click="toggleExpanded()"
      >
        <span v-if="!expanded">{{ localExtensionPattern }}</span>
      </FileMatchButton>
      <div class="grow min-w-min inline-flex items-center group">
        <i-cy-magnifying-glass_x16
          v-if="!expanded"
          class="mr-[8px] ml-[12px] inline-block icon-light-gray-50 icon-dark-gray-500 group-focus-within:icon-light-indigo-50 group-focus-within:icon-dark-indigo-400"
        />

        <FileMatchInput
          v-if="expanded"
          v-model="localExtensionPattern"
          class="ml-[12px]"
          :aria-label="t('components.fileSearch.byExtensionInput')"
          :placeholder="t('components.fileSearch.byExtensionInput')"
        />
        <FileMatchInput
          v-else
          v-model="localPattern"
          aria-label="Search by filename"
          :placeholder="t('components.fileSearch.byFilenameInput')"
        />
      </div>
      <slot name="matches">
        <FileMatchIndicator
          class="mr-[8px] truncate"
          data-cy="file-match-indicator"
        >
          {{ indicatorText }}
        </FileMatchIndicator>
      </slot>
    </div>

    <div
      class="rounded border h-[40px] mt-[8px] w-full inline-flex items-center hocus-default focus-within-default"
      :class="{ 'hidden' : !expanded }"
    >
      <div class="grow inline-flex items-center group">
        <i-cy-magnifying-glass_x16 class="mr-[8px] ml-[12px] inline-block icon-light-gray-50 icon-dark-gray-500 group-focus-within:icon-light-indigo-50 group-focus-within:icon-dark-indigo-400" />
        <FileMatchInput
          v-model="localPattern"
          :aria-label="t('components.fileSearch.byFilenameInput')"
          :placeholder="t('components.fileSearch.byFilenameInput')"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import FileMatchInput from './FileMatchInput.vue'
import FileMatchButton from './FileMatchButton.vue'
import FileMatchIndicator from './FileMatchIndicator.vue'
import { computed } from 'vue'

import { useToggle, useVModels } from '@vueuse/core'

const { t } = useI18n()

type Matches = {
  total: number
  found: number
}

const props = defineProps<{
  extensionPattern: string
  pattern: string
  matches: Matches
}>()

const emits = defineEmits<{
  (eventName: 'update:extensionPattern', value: string): void
  (eventName: 'update:pattern', value: string): void
}>()

const { extensionPattern: localExtensionPattern, pattern: localPattern } = useVModels(props, emits)

// 2 of 22 Matches
// No Matches
const indicatorText = computed(() => {
  const numerator = props.matches.found
  const denominator = props.matches.total

  if (localPattern.value) {
    // When the user has attempted to search anything
    // "No Matches | 1 Match | { denominator } Matches"
    return t('components.fileSearch.matchesIndicator', { count: numerator, denominator, numerator })
  }

  // When the user has attempted to search by file path
  // "No Matches | {numerator} of {denominator} Matches"
  return t('components.fileSearch.matchesIndicatorEmptyFileSearch', { count: numerator, denominator, numerator })
})
const [expanded, toggleExpanded] = useToggle(false)
</script>
