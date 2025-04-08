<template role="option">
  <div class="flex bg-gray-50 h-[48px] py-[12px] px-[17px] text-gray-800 items-center">
    <div>
      <Icon
        name="general-grid-2x2"
        size="16"
        stroke-color="gray-500"
        fill-color="gray-100"
      />
    </div>
    <div class="ml-[15px]">
      <ExternalLink
        :href="href"
        class="text-indigo-500 block hocus-link-default group"
      >
        {{ t('setupPage.projectSetup.browseIntegrations') }}<i-cy-arrow-right_x16
          class="ml-[4px] transform transition-transform ease-in translate-y-[-1px] duration-200 inline-block icon-dark-current group-hocus:translate-x-[2px]"
        />
      </ExternalLink>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import ExternalLink from '@packages/frontend-shared/src/gql-components/ExternalLink.vue'
import Icon from '@cypress-design/vue-icon'
import { getUrlWithParams } from '@packages/frontend-shared/src/utils/getUrlWithParams'
import { getUtmSource } from '@packages/frontend-shared/src/utils/getUtmSource'

const { t } = useI18n()

const href = getUrlWithParams({ url: 'https://on.cypress.io/component-integrations', params: {
  utm_medium: 'Select Framework Dropdown',
  utm_source: getUtmSource(),
  utm_campaign: 'Browse third-party frameworks',
} })

</script>
