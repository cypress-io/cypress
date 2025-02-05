<template>
  <AutInfo>
    <Alert
      :title="t('runner.automation.missing.title')"
      status="warning"
      :icon="ErrorOutlineIcon"
      :dismissible="false"
      :overflow="false"
      class="w-full max-w-[600px]"
    >
      <div class="flex flex-col gap-[16px]">
        <p>
          {{ t('runner.automation.missing.description') }}
        </p>
        <SpecRunnerDropdown
          v-if="props.gql && selectedBrowser?.displayName"
          align="left"
          class="max-w-max"
          data-cy="select-browser"
        >
          <template #heading>
            <component
              :is="allBrowsersIcons[selectedBrowser.displayName?.toLowerCase()] || allBrowsersIcons.generic"
              class="min-w-[16px] w-[16px]"
            />
            {{ selectedBrowser.displayName }} {{ selectedBrowser.majorVersion }}
          </template>

          <template #default>
            <div class="max-h-[50vh] overflow-auto">
              <VerticalBrowserListItems
                :gql="props.gql"
              />
            </div>
          </template>
        </SpecRunnerDropdown>
        <ExternalLink
          class="mt-[16px] text-indigo-500"
          href="https://on.cypress.io/launching-browsers"
        >
          <i-cy-book_x16 class="ml-[8px] -top-[2px] relative inline-block icon-dark-indigo-500 icon-light-indigo-100" />
          {{ t('runner.automation.shared.link') }}
        </ExternalLink>
      </div>
    </Alert>
  </AutInfo>
</template>

<script setup lang="ts">
import AutInfo from './AutInfo.vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import { gql } from '@urql/core'
import { useI18n } from '@cy/i18n'
import VerticalBrowserListItems from '@cy/gql-components/topnav/VerticalBrowserListItems.vue'
import type { AutomationMissingFragment } from '../../generated/graphql'
import SpecRunnerDropdown from '../SpecRunnerDropdown.vue'
import { ref } from 'vue'
import { allBrowsersIcons } from '@packages/frontend-shared/src/assets/browserLogos'
import Alert from '@packages/frontend-shared/src/components/Alert.vue'
import ErrorOutlineIcon from '~icons/cy/status-errored-outline_x16.svg'

const { t } = useI18n()

gql`
fragment AutomationMissing on CurrentProject {
  id
  ...VerticalBrowserListItems
  activeBrowser {
    id
    displayName
    majorVersion
  }
}
`

const props = withDefaults(defineProps<{ gql: AutomationMissingFragment | null }>(), { gql: null })

// Have to spread gql props since binding it to v-model causes error when testing
const selectedBrowser = ref({ ...props.gql?.activeBrowser })

</script>
