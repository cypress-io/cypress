<template>
  <SettingsContainer
    v-if="query.data.value"
    :gql="query.data.value"
  />
</template>

<script lang="ts" setup>
import { gql, useQuery } from '@urql/vue'
import SettingsContainer from '../settings/SettingsContainer.vue'
import { SettingsDocument } from '../generated/graphql'

gql`
query Settings {
  ...SettingsContainer
}`

const query = useQuery({ query: SettingsDocument, requestPolicy: 'network-only' })

</script>
