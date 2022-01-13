<template>
  <Dialog
    :open="modelValue"
    class="inset-0 z-50 fixed overflow-y-auto"
    @close="setIsOpen"
  >
    <div class="flex min-h-screen items-center justify-center">
      <DialogOverlay class="bg-gray-800 opacity-90 inset-0 fixed" />

      <div class="bg-white rounded mx-auto w-480px relative">
        <div class="flex border-b-1px min-h-64px px-24px justify-between items-center">
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
            v-if="!viewer"
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
        </DialogDescription>

        <div class="bg-gray-50 border-t-1px py-16px px-24px">
          <Auth
            :gql="props.gql"
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

const title = computed(() => {
  if (viewer.value) {
    return t('topNav.login.titleSuccess')
  }

  return t('topNav.login.titleInitial')
})

const isOnline = computed(() => online.value)

export type { LoginModalFragment }

</script>
