<template>
  <div
    data-cy="test-row"
    class="flex h-12 items-center gap-x-2.5 non-italic text-base text-gray-700 font-normal"
  >
    <SolidStatusIcon
      size="16"
      status="failed"
    />
    <div
      v-for="(titlePart, index) in props.failedTestResult.titleParts"
      :key="`${titlePart}-${index}`"
      class="flex items-center gap-x-2.5 truncate"
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
</template>
<script lang="ts" setup>
import { IconChevronRightSmall } from '@cypress-design/vue-icon'
import { SolidStatusIcon } from '@cypress-design/vue-statusicon'
import type { TestResults } from './DebugSpec.vue'
import DebugArtifacts from './DebugArtifacts.vue'
import { computed } from 'vue'

const props = defineProps<{
  failedTestResult: TestResults
}>()

const debugArtifacts = computed(() => {
  const runInstance = props.failedTestResult.instance[0]
  let ssUrl = ''
  let videoUrl = ''
  let stdoutUrl = ''

  if (runInstance.hasScreenshots) {
    ssUrl += runInstance.screenshotsUrl
  } else if (runInstance.hasStdout) {
    stdoutUrl += runInstance.stdoutUrl
  } else if (runInstance.hasVideo) {
    videoUrl += runInstance.videoUrl
  }

  return (
    [
      { icon: 'TERMINAL_LOG', text: 'View Log', url: stdoutUrl },
      { icon: 'IMAGE_SCREENSHOT', text: 'View Screenshot', url: ssUrl },
      { icon: 'PLAY', text: 'View Video', url: videoUrl },
    ]
  )
})

// need to fix the hover so that it is on the complete right

</script>
<style scoped>
[data-cy=test-group]:hover .test-row-artifacts, [data-cy=test-group]:focus-within .test-row-artifacts {
  opacity: 1 !important;
}
</style>
