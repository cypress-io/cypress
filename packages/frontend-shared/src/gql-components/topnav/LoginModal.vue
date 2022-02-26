<template>
  <Dialog
    :open="modelValue"
    class="inset-0 z-50 fixed overflow-y-auto"
    @close="setIsOpen"
  >
    <div class="flex min-h-screen items-center justify-center">
      <DialogOverlay class="bg-gray-800 opacity-90 inset-0 fixed" />

      <div class="bg-white rounded mx-auto min-w-480px max-w-600px relative">
        <StandardModalHeader
          help-link="https://on.cypress.io"
          :help-text="t('links.needHelp')"
          @close="setIsOpen(false)"
        >
          {{ title }}
        </StandardModalHeader>

        <NoInternetConnection
          v-if="!isOnline"
          class="mt-24px"
        />
        <DialogDescription
          v-else-if="isOnline"
          class="font-normal p-24px text-gray-700"
        >
          <i18n-t
            v-if="!viewer && !error"
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
          <div v-else-if="error === 'AUTH_COULD_NOT_LAUNCH_BROWSER'">
            <div
              class="rounded flex font-medium bg-red-100 mb-20px p-16px text-red-600 gap-8px items-center"
            >
              <i-cy-errored-outline_x16 class="h-16px min-w-16px w-16px icon-dark-red-400" />
              {{ t('topNav.login.bodyBrowserError') }}
            </div>
            {{ t('topNav.login.bodyBrowserErrorDetails') }}

            <CopyText
              v-if="props.gql.authState.message"
              class="mt-12px"
              :text="props.gql.authState.message"
            />
          </div>
          <div v-else-if="error === 'AUTH_ERROR_DURING_LOGIN'">
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
          v-if="showFooter"
          class="bg-gray-50 border-t-1px py-16px px-24px"
        >
          <Auth
            :gql="props.gql"
            :show-retry="!!error"
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
import CopyText from '@cy/components/CopyText.vue'
import StandardModalHeader from '@cy/components/StandardModalHeader.vue'
import { useMutation } from '@urql/vue'
import { LoginModal_ResetAuthStateDocument } from '../../generated/graphql'

import {
  Dialog,
  DialogOverlay,
  DialogDescription,
} from '@headlessui/vue'

import type { LoginModalFragment } from '../../generated/graphql'

const online = useOnline()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const props = defineProps<{
  modelValue: boolean
  gql: LoginModalFragment
}>()

gql`
fragment LoginModal on Query {
  ...Auth
}
`

gql`
mutation LoginModal_ResetAuthState {
  resetAuthState {
    ...Auth
  }
}
`

const resetAuth = useMutation(LoginModal_ResetAuthStateDocument)

const setIsOpen = (value: boolean) => {
  emit('update:modelValue', value)
  if (!value) {
    resetAuth.executeMutation({})
  }
}
const { t } = useI18n()

const viewer = computed(() => props.gql?.cloudViewer)

const error = computed(() => {
  const { name } = props.gql.authState

  if (name !== 'AUTH_BROWSER_LAUNCHED') {
    return name
  }

  return null
})

const showFooter = computed(() => error.value !== 'AUTH_COULD_NOT_LAUNCH_BROWSER')

const title = computed(() => {
  if (viewer.value) {
    return t('topNav.login.titleSuccess')
  }

  if (error.value === 'AUTH_COULD_NOT_LAUNCH_BROWSER') {
    return t('topNav.login.titleBrowserError')
  }

  if (error.value === 'AUTH_ERROR_DURING_LOGIN') {
    return t('topNav.login.titleFailed')
  }

  return t('topNav.login.titleInitial')
})

const isOnline = computed(() => online.value)

</script>
