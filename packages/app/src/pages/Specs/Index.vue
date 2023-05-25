<template>
  <div
    v-if="query.data.value"
    class="h-full"
  >
    <CreateSpecModal
      v-if="query.data.value.currentProject?.currentTestingType"
      :key="generator"
      :initial-generator="generator"
      :show="modalIsShown"
      :gql="query.data.value"
      @close="closeCreateSpecModal"
    />
    <SpecsList
      v-if="query.data.value.currentProject?.specs.length"
      :gql="query.data.value"
      :most-recent-update="mostRecentUpdate"
      :show-enable-notifications-banner="showEnableNotificationsBanner"
      @showCreateSpecModal="showCreateSpecModal"
    />
    <NoSpecsPage
      v-else
      :gql="query.data.value"
      :title="title"
      :is-default-spec-pattern="isDefaultSpecPattern"
      @showCreateSpecModal="showCreateSpecModal"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { gql, SubscriptionHandlerArg, useQuery } from '@urql/vue'
import { useI18n } from '@cy/i18n'
import SpecsList from '../../specs/SpecsList.vue'
import NoSpecsPage from '../../specs/NoSpecsPage.vue'
import CreateSpecModal from '../../specs/CreateSpecModal.vue'
import { SpecsPageContainerDocument, SpecsPageContainer_SpecsChangeDocument, SpecsPageContainer_SpecListPollingDocument, SpecsPageContainer_BranchInfoDocument } from '../../generated/graphql'
import { useSubscription } from '../../graphql'

defineProps<{
  showEnableNotificationsBanner: boolean
}>()

const { t } = useI18n()

gql`
query SpecsPageContainer_BranchInfo {
  currentProject {
    id
    branch
    projectId
  }
}
`

gql`
query SpecsPageContainer($fromBranch: String!, $hasBranch: Boolean!) {
  ...Specs_SpecsList
  ...NoSpecsPage
  ...CreateSpecModal
  currentProject {
    id
    isDefaultSpecPattern
  }
}
`

gql`
subscription SpecsPageContainer_specsChange($fromBranch: String!, $hasBranch: Boolean!) {
  specsChange {
    id
    specs {
      id
      ...SpecsList
    }
  }
}
`

gql`
subscription SpecsPageContainer_specListPolling($fromBranch: String, $projectId: String) {
  startPollingForSpecs(branchName: $fromBranch, projectId: $projectId)
}
`

const branchInfo = useQuery({ query: SpecsPageContainer_BranchInfoDocument })

const variables = computed(() => {
  const fromBranch = branchInfo.data.value?.currentProject?.branch ?? ''
  const hasBranch = Boolean(fromBranch)

  return { fromBranch, hasBranch }
})

const pollingVariables = computed(() => {
  const fromBranch = branchInfo.data.value?.currentProject?.branch ?? null
  const projectId = branchInfo.data.value?.currentProject?.projectId ?? null

  return { fromBranch, projectId }
})

useSubscription({
  query: SpecsPageContainer_SpecsChangeDocument,
  variables,
})

const mostRecentUpdate = ref<string|null>(null)

const updateMostRecentUpdate: SubscriptionHandlerArg<any, any> = (_, reportedUpdate) => {
  mostRecentUpdate.value = reportedUpdate?.startPollingForSpecs ?? null
}

useSubscription({
  query: SpecsPageContainer_SpecListPollingDocument,
  variables: pollingVariables,
}, updateMostRecentUpdate)

const query = useQuery({
  query: SpecsPageContainerDocument,
  variables,
})

const isDefaultSpecPattern = computed(() => !!query.data.value?.currentProject?.isDefaultSpecPattern)

const title = computed(() => {
  return isDefaultSpecPattern.value ?
    t('createSpec.page.defaultPatternNoSpecs.title') :
    t('createSpec.page.customPatternNoSpecs.title')
})

const modalIsShown = ref(false)

const generator = ref()

const showCreateSpecModal = (generatorId?: string) => {
  modalIsShown.value = true
  generator.value = generatorId || null
}

const closeCreateSpecModal = () => {
  modalIsShown.value = false
  generator.value = null
}
</script>

<route>
{
  name: "Specs"
}
</route>
