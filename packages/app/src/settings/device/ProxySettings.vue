<template>
  <SettingsSection>
    <template #title>
      {{ t('settingsPage.proxy.title') }}
    </template>
    <template #description>
      {{ t('settingsPage.proxy.description') }}
    </template>
    <div class="rounded bg-gray-50 border border-gray-100 grid py-[18px] px-[20px] text-[14px] w-[364px] gap-[12px]">
      <div class="flex justify-between">
        <span class="font-medium text-gray-800">{{ t('settingsPage.proxy.proxyServer') }}</span>
        <span
          class="text-gray-500"
          data-testid="proxy-server"
        >{{ props.gql.localSettings.preferences.proxyServer || '-' }}</span>
      </div>
      <div class="flex justify-between">
        <span class="font-medium text-gray-800">{{ t('settingsPage.proxy.bypassList') }}</span>
        <span
          class="text-gray-500"
          data-testid="bypass-list"
        >{{ props.gql.localSettings.preferences.proxyBypass || '-' }}</span>
      </div>
    </div>
  </SettingsSection>
</template>

<script lang="ts" setup>
import SettingsSection from '../SettingsSection.vue'
import { useI18n } from '@cy/i18n'
import { gql } from '@urql/vue'
import type { ProxySettingsFragment } from '../../generated/graphql'

const { t } = useI18n()

gql`
fragment ProxySettings on Query {
  localSettings {
    preferences {
      proxyServer
      proxyBypass
    }
  }
}
`

const props = defineProps<{
  gql: ProxySettingsFragment
}>()
</script>
