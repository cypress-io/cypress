<template>
  <div
    :data-cy="`runCard-${run.id}`"
  >
    <div
      class="flex justify-between gap-[8px] text-sm text-gray-700 items-center whitespace-nowrap children:flex children:py-[16px]"
      :data-cy="`runCard-status-${run.status}`"
    >
      <div
        class="children:flex items-center gap-[8px] pl-[16px]"
      >
        <div>
          <ExternalLink
            :data-cy="`runNumberLink-${run.id}`"
            class="overflow-hidden border border-transparent hocus-default"
            :href="runUrl"
            :use-default-hocus="false"
          >
            <RunNumber
              v-if="props.gql.status && props.gql.runNumber"
              :status="props.gql.status"
              :value="props.gql.runNumber"
            />
          </ExternalLink>
        </div>
        <div
          class="gap-[8px]"
        >
          <RunResults
            :gql="props.gql"
            :use-breakpoint-display="true"
          />
          <RunTag
            v-if="run.commitInfo?.branch"
            :label="run.commitInfo?.branch"
            :title="run.commitInfo?.branch"
            :icon="IconTechnologyBranchH"
            :icon-label="t('runs.card.branchName')"
            class="hidden xl:inline-flex"
          />
          <RunTag
            v-for="tag in tagData?.tags"
            :key="tag"
            :label="tag"
            :title="tag"
            class="hidden 2xl:inline-flex"
          />
          <RunTagCount
            v-for="tagCount in tagData?.tagCounts"
            :key="tagCount.value"
            :value="tagCount.value"
            :class="tagCount.class"
            :tooltip-data="{
              flaky: tagCount.flaky,
              branchName: tagCount.branchName,
              tags: tagCount.tags,
            }"
          />
        </div>
      </div>
      <div
        class="flex children:flex items-center pr-[16px]"
      >
        <ul
          class="w-[80px] lg:w-auto lg:max-w-[160px] 2xl:max-w-none mr-[16px]  justify-end text-sm text-gray-700 items-center whitespace-nowrap children:flex children:items-center"
        >
          <li
            v-if="run.commitInfo?.authorName"
            data-cy="runCard-author"
            class="shrink-0 2xl:shrink-1 xl:max-w-[160px] pr-[8px] 2xl:pr-[16px] overflow-hidden"
            :title="run.commitInfo.authorName"
          >
            <span
              data-cy="runCard-avatar"
            >
              <UserAvatar
                aria-hidden="true"
                class="h-[16px] w-[16px] 2xl:mr-1 icon-dark-gray-500 icon-light-gray-100 icon-secondary-light-gray-200"
                :email="run.commitInfo?.authorEmail"
              />
            </span>
            <span class="sr-only">{{ t('runs.card.commitAuthor') }}</span>
            <div
              class="hidden 2xl:block truncate"
              role="none"
            >
              {{ run.commitInfo.authorName }}
            </div>
          </li>
          <li
            v-if="run.createdAt"
            data-cy="runCard-createdAt"
            class="2xl:w-[160px] overflow-hidden"
            :title="`${totalDuration} ${relativeCreatedAt}`"
          >
            <IconTimeClock
              size="16"
              class="hidden 2xl:inline-block mr-2"
              stroke-color="gray-500"
              fill-color="gray-50"
              aria-hidden="true"
            />
            <span class="sr-only">{{ t('runs.card.totalDuration') }}</span>
            <div
              class="truncate"
              role="none"
            >
              {{ totalDuration }} ({{ relativeCreatedAt }})
            </div>
          </li>
        </ul>
        <Tooltip
          v-if="props.showDebug && run.runNumber"
          tab-index="0"
          :disabled="props.debugEnabled"
          placement="bottom"
        >
          <Button
            data-cy="open-debug"
            variant="outline-light"
            :disabled="!props.debugEnabled"
            size="24"
            :aria-label="t(props.debugEnabled ? 'runs.card.debugDescription' : 'runs.card.noDebugAvailable', { runNumber: run.runNumber })"
            @click="onDebugClick"
          >
            <IconTechnologyDebugger
              aria-hidden="true"
              class="h-[16px] w-[16px] mr-2"
            />
            {{ t('runs.card.debugLabel') }}
          </Button>
          <template #popper>
            <div
              class="w-[240px] break-words whitespace-normal"
            >
              {{ t('runs.card.noDebugAvailable') }}
            </div>
          </template>
        </Tooltip>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from '@cy/i18n'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import { gql, useSubscription, useMutation } from '@urql/vue'
