<template>
  <div
    data-cy="test-row"
    class="flex flex-row h-12 items-center gap-x-2.5 non-italic text-base text-gray-700 font-normal"
  >
    <SolidStatusIcon
      size="16"
      status="failed"
      data-cy="failed-icon"
      class="isolate"
    />
    <div
      v-for="titlePart, index in failedTestData.result.titleParts"
      :key="`${titlePart}-${index}`"
      class="flex items-center gap-x-2.5 flex-row"
      :data-cy="`titleParts-${index}`"
    >
      <IconChevronRightSmall
        v-if="index !== 0"
        data-cy="right-chevron"
        size="8"
        stroke-color="gray-200"
        fill-color="gray-200"
      />
      <span>
        {{ titlePart }}
      </span>
    </div>
    <div
      v-if="!props.expandable"
      data-cy="debug-artifacts"
      class="flex flex-grow justify-end space-x-4.5 opacity-0 test-row-artifacts pr-18px"
    >
      <div
        v-for="result, i in failedTestData.debugArtifacts"
        :key="i"
        :data-cy="`artifact--${result.icon}`"
      >
        <DebugArtifactLink
          :icon="result.icon"
          :popper-text="result.text"
          :url="result.url"
        />
      </div>
    </div>
  </div>
  <div
    v-if="props.expandable"
    class="border-gray-100 border-1 rounded divide-y"
  >
    <GroupedDebugFailedTestVue
      :failed-tests="props.failedTestsResult"
      :groups="props.groups"
    />
  </div>
</template>
<script lang="ts" setup>
import { IconChevronRightSmall } from '@cypress-design/vue-icon'
import { SolidStatusIcon } from '@cypress-design/vue-statusicon'
import DebugArtifactLink from './DebugArtifactLink.vue'
import GroupedDebugFailedTestVue from './GroupedDebugFailedTest.vue'
import { computed } from 'vue'
import type { TestResults } from './DebugSpec.vue'
import type { CloudRunGroup } from '@packages/data-context/src/gen/graphcache-config.gen'

const props = defineProps<{
  failedTestsResult: TestResults[]
  groups: CloudRunGroup[]
  expandable: boolean
}>()

const failedTestData = computed(() => {
  const runInstance = props.failedTestsResult[0].instance

  return {
    debugArtifacts: [
      { icon: 'TERMINAL_LOG', text: 'View Log', url: runInstance?.stdoutUrl! },
      { icon: 'IMAGE_SCREENSHOT', text: 'View Screenshot', url: runInstance?.screenshotsUrl! },
      { icon: 'PLAY', text: 'View Video', url: runInstance?.videoUrl! },
    ],
    result: props.failedTestsResult[0],
  }
})

</script>
<style scoped>
[data-cy=test-group]:hover .test-row-artifacts, [data-cy=test-group]:focus-within .test-row-artifacts {
  opacity: 1 !important;
}
</style>
