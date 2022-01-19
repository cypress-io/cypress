<template>
  <div class="mx-auto space-y-32px text-center min-w-476px max-w-848px pt-16px children:text-center">
    <div>
      <h1
        class="font-medium leading-snug text-32px text-gray-900"
        data-testid="error-header"
      >
        <slot name="header">
          {{ headerText }}
        </slot>
      </h1>
      <!-- eslint-disable vue/multiline-html-element-content-newline  -->

      <slot name="message">
        <!-- Can't pull this out because of the i18n-t component -->
        <i18n-t
          scope="global"
          keypath="launchpadErrors.generic.message"
          tag="p"
          class="font-light pb-24px"
          data-testid="error-message"
        >
          <OpenConfigFileInIDE />
        </i18n-t>
        <Alert
          :title="props.gql.title ?? ''"
          status="error"
          body-class="px-0px bg-red-50"
          alert-class="bg-red-50"
          header-class="bg-red-100 text-red-600 rounded-b-none"
          :icon="ErrorOutlineIcon"
          icon-classes="icon-dark-red-400"
        >
          <p
            v-if="errorMessage"
            class="border-b-1 border-b-red-100 p-16px pt-0 text-red-500"
          >
            {{ errorMessage }}
          </p>
          <p
            v-if="stack"
            class="m-16px mb-0 overflow-hidden"
          >
            <Collapsible
              disable
              max-height="400px"
              initially-open
            >
              <template #target="{open, toggle}">
                <p
                  class="gap-8px inline-flex items-center justify-center"
                  :class="{'pb-8px': open}"
                >
                  <i-cy-chevron-right-small_x16
                    class="min-w-8px min-h-8px transform duration-150 icon-dark-red-400"
                    :class="{'rotate-90': open}"
                  />
                  <a
                    href="#"
                    class="cursor-pointer font-medium outline-none text-red-600 hocus:underline"
                    @click="toggle()"
                    @keypress.space.enter.self.prevent="toggle()"
                  >{{ t('launchpadErrors.generic.stackTraceLabel') }}</a>
                </p>
              </template>
              <pre
                v-if="stack"
                class="bg-white rounded font-light border-1 border-red-200 p-16px overflow-auto"
                v-html="stack"
              />
            </Collapsible>
          </p>
        </Alert>
      </slot>
      <!-- eslint-enable vue/multiline-html-element-content-newline  -->

      <slot name="stack" />
    </div>
    <div class="w-full gap-16px inline-flex">
      <slot name="footer">
        <Button
          v-if="retry"
          size="lg"
          variant="primary"
          data-testid="error-retry-button"
          :prefix-icon="RestartIcon"
          prefix-icon-class="icon-dark-white"
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
import Alert from '@cy/components/Alert.vue'
import OpenConfigFileInIDE from '@packages/frontend-shared/src/gql-components/OpenConfigFileInIDE.vue'
import Collapsible from '@cy/components/Collapsible.vue'
import RestartIcon from '~icons/cy/restart_x16.svg'
import { useExternalLink } from '@packages/frontend-shared/src/gql-components/useExternalLink'
import ErrorOutlineIcon from '~icons/cy/status-errored-outline_x16.svg'

gql`
fragment BaseError_Data on BaseError {
  title
  message
  stack
}
`

const openDocs = useExternalLink('https://on.cypress.io/')

const { t } = useI18n()

const props = defineProps<{
  gql: BaseError_DataFragment
  retry?: () => void
  onReadDocs?: () => void
}>()

const headerText = computed(() => t('launchpadErrors.generic.header'))
const errorMessage = computed(() => props.gql.message ?? null)
const stack = computed(() => props.gql.stack ?? null)

</script>
