<template>
  <Button
    :class="props.class"
    size="32"
    @click="openLoginConnectModal({ utmMedium: utmMedium, utmContent: utmContent })"
  >
    <component
      :is="user.isLoggedIn ? ChainIcon : CypressIcon"
      class="icon-dark-white icon-light-transparent mr-[8px]"
    />
    {{ user.isLoggedIn ? t('runs.connect.buttonProject') : t('runs.connect.buttonUser') }}
  </Button>
</template>

<script lang="ts" setup>

import ChainIcon from '~icons/cy/chain-link_x16.svg'
import CypressIcon from '~icons/cy/cypress-logo_x16.svg'
import Button from '@cypress-design/vue-button'
import { useI18n } from '@cy/i18n'
import { useUserProjectStatusStore } from '@packages/frontend-shared/src/store/user-project-status-store'

const { openLoginConnectModal, user } = useUserProjectStatusStore()

const { t } = useI18n()

const props = defineProps<{
  class?: string
  utmMedium: string
  utmContent?: string
}>()

</script>
