<!--
/**==============================================
 * *             FileChooser.vue
 * Filter a list of files by a mix of glob pattern
 * and a search string that includes a file's relative
 * path.
 *
 * Features to note: debouncing + loading
 * ==============================================
 * *                Debouncing
 *
 * ? To prevent calling update too frequently we debounce
 * ? both the "No Results" UI and the update event
 *
 * ============================================**/
-->

<template>
  <CreateSpecModalBody
    variant="bare"
    class="relative bg-white px-24px flex
  flex-col"
  >
    <FileMatch
      v-model:pattern="filePathSearch"
      v-model:extensionPattern="localExtensionPattern"
      class="sticky z-10 top-0px pt-24px pb-12px bg-white"
      :matches="matches"
    />

    <div
      v-show="loading"
      data-testid="loading"
    >
      Loading
    </div>
    <FileList
      v-show="!loading"
      :files="filteredFiles"
      :search="filePathSearch"
      @selectFile="selectFile"
    >
      <template #no-results>
        <NoResults
          empty-search
          :search="noResults.search"
          :message="noResults.message"
          @clear="noResults.clear"
        />
      </template>
    </FileList>
  </CreateSpecModalBody>
  <div class="rounded-b w-full h-24px" />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { debouncedWatch, useDebounce } from '@vueuse/core'
import { useI18n } from '@cy/i18n'

// eslint-disable-next-line no-duplicate-imports
import type { Ref } from 'vue'

import Button from '@cy/components/Button.vue'
import NoResults from '@cy/components/NoResults.vue'
import CreateSpecModalBody from './CreateSpecModalBody.vue'
import FileList from './FileList.vue'
import FileMatch from '../../components/FileMatch.vue'

type File = any // TODO: proper file typing

const props = withDefaults(defineProps<{
  files: File[]
  extensionPattern: string,
  loading?: boolean
}>(), {
  loading: false,
})

const { t } = useI18n()

const emits = defineEmits<{
  (eventName: 'selectFile', value: File)
  (eventName: 'update:extensionPattern', value: string)
}>()

const localExtensionPattern = ref(props.extensionPattern)
const filePathSearch = ref('')

const selectFile = (file) => {
  emits('selectFile', file)
}

///*------- Debounce -------*/

const debounce = 200
const debouncedExtensionPattern = useDebounce(localExtensionPattern, debounce)

debouncedWatch(localExtensionPattern, (value) => {
  emits('update:extensionPattern', value)
}, { debounce })

///*------- Searching files -------*/

const filteredFiles = computed(() => {
  return props.files?.filter((file) => {
    return file.relative.toLowerCase().includes(filePathSearch.value.toLowerCase())
  })
})

///*------- Matches Indicator -------*/

const matches = computed(() => {
  return {
    total: props.files.length,
    found: filteredFiles.value.length,
  }
})

///*------- No Results Options -------*/

const noResults = computed(() => {
  return {
    search: filePathSearch.value || debouncedExtensionPattern.value,
    message: filePathSearch.value ? t('noResults.defaultMessage') : t('components.fileSearch.noMatchesForExtension'),
    clear: filePathSearch.value ?
      () => filePathSearch.value = '' :
      () => localExtensionPattern.value = props.extensionPattern,
  }
})

</script>
