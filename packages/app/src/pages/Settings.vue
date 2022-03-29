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
import { onMounted } from 'vue'

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

onMounted(() => {
  query.executeQuery()
})

useSubscription({ query: Settings_CloudProjectUpdateDocument })

</script>
