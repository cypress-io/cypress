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
          class="w-full flex flex-row px-18px items-center grid gap-y-3"
        >
          <div class="gap-x-2 w-full flex flex-row items-center">
            <IconDocumentText
              stroke-color="gray-500"
              fill-color="gray-100"
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
            class="flex items-center gap-x-3 text-gray-700 whitespace-nowrap children:flex children:items-center font-normal text-sm"
          >
            <li
              :data-cy="'debugHeader-results'"
            >
              <ResultCounts
                :total-failed="specData.testsPassed"
                :total-passed="specData.testsPassed"
                :total-pending="specData.testsPending"
                :order="['FAILED', 'PASSED', 'PENDING']"
              />
            </li>
            <StatsMetaData
              v-if="(specData.groups.length === 1)"
              :order="['DURATION','OS','BROWSER','TESTING']"
              :spec-duration="specData.specDuration"
              :testing="specData.testingType"
              :groups="[specData.groups[0]]"
            />
            <StatsMetaData
              v-else-if="(specData.groups.length > 1)"
              :order="['DURATION', 'GROUPS', 'G_OS', 'G_BROWSERS', 'TESTING']"
              :spec-duration="specData.specDuration"
              :testing="specData.testingType"
              :groups="specData.groups"
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
  testsPassed: SpecDataAggregate | number
  testsFailed: SpecDataAggregate | number
  testsPending: SpecDataAggregate | number
  specDuration: SpecDataAggregate | string
  testingType: 'e2e' | 'component'
  groups: CloudRunGroup[]
}

export interface TestResults {
  id: string
  titleParts: string[]
  instance: RunInstance[]
}

import { computed } from 'vue'
import { IconActionRefresh, IconDocumentText } from '@cypress-design/vue-icon'
import type { SpecDataAggregate, RunInstance, CloudRunGroup } from '@packages/data-context/src/gen/graphcache-config.gen'
import DebugFailedTest from './DebugFailedTest.vue'
import StatsMetaData from './StatsMetadata.vue'
import ResultCounts from '@packages/frontend-shared/src/components/ResultCounts.vue'
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
    testsPassed: props.spec.testsPassed,
    testsFailed: props.spec.testsFailed,
    testsPending: props.spec.testsPending,
    specDuration: props.spec.specDuration,
    groups: props.spec.groups,
    testingType: props.spec.testingType,
  }
})
// You need to alter the metadata depending on whether there are multiple groups or not so that proper stuff is shown
// IconTechnologyOS does not exist
// Linux OS icon does not exist. Looks like OS icons do not exist
// browser icons do not exist
// Fix the v-if for the statsmetadata for groups and non-groups

</script>
<style scoped>
[data-cy=spec-header-metadata] li:not(:first-child)::before {
  content: '.';
  @apply -mt-8px text-lg text-gray-400 pr-8px
}
</style>
