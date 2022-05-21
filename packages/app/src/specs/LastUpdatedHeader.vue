<template>
  <Tooltip
    placement="top"
    :is-interactive="true"
  >
    <div class="decoration-dashed underline underline-gray-300 underline-offset-4">
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
            href="https://on.cypress.io/git-status"
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
            href="https://on.cypress.io/git-info"
            class="font-medium text-indigo-500 contents group-hocus:text-indigo-600"
          >
            {{ t('specPage.lastUpdated.tooltip.gitInfo') }}
          </ExternalLink>
        </i18n-t>
        <!-- <i18n-t
          v-else
          keypath="specPage.lastUpdated.tooltip.gitInfoUnavailable"
        >
          http://google.com
        </i18n-t> -->
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
