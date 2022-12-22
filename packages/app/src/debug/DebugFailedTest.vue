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
      v-for="titlePart, index in props.failedTestResult[0].titleParts"
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
        v-for="(result, i) in debugArtifacts"
        :key="i"
        :data-cy="`artifact--${result.icon}`"
      >
        <DebugArtifacts
          :icon="result.icon"
          :popper-text="result.text"
          :url="result.url"
        />
      </div>
    </div>
  </div>
  <GroupedDebugFailedTestVue
    v-if="props.expandable"
    :failed-tests="props.failedTestResult"
    :groups="props.groups"
  />
</template>
<script lang="ts" setup>
import { IconChevronRightSmall } from '@cypress-design/vue-icon'
import { SolidStatusIcon } from '@cypress-design/vue-statusicon'
import DebugArtifacts from './DebugArtifacts.vue'
import GroupedDebugFailedTestVue from './GroupedDebugFailedTest.vue'
import { computed } from 'vue'
import type { TestResults } from './DebugSpec.vue'
import type { CloudRunGroup } from '@packages/data-context/src/gen/graphcache-config.gen'

const props = defineProps<{
  failedTestResult: TestResults[]
  groups: CloudRunGroup[]
  expandable: boolean
}>()

const debugArtifacts = computed(() => {
  const runInstance = props.failedTestResult[0].instance

  return (
    [
      { icon: 'TERMINAL_LOG', text: 'View Log', url: runInstance?.stdoutUrl! },
      { icon: 'IMAGE_SCREENSHOT', text: 'View Screenshot', url: runInstance?.screenshotsUrl! },
      { icon: 'PLAY', text: 'View Video', url: runInstance?.videoUrl! },
    ]
  )
})

</script>
<style scoped>
[data-cy=test-group]:hover .test-row-artifacts, [data-cy=test-group]:focus-within .test-row-artifacts {
  opacity: 1 !important;
}
</style>
