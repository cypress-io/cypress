<template>
  <Dialog
    :open="modelValue"
    class="fixed inset-0 z-10 overflow-y-auto"
    @close="setIsOpen"
  >
    <div class="flex items-center justify-center min-h-screen">
      <DialogOverlay class="fixed inset-0 bg-gray-800 opacity-90" />

      <div class="relative w-480px mx-auto bg-white rounded">
        <div class="border-b-1px min-h-64px flex justify-between items-center px-24px">
          <DialogTitle class="text-gray-900 text-18px">
            {{ title }}
          </DialogTitle>
          <button
            aria-label="Close"
            class="hocus-default"
            @click="setIsOpen(false)"
          >
            <i-cy-delete_x12 class="icon-dark-gray-400 w-12px h-12px" />
          </button>
        </div>

        <DialogDescription class="p-24px text-gray-700 font-normal">
          <i18n-t
            v-if="!viewer"
            scope="global"
            keypath="topNav.login.bodyInitial"
          >
            <ExternalLink
              href="https://on.cypress.io/dashboard"
            >
              {{ t('topNav.login.dashboard') }}
            </ExternalLink>
          </i18n-t>
          <i18n-t
            v-else-if="viewer"
            scope="global"
            keypath="topNav.login.bodySuccess"
          >
            <ExternalLink
              href="https://on.cypress.io/dashboard/profile"
              class="text-indigo-500 font-medium"
            >
              {{ viewer.fullName }}
            </ExternalLink>
          </i18n-t>
        </DialogDescription>

        <div class="border-t-1px px-24px py-16px bg-gray-50">
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

import {
  Dialog,
  DialogOverlay,
  DialogTitle,
  DialogDescription,
} from '@headlessui/vue'

import type { LoginModalFragment } from '../../generated/graphql'

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
    email
    fullName
  }
  isAuthBrowserOpened
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

export type { LoginModalFragment }

</script>
