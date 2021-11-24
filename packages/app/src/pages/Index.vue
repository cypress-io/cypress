<template>
  <div v-if="query.data.value">
    <SpecsList
      v-if="query.data.value.currentProject?.specs?.edges.length"
      :gql="query.data.value"
    />
    <NoSpecsPage
      v-else
      :gql="query.data.value"
      :title="title"
      :description="description"
    />
  </div>

  <div v-else>
    Loading...
  </div>
</template>

<script lang="ts" setup>
import { gql, useQuery } from '@urql/vue'
import SpecsList from '../specs/SpecsList.vue'
import { SpecsPageContainerDocument } from '../generated/graphql'
import NoSpecsPage from '../specs/NoSpecsPage.vue'
import { computed } from 'vue'
import { useI18n } from '@cy/i18n'
const { t } = useI18n()

gql`
query SpecsPageContainer {
  ...Specs_SpecsList
  ...NoSpecsPage
}
`

const query = useQuery({ query: SpecsPageContainerDocument })

const title = computed(() => {
  // TODO: add logic here based on if default spec pattern is used
  // to determine the correct title
  return t('createSpec.page.title')
})
const description = computed(() => {
  // TODO: add logic here based on if default spec pattern is used
  // to determine the correct title
  return t(`createSpec.page.${query.data.value?.currentProject?.currentTestingType}.description`)
})

</script>

<route>
{
  name: "Specs Page",
  meta: {
    title: "Specs"
  }
}
</route>
