<template>
  <SidebarNavigation
    :gql="query.data.value"
    :is-loading="query.fetching.value"
  />
</template>

<script lang="ts" setup>
import SidebarNavigation from './SidebarNavigation.vue'
import { gql, useQuery } from '@urql/vue'
import { SideBarNavigationContainerDocument } from '../generated/graphql'

gql`
query SideBarNavigationContainer {
  ...SidebarNavigation
}
`

const query = useQuery({ query: SideBarNavigationContainerDocument })
</script>
