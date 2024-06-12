<template>
  <div
    v-if="isUsingGit"
    class="flex flex-col gap-[24px]"
  >
    <ul
      data-cy="runsLayout-git"
      class="flex flex-col gap-[16px] relative before:content-[''] before:absolute before:top-[20px] before:bottom-[10px] before:w-[2px] before:border-2 before:border-dashed before:border-l-0 before:border-y-0 before:border-r-gray-100 before:left-[7px]"
    >
      <li
        v-for="(sha,index) of Object.keys(groupByCommit)"
        :key="sha"
        :data-cy="`commit-${sha}`"
        :class="{ 'mb-[-24px]': !groupByCommit[sha].runs }"
      >
        <div
          class="flex items-center my-[10px] [&>*:last-child]:mr-[8px]"
          :class="{ 'mt-0': index === 0 }"
        >
          <DebugCommitIcon
            aria-hidden="true"
            class="h-[16px] w-[16px] relative"
          />
          <LightText class="shrink-0 truncate ml-[8px]">
            {{ sha.slice(0, 7) }}
          </LightText>
          <Dot />
          <span
            class="text-sm font-medium text-gray-800 truncate"
            :title="groupByCommit[sha].message!"
            role="none"
          >
            {{ groupByCommit[sha].message }}
          </span>
          <span
            v-if="sha === currentCommitInfo?.sha"
            data-cy="tag-checked-out"
            class="inline-flex items-center shrink-0 font-medium text-purple-400 align-middle border border-gray-100 rounded border-1 h-[16px] ml-[8px] px-[4px] text-[12px] leading-[16px]"
          >
            {{ t('runs.layout.checkedOut') }}
          </span>
        </div>
        <ul
          v-if="groupByCommit[sha].runs"
          class="relative bg-white border border-gray-100 rounded border-1 overflow-hidden"
        >
          <li
            v-for="run of groupByCommit[sha].runs"
            :key="run.id"
            class="border-gray-100 [&:not(:last-child)]:border-b w-full block overflow-auto"
          >
            <RunCard
              :gql="run"
              :show-debug="true"
              :debug-enabled="enableDebugging(run.id)"
            />
          </li>
        </ul>
      </li>
    </ul>
    <Button
      v-if="props.latestRunUrl"
      data-cy="open-cloud-latest"
      variant="outline-indigo"
      size="32"
      class="self-start"
      @click="openLatest"
    >
      <IconTechnologyCypress class="h-[16px] w-[16px] mr-[8px]" />
      {{ t('runs.layout.viewCloudRuns') }}
    </Button>
  </div>
  <ul
    v-else
    data-cy="runsLayout-no-git"
    class="relative bg-white border border-gray-100 rounded border-1 overflow-hidden"
  >
    <li
      v-for="run of runs"
      :key="run.id"
      class="border-gray-100 [&:not(:last-child)]:border-b w-full block overflow-auto"
    >
      <RunCard
        :gql="run"
      />
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { compact, groupBy } from 'lodash'
import { computed, h, FunctionalComponent } from 'vue'
import { useI18n } from '@cy/i18n'
import RunCard from './RunCard.vue'
import DebugCommitIcon from '../debug/DebugCommitIcon.vue'
import Button from '@cypress-design/vue-button'
import { IconTechnologyCypress } from '@cypress-design/vue-icon'
import type { RunCardFragment } from '../generated/graphql'
import { useExternalLink } from '@cy/gql-components/useExternalLink'

const { t } = useI18n()

const props = defineProps<{
  runs?: RunCardFragment[]
  allRunIds?: string[]
  isUsingGit?: boolean
  latestRunUrl?: string
  currentCommitInfo?: { sha: string, message: string } | null
}>()

const openLatest = useExternalLink(props.latestRunUrl)

const Dot: FunctionalComponent = () => {
  return h('span', { ariaHidden: 'true', class: 'px-[8px] text-gray-300' }, '•')
}

const LightText: FunctionalComponent = (_props, { slots }) => {
  return h('span', { class: 'text-sm text-gray-700' }, slots?.default?.())
}

const enableDebugging = (runId: string) => {
  const allRunIds = props.allRunIds

  if (!allRunIds) {
    return false
  }

  return allRunIds.some((allRunId) => runId === allRunId)
}

const groupByCommit = computed(() => {
  const grouped = groupBy(compact(props.runs), (run) => {
    return run?.commitInfo?.sha
  })

  const mapped = {}

  const hasRunsForCurrentCommit = props.currentCommitInfo?.sha && Object.keys(grouped).includes(props.currentCommitInfo.sha)

  if (!hasRunsForCurrentCommit && props.currentCommitInfo) {
    mapped[props.currentCommitInfo.sha] = props.currentCommitInfo
  }

  const result = Object.keys(grouped).reduce<Record<string, {sha: string, message: string | undefined | null, runs: typeof props.runs}>>((acc, curr) => {
    acc[curr] = {
      sha: curr,
      message: grouped[curr][0].commitInfo?.summary,
      runs: grouped[curr],
    }

    return acc
  }, mapped)

  return result
})

</script>
