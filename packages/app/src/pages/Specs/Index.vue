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
import { computed, ref } from 'vue'
import { gql, useQuery } from '@urql/vue'
import { useI18n } from '@cy/i18n'
import SpecsList from '../../specs/SpecsList.vue'
import NoSpecsPage from '../../specs/NoSpecsPage.vue'
import { SpecsPageContainerDocument } from '../../generated/graphql'
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
