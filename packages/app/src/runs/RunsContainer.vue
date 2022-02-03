<template>
  <div class="h-full">
    <NoInternetConnection
      v-if="!online && !isCloudProjectReturned"
    >
      Please check your internet connection to resolve this issue. When your internet connection is fixed, we will automatically attempt to fetch your latest runs for this project.
    </NoInternetConnection>
    <RunsConnectSuccessAlert
      v-if="currentProject && showConnectSuccessAlert"
      :gql="currentProject"
      :class="{ 'absolute left-24px right-24px top-24px': currentProject?.cloudProject?.__typename === 'CloudProject' && !currentProject.cloudProject.runs?.nodes.length }"
    />
    <RunsConnect
      v-if="!currentProject?.projectId || !cloudViewer?.id"
      :gql="props.gql"
      @success="showConnectSuccessAlert = true"
    />
    <RunsErrorRenderer
      v-else-if="currentProject?.cloudProject?.__typename !== 'CloudProject'"
      :gql="props.gql"
    />
    <RunsEmpty
      v-else-if="!currentProject?.cloudProject?.runs?.nodes.length"
      :gql="currentProject"
    />
    <div
      v-else
      data-cy="runs"
    >
      <Warning
        v-if="!online"
        :title="t('launchpadErrors.noInternet.header')"
        :message="t('launchpadErrors.noInternet.message')"
        :dismissible="false"
        class="mx-auto mb-24px"
      />
      <RunCard
        v-for="run of currentProject?.cloudProject?.runs?.nodes"
        :key="run.id"
        :gql="run"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watchEffect } from 'vue'
import { gql } from '@urql/vue'
import { useOnline } from '@vueuse/core'
import { useI18n } from '@cy/i18n'
import NoInternetConnection from '@packages/frontend-shared/src/components/NoInternetConnection.vue'
import RunCard from './RunCard.vue'
import RunsConnect from './RunsConnect.vue'
import RunsConnectSuccessAlert from './RunsConnectSuccessAlert.vue'
import RunsEmpty from './RunsEmpty.vue'
import type { RunsContainerFragment } from '../generated/graphql'
import Warning from '@packages/frontend-shared/src/warning/Warning.vue'
import RunsErrorRenderer from './RunsErrorRenderer.vue'

const { t } = useI18n()

const online = useOnline()

const emit = defineEmits<{
  (e: 'reexecuteRunsQuery'): void
}>()

gql`
fragment RunsContainer on Query {
  ...RunsErrorRenderer
  currentProject {
    id
    projectId
    ...RunsEmpty
    ...RunsConnectSuccessAlert
    cloudProject {
      __typename
      ... on CloudProject {
        id
        runs(first: 10) {
          nodes {
            id
            ...RunCard
          }
        }
      }
    }
  }
  cloudViewer {
    id
  }
  ...RunsConnect
}`

const props = defineProps<{
  gql: RunsContainerFragment
}>()

const isCloudProjectReturned = computed(() => props.gql.currentProject?.cloudProject?.__typename === 'CloudProject')

const isOnlineRef = ref(true)
const showConnectSuccessAlert = ref(false)

watchEffect(() => {
  // We want to keep track of the previous state to refetch the query
  // when the internet connection is back
  if (!online.value && isOnlineRef.value) {
    isOnlineRef.value = false
  }

  if (online.value && !isOnlineRef.value) {
    isOnlineRef.value = true
    emit('reexecuteRunsQuery')
  }
})

const currentProject = computed(() => props.gql.currentProject)
const cloudViewer = computed(() => props.gql.cloudViewer)
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity .3s
}

.fade-enter-from, .fade-leave-to {
  opacity: 0
}
</style>
