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
            class="w-960px"
          >
            <template #title>
              Key Differences
            </template>
            <div class="flex justify-around text-center">
              <div class="w-full border-r p-24px">
                <h3>E2E</h3>

                <ul class="text-left">
                  <li>visit</li>
                  <li>test flow</li>
                  <li>ideal for cd</li>
                </ul>
                <h3>Code Example</h3>
                <InlineCodeEditor
                  v-model="code"
                  class="max-w-400px"
                  readonly
                />
              </div>
              <div class="w-full border-l p-24px">
                Component
              </div>
            </div>
          </StandardModal>
          <button
            class="mx-auto text-indigo-500 text-18px"
            @click="isTestingTypeModalOpen = true"
          >
            {{ t('welcomePage.review') }}
          </button>
          <TestingTypeCards :gql="query.data.value" />
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
import { useI18n } from '@cy/i18n'
import { ref } from 'vue'
import InlineCodeEditor from './components/code/InlineCodeEditor.vue'

const { t } = useI18n()
const isTestingTypeModalOpen = ref(false)
const code = 'let code = \'here\''

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
  }
  ...HeaderBar
}
`

const query = useQuery({ query: MainLaunchpadQueryDocument })
</script>
