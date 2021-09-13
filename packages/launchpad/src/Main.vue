<template>
  <template v-if="query.data.value">
    <HeaderBar :gql="query.data.value.app" />
    <TestingTypeCards 
      v-if="query.data.value?.wizard.step === 'welcome'"
      :gql="query.data.value" 
    />
    <Wizard 
      v-else
      :gql="query.data.value" 
    />
  </template>
  <div v-else>Loading</div>
</template>

<script lang="ts" setup>
import { gql, useQuery } from '@urql/vue'
import { MainQueryDocument } from './generated/graphql';
import TestingTypeCards from './setup/TestingTypeCards.vue';
import Wizard from './setup/Wizard.vue'
import HeaderBar from './layouts/HeaderBar.vue'

gql`
query MainQuery {
  ...TestingTypeCards
  ...Wizard

  app {
    ...HeaderBar
  }
}
`

const query = useQuery({ query: MainQueryDocument })
</script>