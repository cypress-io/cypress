<template>
  <div v-if="mutation.data.value">
    <ul class="h-[320px] overflow-auto">
      <li
        v-for="(row, idx) of specTree.tree"
        :key="idx"
        class="flex font-medium border-b-gray-50 border-b-width-[1px] pl-[24px] gap-[8px] items-center children:h-[40px]"
      >
        <i-cy-add-small_x16 class="icon-dark-jade-400" />
        <div
          v-if="!row.isLeaf"
          class="flex items-center"
          :style="{ paddingLeft: `${((row.depth - 2) * 10) }px` }"
        >
          <div
            class="grid gap-[8px] grid-cols-[16px,auto] items-center"
          >
            <i-cy-folder_x16
              class="icon-dark-white icon-light-gray-200"
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
              class="icon-light-gray-50 icon-dark-gray-200"
            />

            <span class="pl-[8px] text-gray-900">
              {{ row.data?.fileName }}
            </span>
            <span class="font-light text-gray-400 text-gray-500">
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
import { ScaffoldGeneratorStepOne_E2eExamplesDocument } from '../../../generated/graphql'
import { computed, onMounted } from 'vue'
import { buildSpecTree } from '../../../specs/tree/useCollapsibleTree'
import { useCollapsibleTree } from '../../tree/useCollapsibleTree'
import StandardModalFooter from '@cy/components/StandardModalFooter.vue'
import Button from '@cy/components/Button.vue'
import { useI18n } from '@cy/i18n'
import type { FoundSpec } from '@packages/types/src'

const { t } = useI18n()

gql`
mutation ScaffoldGeneratorStepOne_e2eExamples {
  e2eExamples {
    file {
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
  (event: 'update:title', value: string): void
  (event: 'update:description', value: string): void
  (event: 'close'): void
}>()

const mutation = useMutation(ScaffoldGeneratorStepOne_E2eExamplesDocument)

onMounted(async () => {
  emits('update:title', t('createSpec.e2e.importFromScaffold.specsAddingHeader'))
  await mutation.executeMutation({})
  emits('update:title', t('createSpec.e2e.importFromScaffold.specsAddedHeader'))
})

const scaffoldedFiles = computed(() => mutation.data.value?.e2eExamples || [])
const specTree = computed(() => {
  const files: FoundSpec[] = scaffoldedFiles.value.map((res) => {
    return {
      ...res.file,
      specType: 'integration',
      specFileExtension: res.file.baseName.replace(res.file.fileName, '') }
  })

  return useCollapsibleTree(buildSpecTree(files), { dropRoot: true })
})
</script>
