<template>
  <div class="h-full">
    <div
      v-if="!loading && !components.length"
      class="border-b-1 border-b-gray-50 py-2 pl-56px"
    >
      {{ t('createSpec.noComponentsFound') }}
    </div>
    <ul v-else>
      <li
        v-for="{displayName} in components"
        :key="displayName"
      >
        <div
          class="cursor-pointer flex border-b-1 border-b-gray-50 leading-normal pl-56px text-16px
    gap-8px group items-center last last:py-0 last:items-start children:h-40px children:py-8px"
          @click="$emit('selectItem', {file, item: displayName})"
        >
          <div
            class="h-full inline-flex whitespace-nowrap items-center overflow-hidden"
          >
            <i-cy-puzzle-piece_x16
              class="mr-8px text-sm fill-gray-50 stroke-gray-300"
            />
            <span
              class="font-medium text-indigo-500 group-hocus:text-indigo-500"
            >
              {{ displayName }}</span>
          </div>
        </div>
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
const loading = ref(false)
const components = ref<readonly ReactComponentDescriptor[]>([])

gql`
mutation ComponentList_getReactComponentsFromFile($filePath: String!) {
  getReactComponentsFromFile(filePath: $filePath) {
    displayName
  }
}`

const getReactComponentsMutation = useMutation(ComponentList_GetReactComponentsFromFileDocument)

const getComponents = async (file) => {
  loading.value = true

  const { data } = await getReactComponentsMutation.executeMutation({
    filePath: file.absolute,
  })

  components.value = data?.getReactComponentsFromFile || []

  loading.value = false
}

const props = defineProps<{
  file: FileListItemFragment
}>()

defineEmits<{
  (eventName: 'selectItem', value: {file: FileListItemFragment, item: string})
}>()

onMounted(() => {
  getComponents(props.file)
})

</script>
