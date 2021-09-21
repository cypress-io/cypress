<template>
  <template v-if="query.data.value">
    <template v-if="query.data.value.app.isInGlobalMode">
      <GlobalPage :gql="query.data.value.app"/>
    </template>

    <template v-else>
      <HeaderBar :gql="query.data.value" />
      <template v-if="query.data.value?.wizard.step === 'welcome'">
        <WizardHeader :gql="query.data.value.wizard" />
        <TestingTypeCards :gql="query.data.value" />
      </template>
      <Wizard 
        v-else
        :gql="query.data.value" 
      />
    </template>
  </template>
  <div v-else>Loading</div>
</template>

<script lang="ts" setup>
import { gql, useQuery } from '@urql/vue'
import { MainQueryDocument } from './generated/graphql'
import TestingTypeCards from './setup/TestingTypeCards.vue'
import Wizard from './setup/Wizard.vue'
import WizardHeader from './setup/WizardHeader.vue'
import HeaderBar from './layouts/HeaderBar.vue'
import GlobalPage from './global/GlobalPage.vue'

gql`
query MainQuery {
  ...TestingTypeCards
  ...Wizard

  wizard {
    ...WizardHeader
  }

  app {
    isInGlobalMode
    ...GlobalPage
  }
  ...HeaderBar
}
`

const query = useQuery({ query: MainQueryDocument })
</script>