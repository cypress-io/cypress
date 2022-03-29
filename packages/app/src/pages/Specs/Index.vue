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

  <div v-else>
    Loading...
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { gql, useQuery, useSubscription } from '@urql/vue'
import { useI18n } from '@cy/i18n'
import SpecsList from '../../specs/SpecsList.vue'
import NoSpecsPage from '../../specs/NoSpecsPage.vue'
import CreateSpecModal from '../../specs/CreateSpecModal.vue'
import { SpecsPageContainerDocument, SpecsPageContainer_SpecsChangeDocument } from '../../generated/graphql'

const { t } = useI18n()

gql`
query SpecsPageContainer {
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
subscription SpecsPageContainer_specsChange {
  specsChange {
    id
    specs {
      id
      ...SpecsList
    }
  }
}
`

useSubscription({ query: SpecsPageContainer_SpecsChangeDocument })

const query = useQuery({ query: SpecsPageContainerDocument })

onMounted(() => {
  query.executeQuery()
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
