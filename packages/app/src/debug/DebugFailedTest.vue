<template>
  <li
    data-cy="test-row"
    class="flex flex-row items-center py-12px pr-12px pl-16px gap-x-2.5 non-italic text-base text-gray-700 font-normal border-b-gray-100 border-b-1px"
  >
    <span
      data-cy="test-title"
    >
      {{ testData[0] }}
    </span>
    <IconChevronRightSmall
      size="8"
      stroke-color="gray-200"
      fill-color="gray-200"
    />
    <span
      data-cy="test-description"
    >
      {{ testData[1] }}
    </span>
  </li>
</template>
<script lang="ts" setup>
import { computed } from 'vue'
import { IconChevronRightSmall } from '@cypress-design/vue-icon'

const props = defineProps<{
  failedTest: string[]
}>()

const testData = computed(() => props.failedTest)

</script>
