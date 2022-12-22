<template>
  <div
    v-for="(group, j) in props.groups"
    :key="j"
    class="w-full flex flex-col flex-start justify-center pl-16px border-gray-100 border-1 rounded hover:bg-gray-50"
    :data-cy="`grouped-row`"
  >
    <div
      class="flex flex-start flex-row h-12 items-center gap-x-2.5 non-italic text-base text-gray-700 font-normal border-b-gray-100"
      data-cy="test-failed-metadata"
    >
      <StatsMetadata
        :order="['GROUP_NAME', 'OS', 'BROWSER']"
        :groups="[group]"
        :group-name="group.groupName!"
      />
      <div
        data-cy="debug-artifacts"
        class="flex flex-grow justify-end space-x-4.5 opacity-0 grouped-row-artifacts pr-18px"
      >
        <div
          v-for="artifact, l in debugArtifacts[group.id]"
          :key="l"
          :data-cy="`artifact-${artifact.icon}`"
        >
          <DebugArtifacts
            :icon="artifact.icon"
            :popper-text="artifact.text"
            :url="artifact.url"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import type { CloudRunGroup } from '@packages/data-context/src/gen/graphcache-config.gen'
import type { TestResults } from './DebugSpec.vue'
import StatsMetadata from './StatsMetadata.vue'
import DebugArtifacts from './DebugArtifacts.vue'
import { computed } from 'vue'

const props = defineProps<{
  failedTests: TestResults[]
  groups: CloudRunGroup[]
}>()

// type: {[groupID: string] : [{icon: string, text: string, url: string | null | undefined}]}
const debugArtifacts = computed(() => {
  return props.failedTests.reduce((acc, curr) => {
    acc[curr.instance.groupId] = [
      { icon: 'TERMINAL_LOG', text: 'View Log', url: curr.instance!.stdoutUrl ?? '' },
      { icon: 'IMAGE_SCREENSHOT', text: 'View Screenshot', url: curr.instance!.screenshotsUrl ?? '' },
      { icon: 'PLAY', text: 'View Video', url: curr.instance!.videoUrl ?? '' },
    ]

    return acc
  }, {})
})

</script>
<style scoped>
[data-cy=grouped-row]:hover .grouped-row-artifacts, [data-cy=grouped-row]:focus-within .grouped-row-artifacts {
  opacity: 1 !important;
}

</style>
