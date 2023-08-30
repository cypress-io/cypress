<template>
  <ExternalLink
    :data-cy="`runCard-${run.id}`"
    class="border p-[16px] rounded bg-light-50 border-gray-100 w-full block overflow-hidden hocus-default"
    :href="runUrl"
    :use-default-hocus="false"
  >
    <div
      class="flex flex-wrap justify-between  text-sm text-gray-700 items-center whitespace-nowrap children:flex children:items-center"
      :data-cy="`run-card-status-${run.status}`"
    >
      <div
        class="gap-[8px]"
      >
        <CommonRunNumber
          v-if="props.gql.status && props.gql.runNumber"
          :status="props.gql.status"
          :value="props.gql.runNumber"
        />
        <CommonResults :gql="props.gql" />
        <span
          v-for="tag in tags"
          :key="tag.label"
          class="inline-flex rounded-md font-semibold border-gray-200 border-[1px] text-sm px-[4px] text-gray-700 items-center"
          data-cy="run-tag"
        >
          <component
            :is="tag.icon"
            class="mr-1 icon-dark-gray-300"
          >
            {{ tag.icon }}
          </component>
          <span
            v-if="tag.srLabel"
            class="sr-only"
          >
            {{ tag.srLabel }}
          </span>
          <span
            :aria-hidden="!!tag.srLabel ? true : undefined"
          >
            {{ tag.label }}
          </span>
        </span>
      </div>
      <ul
        v-if="run.commitInfo"
        class="flex flex-wrap text-sm text-gray-700 list-none list-inside items-center whitespace-nowrap children:flex children:items-center children:before:!content-['']"
      >
        <li
          v-if="run.commitInfo?.authorName"
          data-cy="run-card-author"
        >
          <i-cy-general-user_x16
            class="mr-1 icon-dark-gray-500 icon-light-gray-100 icon-secondary-light-gray-200"
          />
          <span class="sr-only">Commit Author:</span>{{ run.commitInfo.authorName }}
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
          <span class="sr-only">Run Total Duration:</span> {{ totalDuration }} ({{ relativeCreatedAt }})
        </li>

        <li
          v-if="true"
          data-cy="run-card-duration"
        >
          <Button
            data-cy="open-debug"
            variant="tertiary"
            :prefix-icon="IconTechnologyDebugger"
            @click="onDebugClick"
          >
            Debug
          </Button>
        </li>
      </ul>
    </div>
  </ExternalLink>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from '@cy/i18n'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import { gql, useSubscription } from '@urql/vue'
import CommonResults from '../layouts/CommonResults.vue'
import CommonRunNumber from '../layouts/CommonRunNumber.vue'
import Button from '@packages/frontend-shared/src/components/Button.vue'
import { RunCardFragment, RunCard_ChangeDocument } from '../generated/graphql'
import { dayjs } from './utils/day.js'
import { useDurationFormat } from '../composables/useDurationFormat'
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

const props = defineProps<{
  gql: RunCardFragment
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

const relativeCreatedAt = computed(() => dayjs(new Date(run.value.createdAt!)).fromNow())

const totalDuration = useDurationFormat(run.value.totalDuration ?? 0)

const tags = computed(() => {
  let tempTags: { icon?: any, srLabel?: string, label: string }[] = []

  if (run.value.commitInfo?.branch) {
    tempTags.push({
      icon: IconTechnologyBranchH,
      srLabel: t('runs.page.card.branchName', run.value.commitInfo.branch),
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

  alert('debug clicked!')
}

</script>

<style scoped>
li:not(:first-child)::before {
  content: '•';
  @apply text-lg text-gray-400 pr-[8px]
}
</style>
