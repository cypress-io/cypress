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
              class="inline-flex items-center"
            >
              <SpecNameDisplay
                :spec-file-name="specData.fileName"
                :spec-file-extension="specData.fileExtension"
              />
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
              :to="{ path: '/specs/runner', query: { file: (specData.path).replace(/\\/g, '/') } }"
            >
              <template #prefix>
                <IconActionRefresh
                  data-cy="icon-refresh"
                  stroke-color="indigo-500"
                />
              </template>
              <!-- Wrapping this with a default template to avoid an unneeded space -->
              <template #default>
                {{ t('debugPage.runFailures') }}
              </template>
            </Button>
          </div>
        </div>
      </div>
      <div
        v-for="test in specData.failedTests"
        :key="`test-${test.id}`"
        data-cy="test-group"
        class="w-full flex flex-col flex-start h-12 items-start justify-center pl-16px border-b-gray-100 border-b-1px"
      >
        <DebugFailedTest
          :failed-test-result="test"
          :data-cy="`test-${test.id}`"
        />
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
export interface Spec {
  id: string
  path: string
  fileName: string
  fileExtension: string
}

export interface TestResults {
  id: string
  titleParts: string[]
}

import { computed } from 'vue'
import { IconActionRefresh } from '@cypress-design/vue-icon'
import DebugFailedTest from './DebugFailedTest.vue'
import Button from '@packages/frontend-shared/src/components/Button.vue'
import SpecNameDisplay from '../specs/SpecNameDisplay.vue'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

const props = defineProps<{
  spec: Spec
  testResults: TestResults[]
  isDisabled?: boolean
}>()

const specData = computed(() => {
  return {
    path: `${props.spec.path}/`,
    fileName: props.spec.fileName,
    fileExtension: props.spec.fileExtension,
    failedTests: props.testResults,
  }
})

</script>
