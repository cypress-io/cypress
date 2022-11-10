<template>
  <Button
    :class="props.class"
    :prefix-icon="user.isLoggedIn ? ChainIcon : UserIcon"
    prefix-icon-class="icon-dark-white icon-light-transparent"
    @click="openLoginConnectModal({ utmMedium: props.utmMedium })"
  >
    {{ user.isLoggedIn ? t('runs.connect.buttonProject') : t('runs.connect.buttonUser') }}
  </Button>
</template>

<script lang="ts" setup>

import UserIcon from '~icons/cy/user-outline_x16.svg'
import ChainIcon from '~icons/cy/chain-link_x16.svg'
import Button from '@cy/components/Button.vue'
import { useI18n } from '@cy/i18n'
import { useLoginConnectStore } from '@packages/frontend-shared/src/store/login-connect-store'

const { openLoginConnectModal, user } = useLoginConnectStore()

const { t } = useI18n()

const props = defineProps<{
  class?: string
  utmMedium: string
}>()

</script>
