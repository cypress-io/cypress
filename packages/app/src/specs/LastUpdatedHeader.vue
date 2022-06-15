<template>
  <Tooltip
    placement="top"
    :is-interactive="true"
    :hide-delay="0"
    class="bg-white z-10"
  >
    <div
      class="cursor-default decoration-dotted underline underline-gray-300 underline-offset-4"
      tabindex="0"
      data-cy="last-updated-header"
    >
      {{ t('specPage.lastUpdated.header') }}
    </div>
    <template
      #popper
    >
      <div
        class="flex flex-col text-sm text-center max-w-300px p-4 items-center"
      >
        <i18n-t
          v-if="props.isGitAvailable"
          scope="global"
          keypath="specPage.lastUpdated.tooltip.gitInfoAvailable"
        >
          <ExternalLink
            href="https://on.cypress.io/specs-last-updated?utm_medium=Specs+Last+Updated+Tooltip&utm_campaign=Last+Updated"
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
            href="https://on.cypress.io/specs-last-updated?utm_medium=Specs+Last+Updated+Tooltip&utm_campaign=Last+Updated"
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
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import { useI18n } from '@cy/i18n'
const { t } = useI18n()

const props = defineProps<{
  isGitAvailable: boolean
}>()

</script>
