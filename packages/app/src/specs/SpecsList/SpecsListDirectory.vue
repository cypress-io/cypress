<script setup lang="ts">
import { computed } from 'vue'
import { getAllFileInDirectory, groupSpecTreeNodes } from '../tree/deriveTree'
import SpecsListFile from './SpecsListFile.vue'
import IconFolder from '~icons/cy/folder_x16.svg'
import type { DirectoryNode, ProjectConnectionStatus, FileNode } from '../tree/types'
import HighlightedText from '../HighlightedText.vue'
import RunStatusDots from '../RunStatusDots.vue'
import AverageDuration from '../AverageDuration.vue'
import FlakyInformation from '../flaky-badge/FlakyInformation.vue'
import type { FlakyInformationProjectFragment } from '../../generated/graphql'

const props = defineProps<{
  node: DirectoryNode
  projectConnectionStatus: ProjectConnectionStatus
  gqlProject: FlakyInformationProjectFragment | null
  handleCollapse: (node: DirectoryNode) => void
}>()

const fileList = computed(() => getAllFileInDirectory(props.node))

const grouped = computed(() => groupSpecTreeNodes(props.node))

const isRootNode = computed(() => props.node.depth === 0)

function shouldShowDots (node: FileNode) {
  const shouldShow = node.data.cloudSpec?.data ||
    node.data.cloudSpec?.fetchingStatus !== 'FETCHING'

  return shouldShow
}
</script>

<template>
  <div
    :style="{ paddingLeft: `${(props.node.depth - 1) * 20}px` }"
    class="flex items-center"
    :data-cy="isRootNode ? '' : 'spec-list-directory'"
    :class="{ 'hidden-node': isRootNode }"
  >
    <button
      class="h-full grid gap-8px grid-cols-[14px,16px,auto] items-center focus:outline-none"
      :data-cy="`row-directory-depth-${props.node.depth}`"
      :data-cy-row-directory="`${props.node.name}`"
      :aria-expanded="!props.node.collapsed"
      @click="props.handleCollapse(props.node)"
    >
      <i-cy-chevron-down-small_x16
        class="mr-8px text-sm icon-dark-gray-300 group-hocus:(icon-dark-gray-700)"
        :class="{ 'transform rotate-270': props.node.collapsed }"
      />
      <component
        :is="IconFolder"
        class="icon-dark-white icon-light-gray-200"
      />

      <div
        :title="props.node.name"
        class="text-gray-600 truncate"
      >
        <HighlightedText
          :text="props.node.name"
          :indexes="[]"
          class="font-medium"
          highlight-classes="text-gray-1000"
        />
        <span class="text-gray-700 text-xs">
          (Run {{ fileList.length }} specs) [depth: {{ props.node.depth }}]
        </span>
      </div>
      <span class="sr-only">{{
        !props.node.collapsed ? "collapse" : "expand"
      }}</span>
    </button>
  </div>

  <template v-if="!props.node.collapsed">
    <SpecsListFile
      v-for="file of grouped.files"
      :key="file.data.relative"
      :node="file"
      :project-connection-status="props.projectConnectionStatus"
      :project-id="props.gqlProject?.projectId ?? undefined"
    >
      <template #flaky-information>
        <span class="ml-2 inline-block">
          <FlakyInformation
            :project-gql="props.gqlProject"
            :spec-gql="file.data"
            :cloud-spec-gql="file.data.cloudSpec"
          />
        </span>
      </template>
      <template #latest-runs>
        <div class="h-full grid justify-items-end items-center relative">
          <!-- status: {{ file.data.cloudSpec?.fetchingStatus }} -->
          <RunStatusDots
            v-if="shouldShowDots(file)"
            :gql="file.data.cloudSpec ?? null"
            :spec-file-extension="file.data.specFileExtension"
            :spec-file-name="file.data.fileName"
          />
          <div
            v-else-if="file.data.cloudSpec?.fetchingStatus === 'FETCHING'"
            class="bg-gray-50 rounded-[20px] h-24px w-full animate-pulse"
            data-cy="run-status-dots-loading"
          />
        </div>
      </template>

      <template #average-duration>
        <AverageDuration :gql="file.data.cloudSpec ?? null" />
      </template>
    </SpecsListFile>

    <SpecsListDirectory
      v-for="child of grouped.directories"
      :key="child.relative"
      :node="child"
      :project-connection-status="props.projectConnectionStatus"
      :handle-collapse="props.handleCollapse"
      :gql-project="props.gqlProject"
    />
  </template>
</template>

<style>
/** We hide the root node, which is always `/` */
.hidden-node {
  height: 0px !important;
  overflow: hidden;
}
</style>
