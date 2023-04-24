<template>
  <Tooltip
    placement="top"
    :is-interactive="true"
    show-group="last-updated-header"
    :show-delay="250"
  >
    <button
      type="button"
      class="cursor-default flex font-medium items-center decoration-dotted underline decoration-gray-300 underline-offset-4"
      data-cy="last-updated-header"
    >
      {{ t('specPage.lastUpdated.header') }}
      <i-cy-circle-bg-question-mark_x16 class="ml-1 icon-dark-indigo-500 icon-light-indigo-100" />
    </button>
    <template
      #popper
    >
      <div
        class="flex flex-col text-sm text-center max-w-[300px] p-4 items-center"
      >
        <i18n-t
          v-if="props.isGitAvailable"
          scope="global"
          keypath="specPage.lastUpdated.tooltip.gitInfoAvailable"
        >
          <ExternalLink
            :href="docsUrl"
            class="font-medium text-indigo-500 contents group-hocus:text-indigo-600"
          >
            {{ t('specPage.lastUpdated.tooltip.gitStatus') }}
          </ExternalLink>
        </i18n-t>

        <i18n-t
          v-else
          scope="global"
          keypath="specPage.lastUpdated.tooltip.gitInfoUnavailable"
        >
          <ExternalLink
            :href="docsUrl"
            class="font-medium text-indigo-500 contents group-hocus:text-indigo-600"
          >
            {{ t('specPage.lastUpdated.tooltip.gitInfo') }}
          </ExternalLink>
        </i18n-t>
      </div>
    </template>
  </Tooltip>
</template>

<script setup lang="ts">
import Tooltip from '@packages/frontend-shared/src/components/Tooltip.vue'
import { getUrlWithParams } from '@packages/frontend-shared/src/utils/getUrlWithParams'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import { useI18n } from '@cy/i18n'
const { t } = useI18n()

const props = defineProps<{
  isGitAvailable: boolean
}>()

const docsUrl = getUrlWithParams({
  url: 'https://on.cypress.io/specs-last-updated',
  params: {
    utm_medium: 'Specs Last Updated Tooltip',
    utm_campaign: 'Last Updated',
  },
})

</script>
