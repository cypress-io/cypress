<template>
  <SettingsContainer
    v-if="query.data.value"
    :gql="query.data.value"
  />
</template>

<script lang="ts" setup>
import { gql, useQuery } from '@urql/vue'
import { SettingsDocument } from '../generated/graphql'
import SettingsContainer from '../settings/SettingsContainer.vue'

gql`
query Settings {
  ...SettingsContainer
}`

const query = useQuery({ query: SettingsDocument })
</script>

<route>
{
  name: "Settings Page",
  meta: {
    title: "Settings"
  }
}
</route>
