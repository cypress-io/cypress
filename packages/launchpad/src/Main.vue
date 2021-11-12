<template>
  <template v-if="data">
    <HeaderBar />
    <div class="p-24px">
      <template v-if="data.baseError">
        <BaseError :gql="data.baseError" />
      </template>
      <GlobalPage
        v-else-if="!data?.currentProject"
        :gql="data"
      />
      <Spinner v-else-if="data.currentProject.isLoadingConfig" />
      <ChooseTestingTypeContainer
        v-else-if="!data.currentProject?.currentTestingType"
      />
      <Wizard
        v-else-if="data.currentProject.needsOnboarding"
        :gql="data"
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
import Spinner from '@cy/components/Spinner.vue'

import { useI18n } from '@cy/i18n'
import { computed } from 'vue-demi'

const { t } = useI18n()

gql`
query MainLaunchpadQuery {
  ...TestingTypeCards
  currentProject {
    id
    currentTestingType
    needsOnboarding
    isLoadingConfig
  }
  baseError {
    ...BaseError
  }
  isInGlobalMode
  ...GlobalPage
  ...Wizard
}
`

const query = useQuery({ query: MainLaunchpadQueryDocument })
const data = computed(() => query.data.value)
</script>
