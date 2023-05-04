<template>
  <SettingsContainer
    v-if="query.data.value"
    :gql="query.data.value"
  />
</template>

<script lang="ts" setup>
import { gql, useQuery } from '@urql/vue'
import SettingsContainer from '../settings/SettingsContainer.vue'
import { Config_ConfigChangeDocument, SettingsDocument } from '../generated/graphql'
import { useSubscription } from '../graphql'

gql`
query Settings {
  ...SettingsContainer
}`

gql`
subscription Config_ConfigChange {
  configChange {
    id
    ...ProjectSettings
  }
}
`

const query = useQuery({ query: SettingsDocument })

useSubscription({ query: Config_ConfigChangeDocument })
</script>
