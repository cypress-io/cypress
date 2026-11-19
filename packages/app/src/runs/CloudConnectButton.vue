<template>
  <Button
    :class="props.class"
    :prefix-icon="user.isLoggedIn ? ChainIcon : CypressIcon"
    prefix-icon-class="icon-dark-white icon-light-transparent"
    @click="openLoginConnectModal({ utmMedium: utmMedium, utmContent: utmContent })"
  >
    {{ user.isLoggedIn ? 'Connect a Cypress Cloud project' : 'Connect to Cypress Cloud' }}
  </Button>
</template>

<script lang="ts" setup>

import ChainIcon from '~icons/cy/chain-link_x16.svg'
import CypressIcon from '~icons/cy/cypress-logo_x16.svg'
import Button from '@cy/components/Button.vue'
import { useUserProjectStatusStore } from '@packages/frontend-shared/src/store/user-project-status-store'

const { openLoginConnectModal, user } = useUserProjectStatusStore()

const props = defineProps<{
  class?: string
  utmMedium: string
  utmContent?: string
}>()

</script>
