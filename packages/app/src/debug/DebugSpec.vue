<template>
  <div
    data-cy="debug-spec-col"
    class="grid flex flex-col px-24px gap-24px self-stretch"
  >
    <div
      data-cy="debug-spec-item"
      class="w-full overflow-hidden flex flex-col items-start box-border border-t-1px border-x-1px rounded"
    >
      <div
        data-cy="debug-spec-header"
        class="w-full flex flex-row items-center py-12px bg-gray-50 border-b-1px border-b-gray-100 rounded-t"
      >
        <div
          data-cy="spec-contents"
          class="w-full flex flex-row px-16px items-center"
        >
          <div
            data-cy="spec-path"
            class="flex-grow non-italic text-base truncate"
          >
            <span
              class="font-normal text-gray-600"
            >
              {{ specData.path }}
            </span>
            <span
              class="font-medium text-gray-900"
            >
              {{ specData.fileName }}
            </span>
            <span
              class="font-normal text-gray-600"
            >
              {{ specData.extension }}
            </span>
          </div>
          <div
            class="ml-10px"
          >
            <Button
              data-cy="run-failures"
              variant="white"
              class="inline-flex gap-x-10px whitespace-nowrap justify-center items-center isolate"
              :disabled="isDisabled"
              :to="{ path: '/specs/runner', query: { file: (specData.path + specData.fileName + specData.extension).replace(/\\/g, '/') } }"
            >
              <template #prefix>
                <IconActionRefresh
                  data-cy="icon-refresh"
                  stroke-color="indigo-500"
                />
              </template>
              Run Failures
            </Button>
          </div>
        </div>
      </div>
      <ul
        v-for="test in specData.failedTests"
        :key="`test-${test.id}`"
        data-cy="test-group"
        class="w-full flex flex-col flex-start h-12 items-start justify-center pl-16px border-b-gray-100 border-b-1px"
      >
        <DebugFailedTest
          :failed-test-result="test"
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
import Button from '@packages/frontend-shared/src/components/Button.vue'

const props = defineProps<{
  spec: Spec
  testResults: TestResults[]
  isDisabled?: boolean
}>()

/**
 * @param relativePath: The relative path of a failed test e.g. cypress/test/auth.spec.ts
 * We split the relative path into 3 pieces and return an object containing this split sections
 * so we can correctly style the relative path in the debug spec header. For example:
 * path: cypress/tests/ ; fileName: auth ; extension: .spec.ts
 */
const splitHeader = (relativePath: string) => {
  const before = relativePath.split('/')
  const specName = before.slice(-1)[0]
  const splitSpecName = specName.split('.')

  return {
    path: `${before.slice(0, before.length - 1).join('/') }/`,
    fileName: splitSpecName[0],
    extension: `.${ splitSpecName.slice(1, specName.length).join('.')}`,
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
