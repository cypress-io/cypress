<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import type { SpecsListFragment } from '../../generated/graphql'
import HighlightedText from '../HighlightedText.vue'
import { deriveIndexes } from '../spec-utils'
import SpecListGitInfo from '../SpecListGitInfo.vue'
import type { SpecTreeFileNode } from '../tree/deriveTree'
import { tableGridColumns } from './constants'
import type { ProjectConnectionStatus, FuzzyIndexes } from '../tree/types'
import SpecsListHoverCell from '../SpecsListHoverCell.vue'
import SpecsListCloudButton from '../SpecsListCloudButton.vue'
import { useLoginConnectStore } from '@packages/frontend-shared/src/store/login-connect-store'
import { useRequestAccess } from '../../composables/useRequestAccess'

const props = defineProps<{
  node: SpecTreeFileNode<SpecsListFragment & FuzzyIndexes>
  projectId?: string
  projectConnectionStatus: ProjectConnectionStatus
}>()

const route: RouteLocationRaw = {
  path: '/specs/runner',
  query: {
    file: props.node.data.relative.replace(/\\/g, '/'),
  },
}

const showCloudConnectButton = computed(() => {
  return props.projectConnectionStatus !== 'CONNECTED' && (
    props.node.data.cloudSpec?.data || props.node.data.cloudSpec?.fetchingStatus !== 'FETCHING')
})

const { openLoginConnectModal } = useLoginConnectStore()
const requestAccess = useRequestAccess()

const indexes = computed(() => {
  const idx = deriveIndexes(
    props.node.data.fileName,
    props.node.data.fuzzyIndexes?.baseName ?? [],
  )

  return idx
})
</script>

<template>
  <RouterLink
    :style="{ paddingLeft: `${((node.parent.depth) * 10) + 22}px` }"
    data-cy="spec-list-file"
    :data-cy-row="props.node.data.baseName"
    class="h-full outline-none ring-inset grid pr-20px group focus:outline-transparent focus-within:ring-indigo-300 focus-within:ring-1 children:cursor-pointer"
    :class="tableGridColumns"
    :to="route"
  >
    <div
      class="h-full grid gap-8px grid-cols-[16px,auto,auto] items-center"
      data-cy="spec-item"
      :data-cy-spec-item="props.node.data.fileName"
    >
      <i-cy-document-blank_x16
        class="icon-light-gray-50 icon-dark-gray-200 group-hocus:icon-light-indigo-200 group-hocus:icon-dark-indigo-400"
      />
      <div>
        <div
          :title="`${props.node.data.fileName + props.node.data.specFileExtension}`"
          class="text-gray-400 text-indigo-500 truncate group-hocus:text-indigo-600"
        >
          <HighlightedText
            :text="props.node.data.fileName"
            :indexes="indexes.fileNameIndexes"
            class="font-medium text-indigo-500 group-hocus:text-indigo-700"
            highlight-classes="text-gray-1000"
          />
          <HighlightedText
            :text="props.node.data.specFileExtension"
            :indexes="indexes.extensionIndexes"
            class="font-light group-hocus:text-gray-400"
            highlight-classes="text-gray-1000"
          />
        </div>
      </div>
    </div>

    <SpecListGitInfo
      v-if="props.node.data.gitInfo"
      :gql="props.node.data.gitInfo"
    />

    <!-- latest -->
    <SpecsListHoverCell
      data-cy="specs-list-row-latest-runs"
      :is-hover-disabled="props.projectConnectionStatus === 'CONNECTED'"
    >
      <template #content>
        <slot name="latest-runs" />
      </template>

      <template #hover>
        <SpecsListCloudButton
          v-if="showCloudConnectButton"
          :project-connection-status="props.projectConnectionStatus"
          @show-login-connect="openLoginConnectModal({ utmMedium: 'Specs Latest Runs Empty State' })"
          @request-access="requestAccess(props.projectId)"
        />
      </template>
    </SpecsListHoverCell>

    <!-- average duration -->
    <SpecsListHoverCell
      data-cy="specs-list-row-average-duration"
      :is-hover-disabled="props.projectConnectionStatus === 'CONNECTED'"
      class="hidden md:block"
    >
      <template #content>
        <slot name="average-duration" />
      </template>

      <template #hover>
        <SpecsListCloudButton
          v-if="showCloudConnectButton"
          :project-connection-status="props.projectConnectionStatus"
          @show-login-connect="openLoginConnectModal({ utmMedium: 'Specs Average Duration Empty State' })"
          @request-access="requestAccess(props.projectId)"
        />
      </template>
    </SpecsListHoverCell>
  </RouterLink>
</template>
