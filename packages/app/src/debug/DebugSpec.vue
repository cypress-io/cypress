<template>
  <div
    data-cy="debug-spec-col"
    class="flex flex-col grid gap-[24px] self-stretch"
  >
    <div
      data-cy="debug-spec-item"
      class="rounded flex flex-col border-gray-100 border-t-[1px] border-x-[1px] w-full overflow-hidden items-start box-border"
    >
      <div
        data-cy="debug-spec-header"
        class="rounded-t flex flex-row bg-gray-50 border-b-[1px] border-b-gray-100 w-full py-[12px] items-center"
      >
        <div
          data-cy="spec-contents"
          class="flex w-full grid px-[18px] gap-y-[8px] items-center"
        >
          <div class="flex items-center w-full truncate grow gap-x-2">
            <Tooltip
              v-if="foundLocally"
              placement="bottom"
              color="dark"
              :distance="8"
            >
              <OpenFileInIDE
                v-slot="{onClick}"
                :file-path="specData.fullPath"
              >
                <button
                  class="rounded-md border-[1px] border-gray-100 p-[4px] group hocus:border-indigo-200"
                  :aria-label="t('debugPage.openFile.openInIDE')"
                  @click="onClick"
                >
                  <IconDocumentText
                    stroke-color="gray-500"
                    fill-color="gray-100"
                    hocus-stroke-color="indigo-400"
                    hocus-fill-color="indigo-200"
                    size="16"
                    interactive-colors-on-group
                    class="min-w-[16px]"
                  />
                </button>
              </OpenFileInIDE>
              <template
                #popper
              >
                <div
                  class="text-center text-sm max-w-[240px]"
                  data-cy="open-in-ide-tooltip"
                >
                  {{ t('debugPage.openFile.openInIDE') }}
                </div>
              </template>
            </Tooltip>
            <Tooltip
              v-else
              placement="bottom"
              color="dark"
              :distance="8"
            >
              <button
                aria-disabled
                :aria-label="t('debugPage.openFile.notFoundLocally')"
                class="rounded-md border-[1px] border-gray-100 p-[4px]"
              >
                <IconDocumentMinus
                  stroke-color="gray-500"
                  fill-color="gray-100"
                  size="16"
                  class="min-w-[16px]"
                />
              </button>
              <template
                #popper
              >
                <div
                  class="text-center text-sm max-w-[240px]"
                  data-cy="open-in-ide-disabled-tooltip"
                >
                  {{ t('debugPage.openFile.notFoundLocally') }}
                </div>
              </template>
            </Tooltip>
            <div
              data-cy="spec-path"
              class="text-base truncate grow non-italic"
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
          </div>
          <div
            data-cy="spec-header-metadata"
          >
            <TransitionQuickFade
              mode="out-in"
            >
              <StatsMetaData
                v-if="(Object.keys(specData.groups).length === 1)"
                :key="'single'"
                :order="['DURATION','OS','BROWSER','TESTING']"
                :spec-duration="specData.specDuration!"
                :testing="specData.testingType"
                :groups="Object.values(specData.groups)"
              >
                <template #prefix>
                  <ResultCounts
                    data-cy="debugHeader-results"
                    :total-failed="specData.testsFailed"
                    :total-passed="specData.testsPassed"
                    :total-pending="specData.testsPending"
                    :order="['FAILED', 'PASSED', 'PENDING']"
                  />
                </template>
              </StatsMetaData>
              <StatsMetaData
                v-else-if="(Object.keys(specData.groups).length > 1)"
                :key="'multiple'"
                :order="['DURATION', 'GROUPS', 'G_OS', 'G_BROWSERS', 'TESTING']"
                :spec-duration="specData.specDuration!"
                :testing="specData.testingType"
                :groups="Object.values(specData.groups)"
              >
                <template #prefix>
                  <ResultCounts
                    data-cy="debugHeader-results"
                    :total-failed="specData.testsFailed"
                    :total-passed="specData.testsPassed"
                    :total-pending="specData.testsPending"
                    :order="['FAILED', 'PASSED', 'PENDING']"
                  />
                </template>
              </StatsMetaData>
            </TransitionQuickFade>
          </div>
        </div>
        <div
          class="mr-[16px]"
        >
          <Tooltip
            placement="bottom"
            color="dark"
            :is-interactive="!!(runAllFailuresState.cta)"
            :disabled="!runAllFailuresState.disabled"
            :distance="8"
          >
            <Button
              data-cy="run-failures"
              variant="white"
              class="gap-x-[10px] inline-flex whitespace-nowrap justify-center items-center isolate"
              :disabled="runAllFailuresState.disabled"
              :to="{ path: '/specs/runner', query: { file: posixify(specData.fullPath), mode: 'debug' } }"
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
                class="flex flex-col text-sm max-w-[350px] items-center"
                data-cy="run-all-failures-tooltip"
              >
                <span class="text-center">{{ runAllFailuresState.message }}</span>
                <Button
                  v-if="runAllFailuresState.cta"
                  variant="text"
                  class="rounded-md font-medium bg-gray-800 my-[12px]"
                  @click="runAllFailuresState.cta?.action"
                >
                  {{ runAllFailuresState.cta.message }}
                </Button>
              </div>
            </template>
          </Tooltip>
        </div>
      </div>
      <TestResult
        v-for="tr in specData.failedTests.ab123"
        :key="tr.id"
        :data-cy-status="tr.status"
        :status="tr.instance.status.toLowerCase()"
        :names="tr.titleParts"
        :flaky="tr.isFlaky"
      />
    </div>
  </div>
