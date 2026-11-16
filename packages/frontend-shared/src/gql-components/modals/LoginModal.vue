<template>
  <Dialog
    open
    class="inset-0 z-50 fixed overflow-y-auto"
    @close="cancelLogin"
  >
    <div class="flex min-h-screen items-center justify-center">
      <DialogOverlay class="bg-gray-800 opacity-90 inset-0 fixed" />

      <div class="bg-white rounded mx-auto min-w-[480px] max-w-[600px] relative">
        <StandardModalHeader
          help-link="https://on.cypress.io"
          help-text="Need help"
          @close="cancelLogin"
        >
          {{ title }}
        </StandardModalHeader>

        <NoInternetConnection
          v-if="!isOnline"
          class="mt-[24px]"
        />
        <DialogDescription
          v-else-if="isOnline"
          class="font-normal p-[24px] text-gray-700"
        >
          <template v-if="!viewer && !error">
            <!-- eslint-disable-next-line vue/singleline-html-element-content-newline -->
            Logging in gives you access to <ExternalLink :href="cloudIntroductionUrl">Cypress Cloud</ExternalLink>. You can set up projects to be recorded and see test data from your project.
          </template>
          <template v-else-if="viewer">
            You are now logged in as <ExternalLink
              :href="cloudProfileUrl"
              class="font-medium text-indigo-500"
            >
              {{ viewer.fullName || viewer.email }}
            </ExternalLink>.
          </template>
          <div v-else-if="error === 'AUTH_COULD_NOT_LAUNCH_BROWSER'">
            <div
              class="rounded flex font-medium bg-red-100 mb-[20px] p-[16px] text-red-600 gap-[8px] items-center"
            >
              <i-cy-errored-outline_x16 class="h-[16px] min-w-[16px] w-[16px] icon-dark-red-400" />
              The browser could not be opened.
            </div>
            Cypress was unable to open your installed browser. To continue logging in, please paste this URL into your web browser:

            <CopyText
              v-if="props.gql.authState.message"
              class="mt-[12px]"
              :text="props.gql.authState.message"
            />
          </div>
          <div v-else-if="error === 'AUTH_ERROR_DURING_LOGIN'">
            An error occurred while attempting to log in:
            <div
              class="rounded flex bg-red-100 mt-[16px] p-[16px] text-red-600 gap-[8px] items-center"
            >
              <i-cy-errored-outline_x16 class="h-[16px] min-w-[16px] w-[16px] icon-dark-red-400" />
              {{ props.gql.authState.message }}
            </div>
          </div>
        </DialogDescription>
        <div
          class="bg-gray-50 border-t-[1px] py-[16px] px-[24px]"
          :class="{ 'hidden': !showFooter }"
        >
          <Auth
            :gql="props.gql"
            :auth-flow="props.authFlow"
            :auto-start-auth="props.autoStartAuth"
            :show-retry="!!error"
            :utm-medium="props.utmMedium"
            :utm-content="props.utmContent"
            @close="emit('close')"
            @cancel="emit('cancel')"
          />
        </div>
      </div>
    </div>
  </Dialog>
</template>
<script setup lang="ts">
import { gql } from '@urql/core'
import { computed } from 'vue'
import Auth from '../Auth.vue'
import ExternalLink from '../ExternalLink.vue'
import { useOnline } from '@vueuse/core'
import NoInternetConnection from '../../components/NoInternetConnection.vue'
import CopyText from '@cy/components/CopyText.vue'
import StandardModalHeader from '@cy/components/StandardModalHeader.vue'
import { hideAllPoppers } from 'floating-vue'
import { getUrlWithParams } from '../../utils/getUrlWithParams'

import {
  Dialog,
  DialogOverlay,
  DialogDescription,
} from '@headlessui/vue'

import type { LoginModalFragment } from '../../generated/graphql'
import type { AuthFlow } from '../../store/user-project-status-store'

const online = useOnline()

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'cancel'): void
}>()

const props = withDefaults(defineProps<{
  gql: LoginModalFragment
  authFlow?: AuthFlow
  utmMedium: string
  utmContent?: string
  autoStartAuth?: boolean
}>(), {
  authFlow: 'login',
  utmContent: undefined,
  autoStartAuth: true,
})

gql`
fragment LoginModal on Query {
  ...Auth
}
`

hideAllPoppers()

const viewer = computed(() => props.gql?.cloudViewer)

const utmParams = computed(() => {
  return {
    utm_medium: props.utmMedium,
    ...(props.utmContent ? { utm_content: props.utmContent } : {}),
  }
})

const cloudIntroductionUrl = computed(() => {
  return getUrlWithParams({
    url: 'https://on.cypress.io/dashboard-introduction',
    params: { ...utmParams.value, utm_campaign: 'Cypress Cloud' },
  })
})

const cloudProfileUrl = computed(() => {
  return getUrlWithParams({
    url: 'https://on.cypress.io/dashboard/profile',
    params: { ...utmParams.value, utm_campaign: 'Profile' },
  })
})

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
    return 'Login successful'
  }

  if (error.value === 'AUTH_COULD_NOT_LAUNCH_BROWSER') {
    return 'Browser error'
  }

  if (error.value === 'AUTH_ERROR_DURING_LOGIN') {
    return 'Login failed'
  }

  return 'Continue in your browser'
})

const isOnline = computed(() => online.value)

const cancelLogin = () => {
  emit('cancel')
}

</script>
