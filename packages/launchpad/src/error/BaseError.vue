<template>
  <div class="mx-auto space-y-32px mt-40px text-center min-w-476px max-w-565px">
    <div>
      <h1
        class="font-medium leading-snug text-32px text-gray-900"
        data-testid="error-header"
      >
        <slot name="header">
          {{ headerText }}
        </slot>
      </h1>
      <slot name="message">
        <!-- Can't pull this out because of the i18n-t component -->

        <i18n-t
          keypath="launchpadErrors.generic.message"
          tag="p"
          class="font-light"
          data-testid="error-message"
        >
          <OpenConfigFileInIDE :gql="props.gql" />
        </i18n-t>
      </slot>
    </div>
    <Alert
      v-if="stack"
      type="error"
      class="mt-16px text-left"
      data-testid="error-alert"
      :stack-trace="stack"
    >
      <p
        v-if="errorMessage"
        ref="markdownTarget"
        class="font-light text-left"
        v-html="errorMessageRendered"
      />
    </Alert>
    <div class="gap-16px inline-flex justify-between">
      <slot name="footer">
        <Button
          v-if="lastMutationDefined"
          size="lg"
          variant="primary"
          data-testid="error-retry-button"
          @click="retry()"
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
import { computed, ref } from 'vue'
import { useI18n } from '@cy/i18n'
import type { BaseErrorFragment } from '../generated/graphql'
import { useMarkdown } from '@packages/frontend-shared/src/composables/useMarkdown'
import Alert from '@cy/components/Alert.vue'
import OpenConfigFileInIDE from '@cy/gql-components/OpenConfigFileInIDE.vue'

gql`
fragment BaseError on Query {
  baseError {
    title
    message
    stack
  }
  ...OpenConfigFileInIDE
}
`

const openDocs = () => {
  document.location.href = 'https://on.cypress.io'
}

const { t } = useI18n()

const props = defineProps<{
  gql: BaseErrorFragment
}>()

const markdownTarget = ref()
const { markdown: errorMessageRendered } = useMarkdown(markdownTarget, props.gql.message || '', { classes: { code: ['bg-error-200 text-error-600 py-0'] } })

const latestOperation = window.localStorage.getItem('latestGQLOperation')

const retry = async () => {
  const { getLaunchpadClient } = await import('../main')
  const launchpadClient = getLaunchpadClient()

  const op = latestOperation ? JSON.parse(latestOperation) : null

  return launchpadClient.reexecuteOperation(
    launchpadClient.createRequestOperation('mutation', op, {
      requestPolicy: 'cache-and-network',
    }),
  )
}

const headerText = computed(() => props.gql.baseError?.title ? props.gql.baseError.title : t('launchpadErrors.generic.header'))
const errorMessage = computed(() => props.gql?.baseError?.message ? props.gql.baseError.message : null)
const stack = computed(() => props.gql?.baseError?.stack ? props.gql.baseError.stack : null)
const lastMutationDefined = computed(() => {
  return Boolean(latestOperation)
})
</script>
