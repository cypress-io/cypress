<template>
  <NoInternetConnection
    v-if="!isOnline && !isCloudProjectReturned"
  />
  <RunsConnect
    v-else-if="!currentProject?.projectId || !cloudViewer?.id"
    :gql="props.gql"
  />
  <template v-else-if="currentProject?.cloudProject?.__typename === 'CloudProject'">
    <Warning
      v-if="!isOnline"
      :title="t('launchpadErrors.noInternet.header')"
      :message="t('launchpadErrors.noInternet.message')"
      :dismissible="false"
    />
    <RunsEmpty
      v-if="!currentProject?.cloudProject?.runs?.nodes.length"
      :gql="currentProject"
    />
    <div
      v-else
      data-cy="runs"
    >
      <RunCard
        v-for="run of currentProject?.cloudProject?.runs?.nodes"
        :key="run.id"
        :gql="run"
      />
    </div>
  </template>
</template>

<script lang="ts" setup>
import { computed, ref, watchEffect } from 'vue'
import { gql } from '@urql/vue'
import { useOnline } from '@vueuse/core'
import { useI18n } from '@cy/i18n'
import NoInternetConnection from '@packages/frontend-shared/src/components/NoInternetConnection.vue'
import RunCard from './RunCard.vue'
import RunsConnect from './RunsConnect.vue'
import RunsEmpty from './RunsEmpty.vue'
import type { RunsContainerFragment } from '../generated/graphql'
import Warning from '../../../frontend-shared/src/warning/Warning.vue'

const { t } = useI18n()

const online = useOnline()

const emit = defineEmits<{
  (e: 'reexecuteRunsQuery'): void
}>()

gql`
fragment RunsContainer on Query {
  currentProject {
    id
    ...RunsEmpty
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

const isCloudProjectTypename = props.gql.currentProject?.cloudProject?.__typename === 'CloudProject'

const isShowingOnlineNotification = ref(false)
const isOnlineRef = ref(true)

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

const isCloudProjectReturned = computed(() => isCloudProjectTypename)
const currentProject = computed(() => props.gql.currentProject)
const cloudViewer = computed(() => props.gql.cloudViewer)
const isOnline = computed(() => online.value)
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity .3s
}

.fade-enter-from, .fade-leave-to {
  opacity: 0
}
</style>
