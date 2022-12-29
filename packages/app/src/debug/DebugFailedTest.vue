<template>
  <div
    data-cy="test-row"
    class="flex flex-row h-12 items-center non-italic text-base text-gray-700 font-normal"
  >
    <SolidStatusIcon
      size="16"
      status="failed"
      data-cy="failed-icon"
      class="isolate"
    />
    <template
      v-for="titlePart, index in failedTestData.mappedTitleParts"
      :key="`${titlePart}-${index}`"
      :data-cy="`titleParts-${index}`"
    >
      <IconChevronRightSmall
        v-if="index !== 0 && titlePart.type !== 'LAST-1'"
        :data-cy="`titleParts-${index}-chevron`"
        size="8"
        stroke-color="gray-200"
        fill-color="gray-200"
        class="shrink-0"
        :class="titlePart.type === 'MIDDLE' ? 'hidden lg:block' : titlePart.type === 'ELLIPSIS' ? 'lg:hidden' : ''"
      />
      <span
        :data-cy="`titleParts-${index}-title`"
        :class="titlePart.type === 'ELLIPSIS' ? 'px-2.5 shrink-0 lg:hidden' :
          titlePart.type === 'MIDDLE' ? 'truncate px-2.5 hidden lg:block' :
          titlePart.type === 'LAST-1' ? 'shrink-0 whitespace-pre' :
          titlePart.type === 'LAST-0' ? 'pl-2.5 truncate' : 'px-2.5 truncate'"
      >
        {{ titlePart.title }}
      </span>
    </template>
    <div
      v-if="!props.expandable"
      data-cy="debug-artifacts"
      class="flex flex-grow space-x-4.5 opacity-0 pr-18px justify-end test-row-artifacts"
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
    class="divide-y rounded border-gray-100 border-1"
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
import type { StatsMetadata_GroupsFragment } from '../generated/graphql'

const props = defineProps<{
  failedTestsResult: TestResults[]
  groups: StatsMetadata_GroupsFragment[]
  expandable: boolean
}>()

const failedTestData = computed(() => {
  const runInstance = props.failedTestsResult[0].instance
  const titleParts = props.failedTestsResult[0].titleParts

  type Parts = 'FIRST' | 'MIDDLE' | 'PENULTIMATE' | 'ELLIPSIS' | 'LAST-0' | 'LAST-1'
  type MappedTitlePart = {
    title: string
    type: Parts
  }
  let isFirstMiddleAdded: boolean = false
  const mappedTitleParts: MappedTitlePart[] = titleParts.map<MappedTitlePart | MappedTitlePart[]>((ele, index, parts) => {
    if (index === 0) {
      return {
        title: ele,
        type: 'FIRST',
      }
    }

    if (index === parts.length - 1) {
      return [
        {
          title: ele.slice(0, ele.length - 15),
          type: 'LAST-0',
        },
        {
          title: ele.slice(ele.length - 15),
          type: 'LAST-1',
        },
      ]
    }

    if (index === parts.length - 2 && parts.length >= 3) {
      return {
        title: ele,
        type: 'PENULTIMATE',
      }
    }

    if (!isFirstMiddleAdded && parts.length > 3) {
      isFirstMiddleAdded = true

      return [
        {
          title: '...',
          type: 'ELLIPSIS',
        },
        {
          title: ele,
          type: 'MIDDLE',
        },
      ]
    }

    return { title: ele, type: 'MIDDLE' }
  }).flat()

  return {
    debugArtifacts: [
      { icon: 'TERMINAL_LOG', text: 'View Log', url: runInstance?.stdoutUrl! },
      { icon: 'IMAGE_SCREENSHOT', text: 'View Screenshot', url: runInstance?.screenshotsUrl! },
      { icon: 'PLAY', text: 'View Video', url: runInstance?.videoUrl! },
    ],
    mappedTitleParts,
  }
})

</script>
<style scoped>
[data-cy=test-group]:hover .test-row-artifacts, [data-cy=test-group]:focus-within .test-row-artifacts {
  opacity: 1 !important;
}
</style>
