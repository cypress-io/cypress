<template>
  <template v-if="query.data.value">
    <HeaderBar />
    <div class="p-24px">
      <template v-if="query.data.value.baseError">
        <BaseError :gql="query.data.value.baseError" />
      </template>
      <GlobalPage
        v-else-if="query.data.value.app.isInGlobalMode && !query.data.value?.currentProject"
        :gql="query.data.value"
      />
      <ChooseTestingTypeContainer v-else-if="!query.data.value.currentProject?.currentTestingType" />
      <Wizard
        v-else-if="query.data.value.wizard"
        :gql="query.data.value.wizard"
      />
      <OpenBrowserContainer v-else />
    </div>
  </template>
  <div v-else>
    Loading
  </div>
</template>

<script lang="ts" setup>
import { gql, useQuery } from '@urql/vue'
import { MainLaunchpadQueryDocument } from './generated/graphql'
import Wizard from './setup/Wizard.vue'
import GlobalPage from './global/GlobalPage.vue'
import BaseError from './error/BaseError.vue'
import OpenBrowserContainer from './setup/OpenBrowserContainer.vue'
import ChooseTestingTypeContainer from './setup/ChooseTestingTypeContainer.vue'
import HeaderBar from '@cy/gql-components/HeaderBar.vue'

import { useI18n } from '@cy/i18n'

const { t } = useI18n()

gql`
query MainLaunchpadQuery {
  ...TestingTypeCards
  currentProject {
    id
    currentTestingType
  }
  baseError {
    ...BaseError
  }
  wizard {
    ...Wizard
  }
  app {
    isInGlobalMode
  }
  ...GlobalPage
}
`

const query = useQuery({ query: MainLaunchpadQueryDocument })
</script>
