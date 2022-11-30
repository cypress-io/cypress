<template>
  <div
    data-cy="test-row"
    class="flex flex-row items-center gap-x-2.5 non-italic text-base text-gray-700 font-normal"
  >
    <li
      v-for="(titlePart, index) in props.failedTestResult.titleParts"
      :key="`${titlePart}-${index}`"
      class="flex flew-row items-center gap-x-2.5"
      :data-cy="`titleParts-${index}`"
    >
      {{ titlePart }}
      <IconChevronRightSmall
        v-if="(index != props.failedTestResult.titleParts.length - 1)"
        data-cy="right-chevron"
        size="8"
        stroke-color="gray-200"
        fill-color="gray-200"
      />
    </li>
  </div>
</template>
<script lang="ts" setup>
import { IconChevronRightSmall } from '@cypress-design/vue-icon'
import type { TestResults } from './DebugSpec.vue'

const props = defineProps<{
  failedTestResult: TestResults
}>()

</script>