import RunTag from './RunTag.vue'
import RunTagCount from './RunTagCount.vue'
import RunResults from './RunResults.vue'
import RunNumber from './RunNumber.vue'
import Button from '@cypress-design/vue-button'
import Tooltip from '@packages/frontend-shared/src/components/Tooltip.vue'
import UserAvatar from '@cy/gql-components/topnav/UserAvatar.vue'
import { RunCardFragment, RunCard_ChangeDocument, RunCard_ShowDebugForCloudRunDocument } from '../generated/graphql'
import { useRunDateTimeInterval } from '../debug/useRunDateTimeInterval'
import { IconTechnologyDebugger, IconTimeClock, IconTechnologyBranchH } from '@cypress-design/vue-icon'
import { getUrlWithParams } from '@packages/frontend-shared/src/utils/getUrlWithParams'

const { t } = useI18n()

gql`
fragment RunCard on CloudRun {
	id
	createdAt
	status
  totalDuration
  url
  runNumber
  tags {
    id
    name
  }
	...RunResults
	commitInfo {
		authorName
		authorEmail
		summary
		branch
		sha
	}
}
`

gql`
subscription RunCard_Change($id: ID!) {
  relevantRunSpecChange(runId: $id) {
    id
    ...RunCard
  }
}
`

gql`
mutation RunCard_showDebugForCloudRun($runNumber: Int!) {
  showDebugForCloudRun(runNumber: $runNumber)
}
`

const props = defineProps<{
  gql: RunCardFragment
  showDebug?: boolean
  debugEnabled?: boolean
}>()

const run = computed(() => props.gql)

const subscriptionVariables = computed(() => {
  return {
    id: run.value.id,
  }
})

const shouldPauseSubscription = computed(() => {
  return run.value.status !== 'RUNNING'
})

useSubscription({ query: RunCard_ChangeDocument, variables: subscriptionVariables, pause: shouldPauseSubscription })

const runUrl = computed(() => {
  return getUrlWithParams({
    url: run.value.url || '#',
    params: {
      utm_medium: 'Runs Tab',
      utm_campaign: 'Cloud Run',
    },
  })
})

const { relativeCreatedAt, totalDuration } = useRunDateTimeInterval(run)

const showDebugForCloudRun = useMutation(RunCard_ShowDebugForCloudRunDocument)

async function showDebugForRun () {
  if (run.value.runNumber) {
    await showDebugForCloudRun.executeMutation({ runNumber: run.value.runNumber })
  }
}

const tagData = computed(() => {
  const tempTags = (props.gql.tags ?? []).map((tag) => tag?.name).filter(Boolean) as string[]

  const baseCount = 1
  const branchCount = run.value.commitInfo?.branch ? 1 : 0
  const flakyCount = (run.value.totalFlakyTests || 0) > 0 ? 1 : 0
  const tagCount = tempTags.length > 0 ? 1 : 0
  const initialCount = tempTags.length > 0 ? tempTags.length - baseCount : 0
  const secondCount = initialCount + tagCount
  const thirdCount = initialCount + tagCount + branchCount + flakyCount

  const tagCounts: {
    value: number
    flaky?: number
    branchName?: string
    tags?: string[]
    class: string
  }[] = []

  // initial display
  if (initialCount > 0) {
    tagCounts.push({
      value: initialCount,
      tags: tempTags.slice(baseCount, tempTags.length),
      class: 'hidden 2xl:inline-flex',
    })
  }

  // first collapse
  if (secondCount > 0) {
    tagCounts.push({
      value: initialCount + tagCount,
      tags: tempTags,
      class: 'hidden xl:inline-flex 2xl:hidden',
    })
  }

  // second collapse
  if (thirdCount > 0) {
    tagCounts.push({
      value: thirdCount,
      branchName: run.value.commitInfo?.branch ?? undefined,
      flaky: run.value.totalFlakyTests ?? undefined,
      tags: tempTags,
      class: 'inline-flex xl:hidden',
    })
  }

  return { tags: tempTags.slice(0, baseCount), tagCounts }
})

const onDebugClick = (event) => {
  event.preventDefault()
  event.stopPropagation()

  showDebugForRun()
}

</script>
