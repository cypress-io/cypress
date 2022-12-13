<template>
  <div
    data-cy="debug-spec-item"
    class="rounded flex flex-col border-t-1px border-x-1px w-full overflow-hidden items-start box-border"
  >
    <div
      data-cy="debug-spec-header"
      class="rounded-t flex flex-row bg-gray-50 border-b-1px border-b-gray-100 w-full py-12px items-center"
    >
      <div
        data-cy="spec-contents"
        class="flex flex-row w-full px-16px items-center"
      >
        <div
          data-cy="spec-path"
          class="flex-grow text-base non-italic truncate"
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
            class="gap-x-10px inline-flex whitespace-nowrap justify-center items-center isolate"
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
      class="flex flex-col flex-start border-b-gray-100 border-b-1px h-12 w-full pl-16px items-start justify-center"
    >
      <DebugFailedTest
        :failed-test-result="test"
        :data-cy="`test-${test.id}`"
      />
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
  readonly id: string
  readonly titleParts: ReadonlyArray<string>
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
    path: props.spec.path,
    fileName: props.spec.fileName,
    fileExtension: props.spec.fileExtension,
    failedTests: props.testResults,
  }
})

</script>
