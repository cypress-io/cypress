<template>
  <div>
    <div
      v-if="!props.expandable"
      data-cy="debug-artifacts"
      class="flex grow opacity-0 px-[18px] gap-[16px] justify-end test-row-artifacts"
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
  <TransitionQuickFade>
    <div
      v-if="props.expandable"
      data-cy="debug-failed-test-groups"
      class="border border-gray-100 divide-y rounded"
    >
      <GroupedDebugFailedTestVue
        :failed-tests="props.failedTestsResult"
        :groups="props.groups"
      />
    </div>
  </TransitionQuickFade>
</template>
<script lang="ts" setup>
import TransitionQuickFade from '@cy/components/transitions/TransitionQuickFade.vue'
import DebugArtifactLink from './DebugArtifactLink.vue'
import GroupedDebugFailedTestVue from './GroupedDebugFailedTest.vue'
import type { StatsMetadata_GroupsFragment } from '../generated/graphql'
import type { TestResults } from './DebugSpec.vue'

const props = defineProps<{
  failedTestsResult: TestResults[]
  groups: StatsMetadata_GroupsFragment[]
  expandable: boolean
}>()

</script>
<style scoped>
[data-cy=test-group]:hover .test-row-artifacts, [data-cy=test-group]:focus-within .test-row-artifacts {
  opacity: 1 !important;
}
</style>
