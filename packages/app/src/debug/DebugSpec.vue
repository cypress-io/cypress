<template>
  <div
    data-cy="debug-spec-col"
    class="grid flex flex-col gap-24px self-stretch pt-24px"
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
          class="w-full flex px-18px items-center grid gap-y-3"
        >
          <div class="flex-grow truncate gap-x-2 w-full flex items-center">
            <IconDocumentText
              stroke-color="gray-500"
              fill-color="gray-100"
              size="16"
            />
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
          </div>
          <ul
            data-cy="spec-header-metadata"
            class="flex flex-wrap items-center gap-x-3 text-gray-700 whitespace-nowrap children:flex children:items-center font-normal text-sm"
          >
            <li
              :data-cy="'debugHeader-results'"
            >
              <ResultCounts
                :total-failed="specData.testsFailed"
                :total-passed="specData.testsPassed"
                :total-pending="specData.testsPending"
                :order="['FAILED', 'PASSED', 'PENDING']"
              />
            </li>
            <div class="-mt-6px text-lg text-gray-400">
              .
            </div>
            <StatsMetaData
              v-if="(Object.keys(specData.groups).length === 1)"
              :order="['DURATION','OS','BROWSER','TESTING']"
              :spec-duration="specData.specDuration!"
              :testing="specData.testingType"
              :groups="Object.values(specData.groups)"
            />
            <StatsMetaData
              v-else-if="(Object.keys(specData.groups).length > 1)"
              :order="['DURATION', 'GROUPS', 'G_OS', 'G_BROWSERS', 'TESTING']"
              :spec-duration="specData.specDuration!"
              :testing="specData.testingType"
              :groups="Object.values(specData.groups)"
            />
          </ul>
        </div>
        <div
          class="mr-16px"
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
      <div
        v-for="thumbprint in Object.keys(specData.failedTests)"
        :key="`test-${thumbprint}`"
        :data-cy="`test-group`"
        class="w-full flex flex-col flex-start justify-center pl-16px border-b-gray-100 border-b-1px pr-16px"
        :class="Object.keys(specData.groups).length > 1 ? 'pb-16px': 'hover:bg-gray-50'"
      >
        <DebugFailedTest
          v-if="specData.failedTests[thumbprint].length >= 1"
          :failed-tests-result="specData.failedTests[thumbprint]"
          :groups="groupsPerTest[thumbprint]"
          :expandable="Object.keys(specData.groups).length > 1"
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
  testsPassed: SpecDataAggregate
  testsFailed: SpecDataAggregate
  testsPending: SpecDataAggregate
  specDuration: SpecDataAggregate
  fullPath: string
}

export interface TestResults {
  readonly id: string
  readonly titleParts: string[]
  instance: CloudRunInstance
}

import { computed } from 'vue'
import { IconActionRefresh, IconDocumentText } from '@cypress-design/vue-icon'
import type { SpecDataAggregate, CloudRunInstance, CloudRunGroup } from '@packages/data-context/src/gen/graphcache-config.gen'
import DebugFailedTest from './DebugFailedTest.vue'
import StatsMetaData from './StatsMetadata.vue'
import ResultCounts from '@packages/frontend-shared/src/components/ResultCounts.vue'
import Button from '@packages/frontend-shared/src/components/Button.vue'
import Tooltip from '@packages/frontend-shared/src/components/Tooltip.vue'
import SpecNameDisplay from '../specs/SpecNameDisplay.vue'
import { useI18n } from '@cy/i18n'
import { useDurationFormat } from '../composables/useDurationFormat'
import { posixify } from '../paths'
import type { TestingTypeEnum } from '../generated/graphql'

const { t } = useI18n()

const props = defineProps<{
  spec: Spec
  testResults: {[thumbprint: string]: TestResults[]}
  groups: {[groupId: string]: CloudRunGroup }
  testingType: TestingTypeEnum
  isDisabled?: boolean
  foundLocally: boolean
  matchesCurrentTestingType: boolean
}>()

const emits = defineEmits<{
  (event: 'switchTestingType', value: TestingTypeEnum): void
}>()

// helper function for formatting the number of passed, failed, and pending tests
const debugResultsCalc = (min: number, max: number, specDuration: boolean = false) => {
  if (min === max) {
    return specDuration ? useDurationFormat(min ?? 0).value : min
  }

  return specDuration ? `${useDurationFormat(min ?? 0).value}-${useDurationFormat(max ?? 0).value}` : `${min}-${max}`
}

const specData = computed(() => {
  const testsPassed = props.spec.testsPassed ?? 0
  const testsFailed = props.spec.testsFailed ?? 0
  const testsPending = props.spec.testsPending ?? 0
  const specDuration = props.spec.specDuration ?? 0

  return {
    path: props.spec.path,
    fileName: props.spec.fileName,
    fileExtension: props.spec.fileExtension,
    failedTests: props.testResults,
    testsPassed: debugResultsCalc(testsPassed.min ?? 0, testsPassed.max ?? 0),
    testsFailed: debugResultsCalc(testsFailed.min ?? 0, testsFailed.max ?? 0),
    testsPending: debugResultsCalc(testsPending.min ?? 0, testsPending.max ?? 0),
    specDuration: debugResultsCalc(specDuration.min ?? 0, specDuration.max ?? 0, true),
    groups: props.groups,
    testingType: props.testingType,
    fullPath: props.spec.fullPath,
  }
})

/**
 * Helper function that maps each test's thumprint to all the groups in it
 */
const groupsPerTest = computed(() => {
  return Object.keys(props.testResults).reduce<Record<string, CloudRunGroup[]>>((acc, currThumbprint) => {
    acc[currThumbprint] = props.testResults[currThumbprint].map((test) => props.groups[test.instance?.groupId])

    return acc
  }, {})
})

/**
 * Helper function that extracts all the unique groups for a specific spec
 */
// const groupsT = computed(() => {
//   const uniqueGrpIds = new Set<string>()

//   return Object.keys(props.testResults).reduce<CloudRunGroup[]>((acc: CloudRunGroup[], currThumbprint) => {
//     props.testResults[currThumbprint].map((test) => {
//       const groupId = test.instance?.groupId

//       if (groupId && !uniqueGrpIds.has(groupId)) {
//         uniqueGrpIds.add(groupId)
//         acc.push(props.groups[groupId])
//       }
//     })

//     return acc
//   }, [])
// })

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
