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
          <Tooltip
            placement="bottom"
            color="dark"
            :is-interactive="!!(runAllFailuresState.cta)"
            :disabled="!runAllFailuresState.disabled"
          >
            <Button
              data-cy="run-failures"
              variant="white"
              class="gap-x-10px inline-flex whitespace-nowrap justify-center items-center isolate"
              :disabled="runAllFailuresState.disabled"
              :to="{ path: '/specs/runner', query: { file: posixify(specData.fullPath) } }"
            >
              <template #prefix>
                <IconActionRefresh
                  data-cy="icon-refresh"
                  stroke-color="indigo-500"
                />
              </template>
              <!-- Wrapping this with a default template to avoid an unneeded space -->
              <template #default>
                {{ t('debugPage.runFailures.btn') }}
              </template>
            </Button>
            <template
              v-if="runAllFailuresState.disabled"
              #popper
            >
              <div
                class="flex flex-col text-sm max-w-350px items-center"
                data-cy="run-all-failures-tooltip"
              >
                <span class="text-center">{{ runAllFailuresState.message }}</span>
                <Button
                  v-if="runAllFailuresState.cta"
                  variant="text"
                  class="rounded-md font-medium bg-gray-800 my-12px"
                  @click="runAllFailuresState.cta?.action"
                >
                  {{ runAllFailuresState.cta.message }}
                </Button>
              </div>
            </template>
          </Tooltip>
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
  fullPath: string
}

export interface TestResults {
  readonly id: string
  readonly titleParts: ReadonlyArray<string>
}

import { computed } from 'vue'
import { IconActionRefresh } from '@cypress-design/vue-icon'
import DebugFailedTest from './DebugFailedTest.vue'
import Button from '@packages/frontend-shared/src/components/Button.vue'
import Tooltip from '@packages/frontend-shared/src/components/Tooltip.vue'
import SpecNameDisplay from '../specs/SpecNameDisplay.vue'
import { useI18n } from '@cy/i18n'
import { posixify } from '../paths'
import type { TestingTypeEnum } from '../generated/graphql'

const { t } = useI18n()

const props = defineProps<{
  spec: Spec
  testResults: TestResults[]
  foundLocally: boolean
  testingType: TestingTypeEnum
  matchesCurrentTestingType: boolean
}>()

const emits = defineEmits<{
  (event: 'switchTestingType', value: TestingTypeEnum): void
}>()

const specData = computed(() => {
  return {
    path: props.spec.path,
    fileName: props.spec.fileName,
    fileExtension: props.spec.fileExtension,
    failedTests: props.testResults,
    fullPath: props.spec.fullPath,
  }
})

const runAllFailuresState = computed(() => {
  if (!props.matchesCurrentTestingType) {
    return {
      disabled: true,
      message: t('debugPage.runFailures.switchTestingTypeInfo', { n: props.testResults.length, testingType: props.testingType }),
      cta: {
        message: t('debugPage.runFailures.switchTestingTypeAction', { testingType: props.testingType }),
        action: () => emits('switchTestingType', props.testingType),
      },
    }
  }

  if (!props.foundLocally) {
    return {
      disabled: true,
      message: t('debugPage.runFailures.notFoundLocally'),
    }
  }

  return { disabled: false }
})

</script>
