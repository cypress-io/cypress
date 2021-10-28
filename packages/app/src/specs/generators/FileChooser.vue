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
  <CreateSpecModalBody variant="bare" class="relative bg-white px-24px flex
  flex-col">
    <FileMatch
    class="sticky z-10 top-0px pt-24px pb-12px bg-white"
    :matches="matches"
    v-model:pattern="filePathSearch"
    v-model:extensionPattern="extensionPattern"
    />

    <div v-show="loading" data-testid="loading">Loading</div>
    <FileList v-show="!loading"
      @selectFile="selectFile"
      :files="filteredFiles"
      :search="filePathSearch"
    >
    <template #no-results>
      <NoResults
        emptySearch
        :search="noResults.search"
        :message="noResults.message"
        @clear="noResults.clear"/>
    </template>
    </FileList>
  </CreateSpecModalBody>
  <div class="rounded-b w-full h-24px"></div>
</template>

<script setup lang="ts">
import { useVModels, debouncedWatch, useDebounce } from '@vueuse/core'
import { useI18n } from '@cy/i18n'
import CreateSpecModalBody from './CreateSpecModalBody.vue'
import FileList from './FileList.vue'
import Button from '@cy/components/Button.vue'
import FileMatch from '../../components/FileMatch.vue'
import { computed, ref } from 'vue'

import type { Ref } from 'vue'
import NoResults from '@cy/components/NoResults.vue';

const props = withDefaults(defineProps<{
  files: any[]
  extensionPattern: string,
  loading?: boolean
}>(), {
  loading: false,
})

const { t } = useI18n()

type File = any
const emits = defineEmits<{
  (eventName: 'selectFile', value: File)
  (eventName: 'update:extensionPattern', value: string)
  (eventName: 'reset:extensionPattern')
}>()

const initialExtension = props.extensionPattern
const { extensionPattern } = useVModels(props, emits)
const filePathSearch = ref('')

const selectFile = (file) => { emits('selectFile', file) }

///*------- Debounce -------*/

const debounce = 200
const debouncedExtensionPattern = useDebounce(extensionPattern, debounce)
debouncedWatch(extensionPattern, (value) => {
  emits('update:extensionPattern', value)
}, { debounce })

const filteredFiles = computed(() => {
  return props.files?.filter((file) => {
    return file.relative.toLowerCase().includes(filePathSearch.value.toLowerCase())
  })
})

const matches = computed(() => ({
  total: props.files.length,
  found: filteredFiles.value.length
}))

const noResults = computed(() => ({
  search: filePathSearch.value || debouncedExtensionPattern.value,
  message: filePathSearch.value ? t('noResults.defaultMessage') : t('components.fileSearch.noMatchesForExtension'),
  clear: filePathSearch.value ?
    () => filePathSearch.value = '' :
    () => extensionPattern.value = initialExtension
}))

</script>
