<template>
  <div class="flex bg-gray-50 h-65px py-12px px-17px text-gray-800 items-center">
    <div>
      <Icon
        name="general-grid-2x2"
        size="16"
      />
    </div>
    <div class="ml-15px">
      {{ t("setupPage.projectSetup.frameworkNotListed") }}
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
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import ExternalLink from '@packages/frontend-shared/src/gql-components/ExternalLink.vue'
import Icon from '@cypress-design/vue-icon'

const { t } = useI18n()

</script>
