<template>
  <TransitionGroupQuickFade>
    <div
      v-for="(group, j) in props.groups"
      :key="j"
      class="flex flex-col flex-start w-full pl-[16px] justify-center grouped-row-class hover:bg-gray-50"
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
          class="flex grow space-x-4.5 opacity-0 px-[18px] justify-end grouped-row-artifacts"
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
  </TransitionGroupQuickFade>
</template>
<script lang="ts" setup>
import TransitionGroupQuickFade from '@cy/components/transitions/TransitionGroupQuickFade.vue'
import StatsMetadata from './StatsMetadata.vue'
import DebugArtifactLink from './DebugArtifactLink.vue'
import { computed } from 'vue'
import type { StatsMetadata_GroupsFragment } from '../generated/graphql'
import { DebugArtifact, getDebugArtifacts } from './utils/debugArtifacts'
import type { TestResults } from './DebugSpec.vue'
import { useI18n } from '@cy/i18n'

const props = defineProps<{
  failedTests: TestResults[]
  groups: StatsMetadata_GroupsFragment[]
}>()

const { t } = useI18n()

const debugArtifacts = computed(() => {
  return props.failedTests.reduce<{[groupID: string]: DebugArtifact[] }>((acc, curr) => {
    acc[curr.instance?.groupId ?? ''] = getDebugArtifacts(curr.instance, t)

    return acc
  }, {})
})

</script>
<style scoped>
.grouped-row-class:hover .grouped-row-artifacts, .grouped-row-class:focus-within .grouped-row-artifacts {
  opacity: 1 !important;
}

</style>
