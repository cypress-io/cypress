<template>
  <div class="max-w-565px min-w-476px mx-auto mt-40px space-y-32px children:text-center text-center">
    <div>
      <h1
        class="text-32px font-medium text-gray-900 leading-snug"
        data-testid="error-header"
      >
        <slot name="header">
          {{ headerText }}
        </slot>
      </h1>
      <!-- eslint-disable vue/multiline-html-element-content-newline  -->

      <slot name="message">
        <!-- Can't pull this out because of the i18n-t component -->
        <p
          v-if="errorMessage"
          class="font-light"
        >
          {{ errorMessage }}
        </p>
        <i18n-t
          v-else
          keypath="launchpadErrors.generic.message"
          tag="p"
          class="font-light"
          data-testid="error-message"
        >
          <OpenConfigFileInIDE />
        </i18n-t>
      </slot>
      <!-- eslint-enable vue/multiline-html-element-content-newline  -->

      <slot name="stack">
        <p
          v-if="stack"
          class="font-light"
        >
          {{ stack }}
        </p>
      </slot>
    </div>
    <i-cy-placeholder_x48 class="w-120px h-120px mx-auto my-0 icon-light-gray-50 icon-dark-gray-200" />
    <div class="inline-flex gap-16px justify-between">
      <slot name="footer">
        <Button
          v-if="retry"
          size="lg"
          variant="primary"
          data-testid="error-retry-button"
          @click="retry"
        >
          {{ t('launchpadErrors.generic.retryButton') }}
        </Button>
        <Button
          size="lg"
          variant="outline"
          data-testid="error-read-the-docs-button"
          @click="openDocs"
        >
          {{ t('launchpadErrors.generic.readTheDocsButton') }}
        </Button>
      </slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { gql } from '@urql/vue'
import Button from '@cy/components/Button.vue'
import { computed } from 'vue'
import { useI18n } from '@cy/i18n'
import type { BaseError_DataFragment } from '../generated/graphql'

gql`
fragment BaseError_Data on BaseError {
  title
  message
  stack
}
`

const openDocs = () => {
  document.location.href = 'https://on.cypress.io'
}

const { t } = useI18n()

const props = defineProps<{
  gql: BaseError_DataFragment
  retry?: () => void
  onReadDocs?: () => void
}>()

const headerText = computed(() => props.gql.title ?? t('launchpadErrors.generic.header'))
const errorMessage = computed(() => props.gql.message ?? null)
const stack = computed(() => props.gql.stack ?? null)

</script>
