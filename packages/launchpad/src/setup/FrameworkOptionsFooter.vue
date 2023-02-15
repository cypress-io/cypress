<template>
  <div class="flex bg-gray-50 h-65px py-12px px-15px text-gray-800 items-center">
    <div><IconComponent class="h-40px min-w-0 min-h-0 w-40px" /></div>
    <div class="ml-10px">
      <div>{{ t("setupPage.projectSetup.frameworkNotListed") }}</div>
      <div>
        <ExternalLink
          href="https://on.cypress.io/component-integrations"
          class="text-indigo-500 block hocus-link-default group"
        >
          {{ t('setupPage.projectSetup.browseIntegrations') }}<i-cy-arrow-right_x16
            class="ml-4px transform transition-transform ease-in -translate-y-1px duration-200 inline-block icon-dark-current group-hocus:translate-x-2px"
          />
        </ExternalLink>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import ExternalLink from '@packages/frontend-shared/src/gql-components/ExternalLink.vue'
import IconComponent from '~icons/cy/testing-type-component_x64.svg'

const { t } = useI18n()

</script>
