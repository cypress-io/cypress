<template>
  <div
    v-for="(group, j) in props.groups"
    :key="j"
    class="flex flex-col flex-start w-full pl-16px justify-center grouped-row-class hover:bg-gray-50"
    data-cy="grouped-row"
  >
    <div
      class="flex flex-start flex-row font-normal border-b-gray-100 h-12 text-base text-gray-700 gap-x-2.5 items-center non-italic"
      data-cy="test-failed-metadata"
    >
      <StatsMetadata
        :order="['GROUP_NAME', 'OS', 'BROWSER']"
        :groups="[group]"
        :group-name="group.groupName!"
      />
      <div
        data-cy="debug-artifacts"
        class="flex flex-grow space-x-4.5 opacity-0 pr-18px justify-end grouped-row-artifacts"
      >
        <div
          v-for="artifact, l in debugArtifacts[group.id]"
          :key="l"
          :data-cy="`artifact-${artifact.icon}`"
        >
          <DebugArtifactLink
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
import type { TestResults } from './DebugSpec.vue'
import StatsMetadata from './StatsMetadata.vue'
import DebugArtifactLink from './DebugArtifactLink.vue'
import { computed } from 'vue'
import type { StatsMetadata_GroupsFragment } from '../generated/graphql'

const props = defineProps<{
  failedTests: TestResults[]
  groups: StatsMetadata_GroupsFragment[]
}>()

const debugArtifacts = computed(() => {
  return props.failedTests.reduce<{[groupID: string]: {icon: string, text: string, url: string | null | undefined }[] }>((acc, curr) => {
    //TODO Update logic to not rely on defaulting to empty strings
    acc[curr.instance?.groupId ?? ''] = [
      { icon: 'TERMINAL_LOG', text: 'View Log', url: curr.instance!.stdoutUrl ?? '' },
      { icon: 'IMAGE_SCREENSHOT', text: 'View Screenshot', url: curr.instance!.screenshotsUrl ?? '' },
      { icon: 'PLAY', text: 'View Video', url: curr.instance!.videoUrl ?? '' },
    ]

    return acc
  }, {})
})

</script>
<style scoped>
.grouped-row-class:hover .grouped-row-artifacts, .grouped-row-class:focus-within .grouped-row-artifacts {
  opacity: 1 !important;
}

</style>
