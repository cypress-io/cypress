<template>
  <div
    v-if="baseError"
    class="pt-[16px] min-w-[476px] max-w-[848px] m-auto"
  >
    <div>
      <div class="pb-[24px] text-center">
        <h1
          v-if="baseError.title"
          class="font-medium leading-snug text-[32px] text-gray-900"
          data-cy="error-header"
        >
          <slot name="header">
            {{ baseError.title }}
          </slot>
        </h1>

        <div
          v-if="showButtons"
          class="font-medium w-full pt-[12px] gap-4 inline-flex justify-center "
        >
          <Button
            variant="outline"
            data-testid="error-retry-button"
            :prefix-icon="RestartIcon"
            prefix-icon-class="icon-dark-indigo-500"
            @click="emit('retry', baseError.id)"
          >
            {{ t('launchpadErrors.generic.retryButton') }}
          </Button>

          <Button
            variant="outline"
            data-testid="error-docs-button"
            :prefix-icon="BookIcon"
            prefix-icon-class="icon-dark-indigo-500 group-hocus:icon-dark-indigo-500 group-hocus:icon-light-indigo-50"
            :href="t(`launchpadErrors.generic.docsButton.${docsType}.link`)"
          >
            {{ t(`launchpadErrors.generic.docsButton.${docsType}.text`) }}
          </Button>
        </div>
      </div>

      <!-- eslint-disable vue/multiline-html-element-content-newline  -->

      <slot name="message">
        <Alert
          :title="baseError.errorName"
          status="error"
          body-class="px-[0px] bg-red-50"
          alert-class="bg-red-50"
          header-class="bg-red-100 text-red-600 rounded-b-none"
          :icon="ErrorOutlineIcon"
          icon-classes="icon-dark-red-400"
          max-height="none"
        >
          <div class="border-b border-b-red-100 p-[16px] pt-0">
            <div
              ref="markdownTarget"
              class="text-red-500"
              data-testid="error-message"
              v-html="markdown"
            />
            <ErrorCodeFrame
              v-if="baseError.codeFrame"
              :gql="baseError.codeFrame"
            />
          </div>
          <div
            class="m-[16px] mb-0 overflow-hidden"
          >
            <Collapsible
              disable
              max-height="none"
              :initially-open="baseError.isUserCodeError"
            >
              <template #target="{open, toggle}">
                <p
                  class="gap-[8px] inline-flex items-center justify-center"
                  :class="{'pb-[8px]': open}"
                  :data-cy="`stack-open-${open}`"
                >
                  <i-cy-chevron-right-small_x16
                    class="min-w-[8px] min-h-[8px] transform duration-150 icon-dark-red-400"
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
                data-testid="error-header"
                tabindex="0"
                class="bg-white rounded font-light border border-red-200 p-[16px] overflow-auto"
                v-html="baseError.errorStack"
              />
            </Collapsible>
          </div>
        </Alert>
      </slot>
      <!-- eslint-enable vue/multiline-html-element-content-newline  -->

      <slot name="stack" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { gql } from '@urql/vue'
import Button from '@cy/components/Button.vue'
import { useI18n } from '@cy/i18n'
import type { BaseErrorFragment } from '../../generated/graphql'
import Alert from '@cy/components/Alert.vue'
import Collapsible from '@cy/components/Collapsible.vue'
import { useMarkdown } from '../../composables/useMarkdown'
import RestartIcon from '~icons/cy/restart_x16.svg'
import ErrorOutlineIcon from '~icons/cy/status-errored-outline_x16.svg'
import ErrorCodeFrame from './ErrorCodeFrame.vue'
import BookIcon from '~icons/cy/book_x16'

gql`
fragment BaseError on ErrorWrapper {
  id
  title
  errorName
  errorStack
  errorType
  errorMessage
  isUserCodeError
  codeFrame {
    ...ErrorCodeFrame
  }
}
`

const { t } = useI18n()

const props = withDefaults(defineProps<{
  gql: BaseErrorFragment
  showButtons?: boolean
}>(), { showButtons: true })

const emit = defineEmits<{
  (e: 'retry', id: string): void
}>()

const markdownTarget = ref()
const baseError = computed(() => props.gql)
const { markdown } = useMarkdown(markdownTarget, computed(() => props.gql.errorMessage), { classes: { code: ['bg-error-200'] } })

const getDocsType = (): string => {
  const { errorType, errorStack } = baseError.value

  // Full list of errors lives in "packages/errors/src/errors.ts", but cannot be imported to Vue
  switch (true) {
    case errorStack.startsWith('UNKNOWN'):
      return 'docsHomepage'
    case errorType.includes('RECORD'):
    case errorType.includes('PROJECT'):
    case errorType.includes('CLOUD'):
    case errorType.includes('PLAN'):
      return 'cloudGuide'
    default:
      return 'configGuide'
  }
}

const docsType: string = getDocsType()

</script>
