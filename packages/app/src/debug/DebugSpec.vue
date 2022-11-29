<template>
  <div
    data-cy="debug-spec-col"
    class="grid flex flex-col px-24px gap-24px self-stretch"
  >
    <div
      data-cy="debug-spec-item"
      class="w-full overflow-hidden flex flex-col items-start box-border border-1px rounded"
    >
      <ul
        data-cy="debug-spec-header"
        class="w-full flex flex-row items-center py-12px bg-gray-50 border-b-1px border-b-gray-100 rounded-t"
      >
        <li
          data-cy="spec-contents"
          class="flex flex-row px-16px items-center gap-x-2"
        >
          <span
            data-cy="spec-path"
            class="w-145 non-italic text-base"
          >
            <span
              class="font-normal text-gray-600"
            >
              {{ specData.initialPath }}
            </span>
            <span
              class="font-medium text-gray-900"
            >
              {{ specData.specName.split('.')[0] }}
            </span>
            <span
              class="font-normal text-gray-600"
            >
              {{ "." + specData.specName.split('.').slice(1, specData.specName.length).join('.') }}
            </span>
          </span>
          <button
            v-if="!disabled"
            data-cy="run-failures"
            class="inline-flex gap-x-10px whitespace-nowrap h-8 justify-center items-center
            isolate rounded border border-gray-100 bg-white non-italic text-sm text-indigo-500 font-medium px-12px"
          >
            <IconActionRefresh
              data-cy="icon-refresh"
              stroke-color="indigo-500"
            />
            Run Failures
          </button>
          <button
            v-else
            data-cy="run-failures-disabled"
            class="inline-flex gap-x-10px whitespace-nowrap h-8 justify-center items-center
            isolate rounded border border-gray-100 bg-white non-italic text-sm text-gray-500 font-medium px-12px"
            :disabled="disabled"
          >
            <IconActionRefresh stroke-color="gray-500" />
            Run Failures
          </button>
        </li>
      </ul>
      <ul
        v-for="test in specData.failedTests"
        :key="`test-${test.id}`"
        data-cy="test-group"
        class="w-full flex flex-col flex-start h-12"
      >
        <DebugFailedTest
          :failed-test="test.titleParts"
          :data-cy="`test-${test.id}`"
        />
      </ul>
    </div>
  </div>
</template>
<script lang="ts" setup>
export interface Spec {
  id: string
  path: string
}

export interface TestResults {
  id: string
  titleParts: string[]
}

import { computed } from 'vue'
import { IconActionRefresh } from '@cypress-design/vue-icon'
import DebugFailedTest from './DebugFailedTest.vue'

const props = defineProps<{
  spec: Spec
  testResults: TestResults[]
  disabled?: boolean
}>()

const splitHeader = (relativePath: string) => {
  const before = relativePath.split('/')

  return {
    initialPath: `${before.slice(0, before.length - 1).join('/') }/`,
    specName: before.slice(-1)[0],
  }
}

const specData = computed(() => {
  const header = splitHeader(props.spec.path)

  return {
    ...header,
    failedTests: props.testResults,
  }
})

</script>
