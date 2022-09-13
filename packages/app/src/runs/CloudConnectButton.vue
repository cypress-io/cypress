<template>
  <Button
    :class="props.class"
    :prefix-icon="isLoggedIn ? ChainIcon : UserIcon"
    prefix-icon-class="icon-dark-white icon-light-transparent"
    @click="openConnection"
  >
    {{ isLoggedIn ? t('runs.connect.buttonProject') : t('runs.connect.buttonUser') }}
  </Button>
  <LoginModal
    v-model="isLoginOpen"
    :gql="props.gql"
    :utm-medium="props.utmMedium"
    :show-connect-button-after-login="!cloudProjectId"
    @connect-project="isProjectConnectOpen = true"
  />
  <CloudConnectModals
    v-if="isProjectConnectOpen"
    :show="isProjectConnectOpen"
    :gql="props.gql"
    :utm-medium="props.utmMedium"
    @cancel="isProjectConnectOpen = false"
    @success="isProjectConnectOpen = false; emit('success')"
  />
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { gql } from '@urql/vue'
import UserIcon from '~icons/cy/user-outline_x16.svg'
import ChainIcon from '~icons/cy/chain-link_x16.svg'
import Button from '@cy/components/Button.vue'
import CloudConnectModals from './modals/CloudConnectModals.vue'
import LoginModal from '@cy/gql-components/topnav/LoginModal.vue'
import { useI18n } from '@cy/i18n'
import type { CloudConnectButtonFragment } from '../generated/graphql'

const { t } = useI18n()

gql`
fragment CloudConnectButton on Query {
  currentProject {
    id
    config
  }
  ...CloudConnectModals
  ...LoginModal
}
`

const emit = defineEmits<{
  (event: 'success'): void
}>()

const props = defineProps<{
  gql: CloudConnectButtonFragment
  class?: string
  utmMedium: string
}>()

const isLoginOpen = ref(false)
const isProjectConnectOpen = ref(false)
const isLoggedIn = computed(() => Boolean(props.gql.cloudViewer?.id))

function openConnection () {
  if (!isLoggedIn.value) {
    // start logging in the user
    isLoginOpen.value = true
  } else {
    // if user is already logged in connect a cloud project
    isProjectConnectOpen.value = true
  }
}

const cloudProjectId = computed(() => {
  return props.gql?.currentProject?.config?.find((item: { field: string }) => item.field === 'projectId')?.value
})

</script>
