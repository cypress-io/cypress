<template>
  <Button
    :class="props.class"
    :prefix-icon="user.isLoggedIn ? ChainIcon : CypressIcon"
    prefix-icon-class="icon-dark-white icon-light-transparent"
    @click="openLoginConnectModal({ utmMedium: utmMedium, utmContent: utmContent })"
  >
    {{ user.isLoggedIn ? t('runs.connect.buttonProject') : t('runs.connect.buttonUser') }}
  </Button>
</template>

<script lang="ts" setup>

import ChainIcon from '~icons/cy/chain-link_x16.svg'
import CypressIcon from '~icons/cy/cypress-logo_x16.svg'
import Button from '@cy/components/Button.vue'
import { useI18n } from '@cy/i18n'
import { useLoginConnectStore } from '@packages/frontend-shared/src/store/login-connect-store'

const { openLoginConnectModal, user } = useLoginConnectStore()

const { t } = useI18n()

const props = defineProps<{
  class?: string
  utmMedium: string
  utmContent?: string
}>()

</script>
