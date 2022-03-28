<template>
  <SettingsContainer
    v-if="query.data.value"
    :gql="query.data.value"
  />
</template>

<script lang="ts" setup>
import { gql, useQuery, useSubscription } from '@urql/vue'
import SettingsContainer from '../settings/SettingsContainer.vue'
import { SettingsDocument, Settings_CloudProjectUpdateDocument } from '../generated/graphql'

gql`
query Settings {
  ...SettingsContainer
}`

const query = useQuery({ query: SettingsDocument })

gql`
subscription Settings_cloudProjectUpdate {
  cloudProjectChange {
    id
    ...CloudSettings_CloudProject
  }
}
`

useSubscription({ query: Settings_CloudProjectUpdateDocument }, (current, next) => {
  // Need to investigate why this is needed. When the subscription comes in the cache should update & automatically
  // re-trigger any affected queries. Maybe due to the fact that the result from cloudProject is a union?
  query.executeQuery({ requestPolicy: 'cache-only' })

  return next
})

</script>
