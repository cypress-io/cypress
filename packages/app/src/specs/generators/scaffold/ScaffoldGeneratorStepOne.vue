<template>
  <div v-if="mutation.data.value">
    <ul class="max-h-320px overflow-auto">
      <li
        v-for="(row, idx) of specTree.tree"
        :key="idx"
        class="children:h-40px pl-24px flex items-center gap-8px font-medium border-b-gray-50 border-b-width-1px"
      >
        <i-cy-add-small_x16 class="icon-dark-jade-400" />
        <div
          v-if="!row.isLeaf"
          class="flex items-center"
          :style="{ paddingLeft: `${((row.depth - 2) * 10) }px` }"
        >
          <div
            class="grid grid-cols-[16px,auto] items-center gap-8px"
          >
            <i-cy-folder_x16
              class="icon-dark-white icon-light-gray-200 document-icon"
            />
            <span class="text-gray-700">{{ row.name }}</span>
          </div>
        </div>
        <div
          v-else
          class="flex items-center"
          :style="{ paddingLeft: `${((row.depth - 2) * 10)}px` }"
        >
          <div
            class="grid grid-cols-[16px,auto,auto] items-center"
          >
            <i-cy-document-blank_x16
              class="icon-light-gray-50 icon-dark-gray-200 document-icon"
            />

            <span class="pl-8px text-gray-900">
              {{ row.data?.fileName }}
            </span>
            <span class="text-gray-400 font-light text-gray-500">
              {{ row.data?.specFileExtension }}
            </span>
          </div>
        </div>
      </li>
    </ul>
    <StandardModalFooter>
      <Button
        size="lg"
        @click="emits('close')"
      >
        {{ t('createSpec.e2e.importFromScaffold.specsAddedButton') }}
      </Button>
    </StandardModalFooter>
  </div>
</template>

<script lang="ts" setup>
import { gql, useMutation } from '@urql/vue'
import { ScaffoldGeneratorStepOne_ScaffoldIntegrationDocument } from '../../../generated/graphql'
import { computed, onMounted } from 'vue'
import { buildSpecTree } from '@packages/frontend-shared/src/utils/spec-utils'
import { useCollapsibleTree } from '@packages/frontend-shared/src/composables/useCollapsibleTree'
import StandardModalFooter from '@cy/components/StandardModalFooter.vue'
import Button from '@cy/components/Button.vue'
import { useI18n } from '@cy/i18n'
import type { FoundSpec } from '@packages/types/src'

const { t } = useI18n()

gql`
mutation ScaffoldGeneratorStepOne_scaffoldIntegration {
  scaffoldIntegration {
    fileParts {
      id
      absolute
      relative
      baseName
      name
      fileExtension
      fileName
    }
  }
}
`

const emits = defineEmits<{
  (event: 'update:title', value: string): void,
  (event: 'update:description', value: string): void
  (event: 'close'): void
}>()

const mutation = useMutation(ScaffoldGeneratorStepOne_ScaffoldIntegrationDocument)

onMounted(async () => {
  emits('update:title', t('createSpec.e2e.importFromScaffold.specsAddingHeader'))
  await mutation.executeMutation({})
  emits('update:title', t('createSpec.e2e.importFromScaffold.specsAddedHeader'))
})

const scaffoldedFiles = computed(() => mutation.data.value?.scaffoldIntegration || [])
const specTree = computed(() => {
  const files: FoundSpec[] = scaffoldedFiles.value.map((res) => {
    return {
      ...res.fileParts,
      specType: 'integration',
      specFileExtension: res.fileParts.baseName.replace(res.fileParts.fileName, '') }
  })

  return useCollapsibleTree(buildSpecTree(files), { dropRoot: true })
})
</script>
