<template>
  <div class="h-full">
    <div
      v-if="errored"
      class="border-b border-b-gray-50 py-2 pl-[56px] text-gray-700"
    >
      {{ t('createSpec.unableToParseFile') }}
    </div>
    <div
      v-else-if="!getReactComponentsMutation.fetching.value && !components.length"
      class="border-b border-b-gray-50 py-2 pl-[56px] text-gray-700"
    >
      {{ t('createSpec.noComponentsFound') }}
    </div>
    <ul v-else>
      <li
        v-for="{exportName, isDefault} in components"
        :key="exportName"
      >
        <button
          data-cy="react-component-row"
          class="cursor-pointer flex border-b border-b-gray-50 leading-normal w-full pl-[56px] text-[16px] group items-center children:h-[40px] children:py-[8px]"
          @click="$emit('selectItem', {file, item: {exportName, isDefault}})"
        >
          <div
            class="h-full inline-flex whitespace-nowrap items-center overflow-hidden"
          >
            <i-cy-puzzle-piece_x16
              class="mr-[8px] text-sm fill-gray-50 stroke-gray-300 group-hocus:stroke-indigo-500 group-hocus:fill-indigo-50"
            />
            <span
              class="font-medium text-indigo-600 truncate"
            >
              {{ exportName }}</span>
          </div>
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '@cy/i18n'
import type { ReactComponentDescriptor } from '@packages/data-context/src/gen/graphcache-config.gen'
import { gql, useMutation } from '@urql/vue'
import { ref, onMounted } from 'vue'
import { ComponentList_GetReactComponentsFromFileDocument, FileListItemFragment } from '../../../generated/graphql'

const { t } = useI18n()
const errored = ref<boolean | undefined>(false)
const components = ref<readonly ReactComponentDescriptor[]>([])

gql`
mutation ComponentList_getReactComponentsFromFile($filePath: String!) {
  getReactComponentsFromFile(filePath: $filePath) {
    components {
      exportName
      isDefault
    }
    errored
  }
}`

const getReactComponentsMutation = useMutation(ComponentList_GetReactComponentsFromFileDocument)

const getComponents = async (file) => {
  const { data } = await getReactComponentsMutation.executeMutation({
    filePath: file.absolute,
  })

  errored.value = data?.getReactComponentsFromFile?.errored || undefined
  components.value = data?.getReactComponentsFromFile?.components || []
}

const props = defineProps<{
  file: FileListItemFragment
}>()

defineEmits<{
  (eventName: 'selectItem', value: { file: FileListItemFragment, item: ReactComponentDescriptor })
}>()

onMounted(() => {
  getComponents(props.file)
})

</script>
