<template>
  <ExternalLink
    :data-cy="`runCard-${run.id}`"
    class="border p-[16px] rounded bg-light-50 border-gray-100 w-full block overflow-hidden hocus-default"
    :href="runUrl"
    :use-default-hocus="false"
  >
    <div
      class="flex justify-between gap-[8px] text-sm text-gray-700 items-center whitespace-nowrap children:flex children:items-center"
      :data-cy="`run-card-status-${run.status}`"
    >
      <div
        class="flex gap-[8px]"
      >
        <RunNumber
          v-if="props.gql.status && props.gql.runNumber"
          :status="props.gql.status"
          :value="props.gql.runNumber"
        />
        <RunResults :gql="props.gql" />
        <span
          v-for="tag in tags"
          :key="tag.label"
          class="inline-flex rounded-md border-gray-200 border-[1px] text-sm px-[4px] text-gray-700 items-center pr-[8px]"
          data-cy="run-tag"
        >
          <component
            :is="tag.icon"
            class="mr-1 icon-dark-gray-700"
          >
            {{ tag.icon }}
          </component>
          <span
            v-if="tag.srLabel"
            class="sr-only"
          >
            {{ tag.srLabel }}
          </span>
          {{ tag.label }}
        </span>
      </div>
      <div
        class="flex"
      >
        <ul
          v-if="run.commitInfo"
          class="flex flex-wrap text-sm text-gray-700 items-center whitespace-nowrap children:flex children:items-center children:pr-[16px]"
        >
          <li
            v-if="run.commitInfo?.authorName"
            data-cy="run-card-author"
          >
            <i-cy-general-user_x16
              class="mr-1 icon-dark-gray-500 icon-light-gray-100 icon-secondary-light-gray-200"
            />
            <span class="sr-only">{{ t('runs.card.commitAuthor') }}</span>{{ run.commitInfo.authorName }}
          </li>

          <li
            v-if="run.createdAt"
            data-cy="run-card-createdAt"
          >
            <IconTimeStopwatch
              size="16"
              class="mr-2"
              stroke-color="gray-500"
              fill-color="gray-50"
            />
            <span class="sr-only">{{ t('runs.card.totalDuration') }}</span> {{ totalDuration }} ({{ relativeCreatedAt }})
          </li>
        </ul>
        <Tooltip
          v-if="props.showDebug && run.runNumber"
          tab-index="0"
          :disabled="props.debugEnabled"
        >
          <Button
            data-cy="open-debug"
            variant="outline-light"
            :disabled="!props.debugEnabled"
            size="20"
            :aria-label="t(props.debugEnabled ? 'runs.card.debugDescription' : 'runs.card.noDebugAvailable', { runNumber: run.runNumber })"
            @click="onDebugClick"
          >
            <IconTechnologyDebugger class="h-[16px] w-[16px]" />
            {{ t('runs.card.debugLabel') }}
          </Button>
          <template #popper>
            {{ t('runs.card.noDebugAvailable') }}
          </template>
        </Tooltip>
      </div>
    </div>
  </ExternalLink>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from '@cy/i18n'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import { gql, useSubscription, useMutation } from '@urql/vue'
import RunResults from '../components/RunResults.vue'
import RunNumber from '../components/RunNumber.vue'
import Button from '@cypress-design/vue-button'
import Tooltip from '@packages/frontend-shared/src/components/Tooltip.vue'
import { RunCardFragment, RunCard_ChangeDocument, RunCard_ShowDebugForCloudRunDocument } from '../generated/graphql'
import { useRunDateTimeInterval } from '../debug/useRunDateTimeInterval'
import { IconTechnologyDebugger, IconTimeStopwatch, IconTechnologyBranchH } from '@cypress-design/vue-icon'
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
	...CommonResults
	commitInfo {
		authorName
		authorEmail
		summary
		branch
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

const tags = computed(() => {
  let tempTags: { icon?: any, srLabel?: string, label: string }[] = []

  if (run.value.commitInfo?.branch) {
    tempTags.push({
      icon: IconTechnologyBranchH,
      srLabel: t('runs.card.branchName'),
      label: run.value.commitInfo.branch,
    })
  }

  let textTags = (props.gql.tags ?? []).map((tag) => {
    if (tag) {
      return { label: tag.name }
    }

    return undefined
  }).filter(Boolean) as { label: string }[]

  tempTags = tempTags.concat(textTags)

  if (tempTags.length <= 2) {
    return tempTags
  }

  return tempTags.slice(0, 2).concat({ label: `+${tempTags.length - 2}` })
})

const onDebugClick = (event) => {
  event.preventDefault()
  event.stopPropagation()

  showDebugForRun()
}

</script>
