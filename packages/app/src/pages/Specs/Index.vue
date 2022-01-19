<template>
  <div v-if="query.data.value">
    <SpecsList
      v-if="query.data.value.currentProject?.specs?.edges.length"
      :gql="query.data.value.currentProject"
    />
    <NoSpecsPage
      v-else
      :gql="query.data.value"
      :title="title"
      :is-using-default-specs="isUsingDefaultSpecs"
    />
  </div>

  <div v-else>
    Loading...
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { gql, useQuery, useSubscription } from '@urql/vue'
import { useI18n } from '@cy/i18n'
import SpecsList from '../../specs/SpecsList.vue'
import NoSpecsPage from '../../specs/NoSpecsPage.vue'
import { SpecsIndex_SubscriptionDocument, SpecsPageContainerDocument } from '../../generated/graphql'
const { t } = useI18n()

gql`
query SpecsPageContainer {
  ...NoSpecsPage
  currentProject {
    id
    ...Specs_SpecsList
  }
}
`

gql`
subscription SpecsIndex_Subscription {
  specsChanged {
    id
    ...Specs_SpecsList
    ...NoSpecsPage_CurrentProject
  }
}
`

const query = useQuery({ query: SpecsPageContainerDocument })

useSubscription({ query: SpecsIndex_SubscriptionDocument })

// TODO: add logic here based on if default spec pattern is used
const isUsingDefaultSpecs = ref(true)

const title = computed(() => {
  return isUsingDefaultSpecs.value ?
    t('createSpec.page.defaultPatternNoSpecs.title') :
    t('createSpec.page.customPatternNoSpecs.title')
})

</script>
