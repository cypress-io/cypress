<template>
  <Collapsible
    class="outline-none m-4px rounded overflow-hidden"
  >
    <template #target="{open}">
      <div
        class="gap-8px px-24px py-16px flex items-center cursor-pointer"
        data-cy="file-row"
      >
        <i-cy-status-passed-solid_x16 />
        <span class="text-jade-500 font-medium truncate">{{ file.spec.relative }}</span>
        <div class="justify-self-end flex-grow flex justify-end">
          <i-cy-chevron-down-small_x16
            :class="{ 'rotate-180': open }"
            class="transform transition duration-150 max-w-16px icon-dark-gray-400"
          />
        </div>
      </div>
    </template>
    <div class="rounded border-1 mx-24px mb-24px">
      <ShikiHighlight
        :code="file.content"
        line-numbers
        lang="js"
        copy-button
      />
    </div>
  </Collapsible>
</template>

<script lang="ts" setup>
import ShikiHighlight from '@cy/components/ShikiHighlight.vue'
import Collapsible from '@cy/components/Collapsible.vue'
import { gql } from '@urql/core'
import type { GeneratorSuccessFragment } from '../../generated/graphql'

gql`
fragment GeneratorSuccess on GeneratedSpec {
  id
  content
  spec {
    id
    fileName
    fileExtension
    baseName
    relative
  } 
}
`

defineProps<{
  file: GeneratorSuccessFragment
}>()
</script>
