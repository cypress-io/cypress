<template>
  <div
    data-cy="debug-spec-col"
    class="grid flex flex-col px-24px gap-24px self-stretch pt-24px"
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
            class="flex truncate items-center gap-x-3 text-gray-700 whitespace-nowrap children:flex children:items-center font-normal text-sm"
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
              :groups="groupsT"
            />
            <StatsMetaData
              v-else-if="(Object.keys(specData.groups).length > 1)"
              :order="['DURATION', 'GROUPS', 'G_OS', 'G_BROWSERS', 'TESTING']"
              :spec-duration="specData.specDuration!"
              :testing="specData.testingType"
              :groups="groupsT"
            />
          </ul>
        </div>
        <div
          class="mr-16px"
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
      <div
        v-for="thumbprint in Object.keys(specData.failedTests)"
        :key="`test-${thumbprint}`"
        :data-cy="`test-group`"
        class="w-full flex flex-col flex-start justify-center pl-16px border-b-gray-100 border-b-1px pr-16px"
        :class="Object.keys(specData.groups).length > 1 ? 'pb-16px': 'hover:bg-gray-50'"
      >
        <DebugFailedTest
          :failed-test-result="specData.failedTests[thumbprint]"
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
import SpecNameDisplay from '../specs/SpecNameDisplay.vue'
import { useI18n } from '@cy/i18n'
import { useDurationFormat } from '../composables/useDurationFormat'
import type { TestingTypeEnum } from '../generated/graphql'

const { t } = useI18n()

const props = defineProps<{
  spec: Spec
  testResults: {[thumbprint: string]: TestResults[]}
  groups: {[groupId: string]: CloudRunGroup }
  testingType: TestingTypeEnum
  isDisabled?: boolean
}>()

// helper function for formatting the number of passed, failed, and pending tests
const debugResultsCalc = (min: number, max: number, specDuration: boolean = false) => {
  if (min === max) {
    return specDuration ? useDurationFormat(min ?? 0).value : min
  }

  return specDuration ? `${useDurationFormat(min ?? 0).value}-${useDurationFormat(max ?? 0).value}` : `${min}-${max}`
}

const specData = computed(() => {
  return {
    path: `${props.spec.path}/`,
    fileName: props.spec.fileName,
    fileExtension: props.spec.fileExtension,
    failedTests: props.testResults,
    testsPassed: debugResultsCalc(props.spec.testsPassed.min!, props.spec.testsPassed.max!),
    testsFailed: debugResultsCalc(props.spec.testsFailed.min!, props.spec.testsFailed.max!),
    testsPending: debugResultsCalc(props.spec.testsPending.min!, props.spec.testsPending.max!),
    specDuration: debugResultsCalc(props.spec.specDuration.min!, props.spec.specDuration.max!, true),
    groups: props.groups,
    testingType: props.testingType,
  }
})

const uniqueGrpIds: Set<string> = new Set()

/**
 * Helper function that maps each test's thumprint to all the groups in it
 * return type: {[thumbprint: string]: CloudRunGroup[]}
 */
const groupsPerTest = computed(() => {
  return Object.keys(props.testResults).reduce((acc, currThumbprint) => {
    acc[currThumbprint] = props.testResults[currThumbprint].map((test) => props.groups[test.instance?.groupId])

    return acc
  }, {})
})

/**
 * Helper function that extracts all the unique groups for a specific spec
 * return type: CloudRunGroup[]
 */
const groupsT = computed(() => {
  return Object.keys(props.testResults).reduce((acc: CloudRunGroup[], currThumbprint) => {
    props.testResults[currThumbprint].map((test) => {
      const groupId = test.instance?.groupId!

      if (!uniqueGrpIds.has(groupId)) {
        uniqueGrpIds.add(groupId)
        acc.push(props.groups[groupId])
      }
    })

    return acc
  }, [])
})

</script>
