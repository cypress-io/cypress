<template>
  <Collapsible
    class="rounded outline-none m-[4px] overflow-hidden"
    :initially-open="true"
  >
    <template #target="{open}">
      <div
        class="cursor-pointer flex py-[16px] px-[24px] gap-[8px] items-center"
        data-cy="file-row"
      >
        <i-cy-status-passed-solid_x16 />
        <span class="font-medium text-jade-500 truncate">{{ file.relative }}</span>
        <div class="grow flex justify-self-end justify-end">
          <i-cy-chevron-down-small_x16
            :class="{ 'rotate-180': open }"
            class="max-w-[16px] transform transition duration-150 icon-dark-gray-400"
          />
        </div>
      </div>
    </template>
    <div class="rounded border mx-[24px] mb-[24px]">
      <ShikiHighlight
        :code="file.contents"
        line-numbers
        lang="js"
      />
    </div>
  </Collapsible>
</template>

<script lang="ts" setup>
import ShikiHighlight from '@cy/components/ShikiHighlight.vue'
import Collapsible from '@cy/components/Collapsible.vue'
import { gql } from '@urql/core'
import type { GeneratorSuccessFileFragment } from '../../generated/graphql'

gql`
fragment GeneratorSuccessFile on ScaffoldedFile {
  file {
    id
    fileName
    fileExtension
    baseName
    relative
    contents
  }
}
`

gql`
fragment GeneratorSuccess on GenerateSpecResponse {
  # Used to update the cache after a spec is created, so when the user tries to
  # run it, it already exists
  currentProject {
    id
    specs {
      id
      ...SpecNode_InlineSpecList
    }
  }
  generatedSpecResult {
    ... on ScaffoldedFile {
      ...GeneratorSuccessFile
    }
  }
}
`

defineProps<{
  file: GeneratorSuccessFileFragment['file']
}>()
</script>
