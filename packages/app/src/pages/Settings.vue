<template>
  <SettingsPage
    v-if="query.data.value"
    :gql="query.data.value"
  />
</template>

<script lang="ts" setup>
import { gql, useQuery } from '@urql/vue'
import { SettingsDocument } from '../generated/graphql'
import SettingsPage from '../settings/SettingsPage.vue'

gql`
query Settings {
  ...SettingsPage
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
