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
      Last updated
      <i-cy-circle-bg-question-mark_x16 class="ml-1 icon-dark-indigo-500 icon-light-indigo-100" />
    </button>
    <template
      #popper
    >
      <div
        class="flex flex-col text-sm text-center max-w-[300px] p-4 items-center"
      >
        <!-- eslint-disable vue/multiline-html-element-content-newline -->
        <template v-if="props.isGitAvailable">
          <ExternalLink
            :href="docsUrl"
            class="font-medium text-indigo-500 contents group-hocus:text-indigo-600"
          >Git status</ExternalLink> of the spec files within this project</template>
        <template v-else>Cypress is unable to detect <ExternalLink
          :href="docsUrl"
          class="font-medium text-indigo-500 contents group-hocus:text-indigo-600"
        >git info</ExternalLink> for this project and has defaulted to showing file system data instead</template>
        <!-- eslint-enable vue/multiline-html-element-content-newline -->
      </div>
    </template>
  </Tooltip>
</template>

<script setup lang="ts">
import Tooltip from '@packages/frontend-shared/src/components/Tooltip.vue'
import { getUrlWithParams } from '@packages/frontend-shared/src/utils/getUrlWithParams'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'

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
