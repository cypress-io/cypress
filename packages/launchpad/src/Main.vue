<template>
  <template v-if="query.data.value">
    <HeaderBar :gql="query.data.value" />
    <div class="max-content">
      <template v-if="query.error.value">
        <BaseError />
      </template>
      <template
        v-else-if="query.data.value.app.isInGlobalMode && !query.data.value?.app.activeProject"
      >
        <GlobalPage :gql="query.data.value.app" />
      </template>

      <template v-else>
        <template v-if="query.data.value?.wizard.step === 'welcome'">
          <WizardHeader :gql="query.data.value.wizard" />
          <StandardModal
            v-model="isTestingTypeModalOpen"
            modal-classes="w-960px"
          >
            <template #title>
              Key Differences
            </template>

            <CompareTestingTypes />
          </StandardModal>
          <button
            class="block mx-auto text-indigo-500 text-18px focus:outline-transparent hocus:underline group"
            @click="isTestingTypeModalOpen = true"
          >
            {{ t('welcomePage.review') }}<i-cy-arrow-right_x16
              class="inline-block transition-transform duration-200 ease-in transform -translate-y-1px ml-4px icon-dark-current group-hocus:translate-x-2px"
            />
          </button>
          <TestingTypeCards
            :gql="query.data.value"
            @open-compare="isTestingTypeModalOpen = true"
          />
        </template>
        <Wizard
          v-else
          :gql="query.data.value"
        />
      </template>
    </div>
  </template>
  <div v-else>
    Loading
  </div>
</template>

<script lang="ts" setup>
import { gql, useQuery } from '@urql/vue'
import { MainLaunchpadQueryDocument } from './generated/graphql'
import TestingTypeCards from './setup/TestingTypeCards.vue'
import Wizard from './setup/Wizard.vue'
import WizardHeader from './setup/WizardHeader.vue'
import HeaderBar from './layouts/HeaderBar.vue'
import GlobalPage from './global/GlobalPage.vue'
import BaseError from './error/BaseError.vue'
import StandardModal from '@cy/components/StandardModal.vue'
import CompareTestingTypes from './setup/CompareTestingTypes.vue'
import { useI18n } from '@cy/i18n'
import { ref } from 'vue'

const { t } = useI18n()
const isTestingTypeModalOpen = ref(false)

gql`
query MainLaunchpadQuery {
  ...TestingTypeCards
  ...Wizard

  wizard {
    canNavigateForward
    ...WizardHeader
  }

  app {
    isInGlobalMode
    ...GlobalPage
    ...WelcomeGuide
  }
  ...HeaderBar
}
`

const query = useQuery({ query: MainLaunchpadQueryDocument })
</script>