</template>
<script lang="ts" setup>

import { computed, unref } from 'vue'
import { IconActionRefresh, IconDocumentText, IconDocumentMinus } from '@cypress-design/vue-icon'
import TestResult from '@cypress-design/vue-testresult'
import TransitionQuickFade from '@cy/components/transitions/TransitionQuickFade.vue'
import type { SpecDataAggregate, CloudRunInstance } from '@packages/data-context/src/gen/graphcache-config.gen'
import StatsMetaData from './StatsMetadata.vue'
import ResultCounts from '@packages/frontend-shared/src/components/ResultCounts.vue'
import Button from '@packages/frontend-shared/src/components/Button.vue'
import Tooltip from '@packages/frontend-shared/src/components/Tooltip.vue'
import SpecNameDisplay from '../specs/SpecNameDisplay.vue'
import { useI18n } from '@cy/i18n'
import { useDurationFormat } from '../composables/useDurationFormat'
import { posixify } from '../paths'
import type { StatsMetadata_GroupsFragment, TestingTypeEnum } from '../generated/graphql'
import OpenFileInIDE from '@cy/gql-components/OpenFileInIDE.vue'

export interface Spec {
  id: string
  path: string
  fileName: string
  fileExtension: string
  testsPassed: SpecDataAggregate | null
  testsFailed: SpecDataAggregate | null
  testsPending: SpecDataAggregate | null
  specDuration: SpecDataAggregate | null
  fullPath: string
}

export interface TestResults {
  readonly id: string
  readonly titleParts: ReadonlyArray<string>
  readonly instance: CloudRunInstance | null
}

const { t } = useI18n()

const props = defineProps<{
  spec: Spec
  testResults: {[thumbprint: string]: TestResults[]}
  groups: {[groupId: string]: StatsMetadata_GroupsFragment }
  testingType: TestingTypeEnum
  foundLocally: boolean
  matchesCurrentTestingType: boolean
}>()

const emits = defineEmits<{
  (event: 'switchTestingType', value: TestingTypeEnum): void
}>()

// helper function for formatting the number of passed, failed, and pending tests

const durationFormatter = (val: number | null | undefined) => {
  return unref(useDurationFormat(val ?? 0))
}

// helper function for formatting the number of passed, failed, and pending tests
const debugResultsCalc = (value: SpecDataAggregate | null, formatter?: (val: number | null | undefined) => string) => {
  if (!value) {
    return ''
  }

  const formattedMin = formatter ? formatter(value.min) : value.min
  const formattedMax = formatter ? formatter(value.max) : value.max

  if (formattedMin === formattedMax) {
    return formattedMin
  }

  return `${formattedMin}-${formattedMax}`
}

const specData = computed(() => {
  return {
    path: props.spec.path,
    fileName: props.spec.fileName,
    fileExtension: props.spec.fileExtension,
    failedTests: props.testResults,
    testsPassed: debugResultsCalc(props.spec.testsPassed),
    testsFailed: debugResultsCalc(props.spec.testsFailed),
    testsPending: debugResultsCalc(props.spec.testsPending),
    specDuration: debugResultsCalc(props.spec.specDuration, durationFormatter),
    groups: props.groups,
    testingType: props.testingType,
    fullPath: props.spec.fullPath,
  }
})

const runAllFailuresState = computed(() => {
  if (!props.matchesCurrentTestingType) {
    return {
      disabled: true,
      message: t('debugPage.runFailures.switchTestingTypeInfo', { n: Object.keys(props.testResults).length, testingType: props.testingType }),
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
