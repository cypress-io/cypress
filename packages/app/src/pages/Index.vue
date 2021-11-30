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
      :is-using-default-specs="isUsingDefaultSpecs"
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
import { computed, ref } from 'vue'
import { useI18n } from '@cy/i18n'
const { t } = useI18n()

gql`
query SpecsPageContainer {
  ...Specs_SpecsList
  ...NoSpecsPage
}
`

const query = useQuery({ query: SpecsPageContainerDocument })

// TODO: add logic here based on if default spec pattern is used
const isUsingDefaultSpecs = ref(true)

const title = computed(() => {
  return isUsingDefaultSpecs.value ?
    t('createSpec.page.defaultPatternNoSpecs.title') :
    t('createSpec.page.customPatternNoSpecs.title')
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
