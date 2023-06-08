<template>
  <div v-if="query.data.value">
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
import { gql, useQuery } from '@urql/vue'
import { useI18n } from '@cy/i18n'
import SpecsList from '../../specs/SpecsList.vue'
import NoSpecsPage from '../../specs/NoSpecsPage.vue'
import CreateSpecModal from '../../specs/CreateSpecModal.vue'
import { SpecsPageContainerDocument, SpecsPageContainer_SpecsChangeDocument } from '../../generated/graphql'
import { useSubscription } from '../../graphql'
import { useRelevantRun } from '../../composables/useRelevantRun'
import { isEmpty } from 'lodash'

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
query SpecsPageContainer($runIds: [ID!]!, $hasRunIds: Boolean!) {
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
subscription SpecsPageContainer_specsChange($runIds: [ID!]!, $hasRunIds: Boolean!) {
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

const relevantRuns = useRelevantRun('SPECS')

const variables = computed(() => {
  const runIds = relevantRuns.value.latest?.map((run) => run.runId) || []
  const hasRunIds = !isEmpty(runIds)

  return { runIds, hasRunIds }
})

useSubscription({
  query: SpecsPageContainer_SpecsChangeDocument,
  variables,
})

const mostRecentUpdate = ref<string|null>(null)

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
