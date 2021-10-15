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
  <div class="inline-flex items-center rounded border-1 w-592px hocus-default focus-within-default h-40px">
  <FileMatchButton @click="toggleExpanded" :expanded="expanded">
    <span v-if="!expanded">{{ extensionPattern }}</span>
  </FileMatchButton>
  <div class="inline-flex items-center flex-grow group">
    <i-cy-magnifying-glass_x16 v-if="!expanded" class="inline-block ml-12px mr-8px icon-light-gray-50 icon-dark-gray-500 group-focus-within:icon-light-indigo-50 group-focus-within:icon-dark-indigo-400"/>

    <FileMatchInput v-if="expanded" v-model="extensionPattern" class="ml-12px" :placeholder="t('components.fileSearch.byExtensionInput')"/>
    <FileMatchInput v-else v-model="pattern" :placeholder="t('components.fileSearch.byFilenameInput')"/>
  </div>
  
  <FileMatchIndicator>
  {{ indicatorText }}
  </FileMatchIndicator>
  </div>

<div class="inline-flex items-center rounded mt-8px border-1 w-592px hocus-default focus-within-default h-40px" :class="{ 'hidden' : !expanded }">
  <div class="inline-flex items-center flex-grow group">
    <i-cy-magnifying-glass_x16 class="inline-block ml-12px mr-8px icon-light-gray-50 icon-dark-gray-500 group-focus-within:icon-light-indigo-50 group-focus-within:icon-dark-indigo-400"/>
    <FileMatchInput v-model="pattern" :placeholder="t('components.fileSearch.byFilenameInput')"/>
  </div>
  
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import FileMatchInput from './FileMatchInput.vue'
import FileMatchButton from './FileMatchButton.vue'
import FileMatchIndicator from './FileMatchIndicator.vue'
import { ref, computed } from 'vue'
import { useToggle } from '@vueuse/core'

const specs = ref([])
const foundSpecs = computed(() => specs.value)
const pattern = ref('')
const extensionPattern = ref('*.vue')

const { t } = useI18n()

// 2 of 22 Matches
// No Matches
const indicatorText = computed(() => {
  const numerator = foundSpecs.value.length
  const denominator = specs.value.length
  if (pattern.value) {
    // When the user has attempted to search anything
    // "No Matches | 1 Match | { denominator } Matches"
    return t('components.fileSearch.matchesIndicator', { numerator, denominator })
  }
  // When the user has attempted to search by file path
  // "No Matches | {numerator} of {denominator} Matches"
  return t('components.fileSearch.matchesIndicatorEmptyFileSearch', { numerator, denominator })
})
const [expanded, toggleExpanded] = useToggle(false)
</script>