<template>
  <div class="h-full">
    <RunsConnectSuccessAlert
      v-if="currentProject && showConnectSuccessAlert"
      :gql="currentProject"
    />
    <CloudConnectModals
      v-if="showConnectDialog"
      :show="showConnectDialog"
      :gql="props.gql"
      @cancel="showConnectDialog = false"
    />
    <RunsConnect
      v-if="!currentProject?.projectId || !cloudViewer?.id"
      :gql="props.gql"
      @success="showConnectSuccessAlert = true"
    />
    <RunsError
      v-else-if="currentProject?.cloudProject?.__typename === 'CloudProjectNotFound'"
      icon="error"
      :button-text="t('runs.errors.notfound.button')"
      :button-icon="ConnectIcon"
      :message="t('runs.errors.notfound.title')"
      @button-click="showConnectDialog = true"
    >
      <i18n-t keypath="runs.errors.notfound.description">
        <CodeTag
          bg
          class="bg-purple-50 text-purple-500"
        >
          projectId: "{{ currentProject?.projectId }}"
        </CodeTag>
      </i18n-t>
    </RunsError>
    <RunsError
      v-else-if="currentProject?.cloudProject?.__typename === 'CloudProjectUnauthorized'"
      icon="access"
      :button-text="t('runs.errors.unauthorized.button')"
      :button-icon="SendIcon"
      :message="t('runs.errors.unauthorized.title')"
    >
      {{ t('runs.errors.unauthorized.description') }}
    </RunsError>
    <RunsEmpty
      v-else-if="!currentProject?.cloudProject?.runs?.nodes.length"
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
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { gql } from '@urql/vue'
import CodeTag from '@cy/components/CodeTag.vue'
import RunCard from './RunCard.vue'
import RunsConnect from './RunsConnect.vue'
import RunsConnectSuccessAlert from './RunsConnectSuccessAlert.vue'
import RunsEmpty from './RunsEmpty.vue'
import type { RunsContainerFragment } from '../generated/graphql'
import RunsError from './RunsError.vue'
import ConnectIcon from '~icons/cy/chain-link_x16.svg'
import SendIcon from '~icons/cy/paper-airplane_x16.svg'
import { useI18n } from '@cy/i18n'
import CloudConnectModals from './modals/CloudConnectModals.vue'

const { t } = useI18n()

gql`
fragment RunsContainer on Query {
  currentProject {
    id
    projectId
    ...RunsEmpty
    ...RunsConnectSuccessAlert
    cloudProject {
      __typename
      ... on CloudProject {
        id
        runs {
          nodes {
            id
            ...RunCard
          }
        }
      }
      ... on CloudProjectNotFound {
        message
      }
      ... on CloudProjectUnauthorized {
        message
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

const showConnectSuccessAlert = ref(false)
const showConnectDialog = ref(false)

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
