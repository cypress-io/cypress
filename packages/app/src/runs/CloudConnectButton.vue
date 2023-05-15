<template>
  <Button
    size="32"
    class="gap-[8px]"
    :class="props.class"
    @click="openLoginConnectModal({ utmMedium: utmMedium, utmContent: utmContent })"
  >
    <IconObjectChainLink v-if="user.isLoggedIn" />
    <IconTechnologyCypress v-else />
    {{ user.isLoggedIn ? t('runs.connect.buttonProject') : t('runs.connect.buttonUser') }}
  </Button>
</template>

<script lang="ts" setup>

import Button from '@cypress-design/vue-button'
import { IconObjectChainLink, IconTechnologyCypress } from '@cypress-design/vue-icon'
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
