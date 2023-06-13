<template>
  <div
    data-cy="test-row"
    class="flex flex-row font-normal h-12 text-base text-gray-700 items-center non-italic"
  >
    <SolidStatusIcon
      size="16"
      status="failed"
      data-cy="failed-icon"
      class="min-w-[16px] isolate"
    />
    <template
      v-for="{text, type}, index in failedTestData.mappedTitleParts"
      :key="`${text}-${index}`"
      :data-cy="`titleParts-${index}`"
    >
      <IconChevronRightSmall
        v-if="index !== 0 && type !== 'LAST-PART-END'"
        :data-cy="`titleParts-${index}-chevron`"
        size="8"
        stroke-color="gray-200"
        fill-color="gray-200"
        class="shrink-0"
        :class="type === 'MIDDLE' ? 'hidden lg:block' : type === 'ELLIPSIS' ? 'lg:hidden' : ''"
      />
      <span
        :data-cy="`titleParts-${index}-title`"
        :class="type === 'ELLIPSIS' ? 'px-2.5 shrink-0 lg:hidden' :
          type === 'MIDDLE' ? 'truncate px-2.5 hidden lg:block' :
          type === 'LAST-PART-END' ? 'shrink-0 whitespace-pre' :
          type === 'LAST-PART-START' ? 'pl-2.5 truncate whitespace-pre' : 'px-2.5 truncate'"
      >
        <template v-if="type === 'ELLIPSIS'">
          <Tooltip>
            <!-- button gives us free keyboard focus activation of the tooltip -->
            <button>{{ text }}</button>
            <span class="sr-only">{{ middlePartText }}</span>
            <template #popper>
              <span data-cy="tooltip-content">{{ middlePartText }}</span>
            </template>
          </Tooltip>
        </template>
        <template v-else>
          {{ text }}
        </template>
      </span>
    </template>
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
      class="divide-y rounded border-gray-100 border"
    >
      <GroupedDebugFailedTestVue
        :failed-tests="props.failedTestsResult"
        :groups="props.groups"
      />
    </div>
  </TransitionQuickFade>
</template>
<script lang="ts" setup>
import { IconChevronRightSmall } from '@cypress-design/vue-icon'
import TransitionQuickFade from '@cy/components/transitions/TransitionQuickFade.vue'
import { SolidStatusIcon } from '@cypress-design/vue-statusicon'
import DebugArtifactLink from './DebugArtifactLink.vue'
import GroupedDebugFailedTestVue from './GroupedDebugFailedTest.vue'
import { computed } from 'vue'
import type { StatsMetadata_GroupsFragment } from '../generated/graphql'
import Tooltip from '@packages/frontend-shared/src/components/Tooltip.vue'
import { getDebugArtifacts } from './utils/debugArtifacts'
import type { TestResults } from './DebugSpec.vue'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

const props = defineProps<{
  failedTestsResult: TestResults[]
  groups: StatsMetadata_GroupsFragment[]
  expandable: boolean
}>()

type ItemType = 'SHOW_FULL' | 'MIDDLE' | 'ELLIPSIS' | 'LAST-PART-START' | 'LAST-PART-END'
  type MappedTitlePart = {
    text: string
    type: ItemType
  }

const failedTestData = computed(() => {
  const runInstance = props.failedTestsResult[0].instance
  const titleParts = props.failedTestsResult[0].titleParts

  let isFirstMiddleAdded: boolean = false

  const mappedTitleParts: MappedTitlePart[] = titleParts.map<MappedTitlePart | MappedTitlePart[]>((titlePart, index, parts) => {
    if (index === 0) {
      // always use the whole first part of the title
      return {
        text: titlePart,
        type: 'SHOW_FULL',
      }
    }

    if (index === parts.length - 1) {
      // split the last part into 2 pieces, so that we can truncate the first half if needed,
      // and still show the end of the text.
      return [
        {
          text: titlePart.slice(0, titlePart.length - 15),
          type: 'LAST-PART-START',
        },
        {
          text: titlePart.slice(titlePart.length - 15),
          type: 'LAST-PART-END',
        },
      ]
    }

    if (index === parts.length - 2 && parts.length >= 3) {
      // this is the second-last part of the title,
      // and will be the *third-to-last* item in the array.

      // We only label this SHOW_FULL if there are enough
      // actual parts in the title that it is required to separate this
      // from "middle" items that may be hidden in smaller screens

      return {
        text: titlePart,
        type: 'SHOW_FULL',
      }
    }

    if (!isFirstMiddleAdded && parts.length > 3) {
      isFirstMiddleAdded = true

      // a fake part with type ELLIPSIS is shown conditionally
      // at smaller screen sizes

      // we insert it here and will flatten the result later
      // to undo the nesting this creates
      return [
        {
          text: '...',
          type: 'ELLIPSIS',
        },
        {
          text: titlePart,
          type: 'MIDDLE',
        },
      ]
    }

    return { text: titlePart, type: 'MIDDLE' }
  })
  .flat() // flatten the array since one of the internal items may itself be an array.

  const debugArtifacts = getDebugArtifacts(runInstance, t)

  return {
    debugArtifacts,
    mappedTitleParts,
  }
})

const middlePartText = computed(() => {
  return failedTestData.value.mappedTitleParts
  .filter((item) => item.type === 'MIDDLE')
  .map((item) => item.text)
  .join(' > ')
})

</script>
<style scoped>
[data-cy=test-group]:hover .test-row-artifacts, [data-cy=test-group]:focus-within .test-row-artifacts {
  opacity: 1 !important;
}
</style>
