<template>
  <Collapsible class="border-1 hocus-default cursor-pointer  border-gray-50 rounded ">
    <template #target="{open}">
      <div class="gap-8px px-24px py-16px flex items-center" data-testid="file-row">
        <i-cy-status-passed-solid_x16></i-cy-status-passed-solid_x16>
        <span class="text-jade-500 font-medium truncate">{{ file.spec.relative }}</span>
        <div class="justify-self-end flex-grow flex justify-end">
          <i-cy-chevron-down-small_x16
            :class="{ 'rotate-180': open }"
            class="transform transition duration-150 max-w-16px icon-dark-gray-400"
          />
        </div>
      </div>
    </template>
    <div class="rounded border-1 mx-24px mb-16px overflow-hidden">
      <ShikiHighlight :code="file.content" lineNumbers lang="js" :copyOnClick="false" />
    </div>
  </Collapsible>
</template>

<script lang="ts" setup>
import ShikiHighlight from '@cy/components/ShikiHighlight.vue';
import Collapsible from '@cy/components/Collapsible.vue'

// TODO(tim): Fix gql types
interface GeneratedFile {
  content: string
  spec: {
    relative: string
  }
}

defineProps<{
  file: GeneratedFile
}>()
</script>