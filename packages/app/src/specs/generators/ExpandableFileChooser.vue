<!--
/**==============================================
 * *          ExpandableFileChooser.vue
 * Filter a list of files by a mix of glob pattern
 * and a search string that includes a file's relative
 * path.
 *
 * When clicked, the files will expand to display the
 * #expanded-content slot.
 *
 * Features to note: debouncing + loading + row expanding
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
    class="bg-white flex flex-col px-[24px]
  relative"
  >
    <FileMatch
      ref="fileMatchRef"
      v-model:pattern="filePathSearch"
      v-model:extensionPattern="localExtensionPattern"
      class="bg-white pt-[24px] pb-[12px] top-[0px] z-10 sticky"
      :matches="matches"
    >
      <template
        v-if="loading"
        #matches
      >
        <i-cy-loading_x16 class="h-[24px] mr-[10px] animate-spin w-[24px]" />
      </template>
    </FileMatch>
    <ExpandableFileList
      v-show="!loading"
      :style="{ paddingTop: `${fileMatchHeight + 36}px` }"
      class="right-[24px] left-[24px] absolute"
      :files="filteredFiles"
      :search="filePathSearch"
    >
      <template #expanded-content="{file}">
        <slot
          name="item"
          :file="file"
        />
      </template>
      <template #no-results>
        <NoResults
          empty-search
          :search-term="noResults.search"
          :message="noResults.message"
          @clear="noResults.clear"
        />
      </template>
    </ExpandableFileList>
  </CreateSpecModalBody>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { debouncedWatch, useDebounce, useElementSize } from '@vueuse/core'
import { useI18n } from '@cy/i18n'

import NoResults from '@cy/components/NoResults.vue'
import CreateSpecModalBody from './CreateSpecModalBody.vue'
import ExpandableFileList from './ExpandableFileList.vue'
import FileMatch from '../../components/FileMatch.vue'
import { gql } from '@urql/core'
import type { FileParts } from '@packages/data-context/src/gen/graphcache-config.gen'

const props = withDefaults(defineProps<{
  files: FileParts[]
  extensionPattern: string
  loading?: boolean
}>(), {

  loading: false,
})

const { t } = useI18n()

gql`
fragment FileChooser on FileParts {
  relative
  id
  ...FileListItem
}
`

const emits = defineEmits<{
  (eventName: 'update:extensionPattern', value: string)
}>()

// eslint-disable-next-line
const initialExtensionPattern = props.extensionPattern
const localExtensionPattern = ref(props.extensionPattern)
const filePathSearch = ref('')

///*------- Styling -------*/

// For the FileList to be searchable without jumping to the top of the
// FileMatcher's top when focused, we need to use some manual layout.
// If we concede on position: sticky for the FileMatcher or on making the
// FileList accessible, we could position the FileList relatively.
const fileMatchRef = ref(null)
const { height: fileMatchHeight } = useElementSize(fileMatchRef)

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
    clear: () => {
      if (filePathSearch.value) {
        filePathSearch.value = ''
      } else {
        localExtensionPattern.value = initialExtensionPattern
      }
    },
  }
})

</script>
