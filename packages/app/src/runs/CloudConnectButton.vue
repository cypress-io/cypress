<template>
  <CloudViewerAndProject
    v-slot="{status}"
    :gql="props.gql"
  >
    <Button
      :class="props.class"
      :prefix-icon="status?.isLoggedIn ? ChainIcon : UserIcon"
      prefix-icon-class="icon-dark-white icon-light-transparent"
      @click="openLoginConnectModal({ utmMedium: props.utmMedium })"
    >
      {{ status?.isLoggedIn ? t('runs.connect.buttonProject') : t('runs.connect.buttonUser') }}
    </Button>
  </CloudViewerAndProject>
</template>

<script lang="ts" setup>
import { gql } from '@urql/vue'
import type { CloudConnectButtonFragment } from '../generated/graphql'

import UserIcon from '~icons/cy/user-outline_x16.svg'
import ChainIcon from '~icons/cy/chain-link_x16.svg'
import Button from '@cy/components/Button.vue'
import { useI18n } from '@cy/i18n'
import { useLoginConnectStore } from '@packages/frontend-shared/src/store/login-connect-store'
import CloudViewerAndProject from '@cy/gql-components/CloudViewerAndProject.vue'

const { openLoginConnectModal } = useLoginConnectStore()

const { t } = useI18n()

gql`
fragment CloudConnectButton on Query {
  ...CloudViewerAndProject
}
`

const props = defineProps<{
  gql: CloudConnectButtonFragment
  class?: string
  utmMedium: string
}>()

</script>
