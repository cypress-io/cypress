<template>
  <Dialog
    :open="modelValue"
    class="inset-0 z-50 fixed overflow-y-auto"
    @close="setIsOpen"
  >
    <div class="flex min-h-screen items-center justify-center">
      <DialogOverlay class="bg-gray-800 opacity-90 inset-0 fixed" />

      <div class="bg-white rounded mx-auto min-w-480px max-w-600px relative">
        <div class="flex border-b-1px min-h-55px px-24px justify-between items-center">
          <DialogTitle class="text-gray-900 text-18px">
            {{ title }}
          </DialogTitle>
          <button
            aria-label="Close"
            class="hocus-default"
            @click="setIsOpen(false)"
          >
            <i-cy-delete_x12 class="h-12px w-12px icon-dark-gray-400" />
          </button>
        </div>

        <NoInternetConnection
          v-if="!isOnline"
          class="mt-24px"
        />
        <DialogDescription
          v-else-if="isOnline"
          class="font-normal p-24px text-gray-700"
        >
          <i18n-t
            v-if="!viewer && !errorType"
            scope="global"
            keypath="topNav.login.bodyInitial"
          >
            <ExternalLink
              href="https://on.cypress.io/dashboard"
            >
              {{ t('topNav.login.cloud') }}
            </ExternalLink>
          </i18n-t>
          <i18n-t
            v-else-if="viewer"
            scope="global"
            keypath="topNav.login.bodySuccess"
          >
            <ExternalLink
              href="https://on.cypress.io/dashboard/profile"
              class="font-medium text-indigo-500"
            >
              {{ viewer.fullName || viewer.email }}
            </ExternalLink>
          </i18n-t>
          <div v-else-if="errorType === 'browserError'">
            <div
              class="rounded flex bg-red-100 mb-16px p-16px text-red-600 gap-8px items-center"
            >
              <i-cy-errored-outline_x16 class="h-16px min-w-16px w-16px icon-dark-red-400" />
              {{ t('topNav.login.bodyBrowserError') }}
            </div>
            {{ t('topNav.login.bodyBrowserErrorDetails') }}

            <TerminalPrompt
              v-if="props.gql.authState.message"
              class="mt-16px"
              :project-folder-name="''"
              :command="props.gql.authState.message"
            />
          </div>
          <div v-else-if="errorType === 'loginError'">
            {{ t('topNav.login.bodyError') }}
            <div
              class="rounded flex bg-red-100 mt-16px p-16px text-red-600 gap-8px items-center"
            >
              <i-cy-errored-outline_x16 class="h-16px min-w-16px w-16px icon-dark-red-400" />
              {{ props.gql.authState.message }}
            </div>
          </div>
        </DialogDescription>

        <div
          v-if="errorType !== 'browserError'"
          class="bg-gray-50 border-t-1px py-16px px-24px"
        >
          <Auth
            :gql="props.gql"
            :error-type="errorType"
            @continue="$emit('update:modelValue', false)"
          />
        </div>
      </div>
    </div>
  </Dialog>
</template>
<script setup lang="ts">
import { useI18n } from '@cy/i18n'
import { gql } from '@urql/core'
import { computed } from 'vue'
import Auth from '../Auth.vue'
import ExternalLink from '../ExternalLink.vue'
import { useOnline } from '@vueuse/core'
import NoInternetConnection from '../../components/NoInternetConnection.vue'
import TerminalPrompt from '@cy/components/TerminalPrompt.vue'

import {
  Dialog,
  DialogOverlay,
  DialogTitle,
  DialogDescription,
} from '@headlessui/vue'

import type { LoginModalFragment } from '../../generated/graphql'

const online = useOnline()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const props = defineProps<{
  modelValue: boolean,
  gql: LoginModalFragment
}>()

gql`
fragment LoginModal on Query {
  cloudViewer {
    id
    fullName
  }
  ...Auth
}
`

const setIsOpen = (value: boolean) => {
  emit('update:modelValue', value)
}
const { t } = useI18n()

const viewer = computed(() => props.gql?.cloudViewer)
const errorType = computed(() => {
  const { name } = props.gql.authState

  if (name === 'AUTH_COULD_NOT_LAUNCH_BROWSER') {
    return 'browserError'
  }

  if (name === 'AUTH_ERROR_DURING_LOGIN') {
    return 'loginError'
  }

  return null
})

const title = computed(() => {
  if (viewer.value) {
    return t('topNav.login.titleSuccess')
  }

  if (errorType.value === 'browserError') {
    return t('topNav.login.titleBrowserError')
  }

  if (errorType.value === 'loginError') {
    return t('topNav.login.titleFailed')
  }

  return t('topNav.login.titleInitial')
})

const isOnline = computed(() => online.value)

export type { LoginModalFragment }

</script>
