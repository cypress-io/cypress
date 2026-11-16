<template>
  <SettingsSection>
    <template #title>
      Proxy settings
    </template>
    <template #description>
      Cypress auto-detected the following proxy settings from your operating system.
    </template>
    <div class="rounded bg-gray-50 border border-gray-100 grid py-[18px] px-[20px] text-[14px] w-[364px] gap-[12px]">
      <div class="flex justify-between">
        <span class="font-medium text-gray-800">Proxy server</span>
        <span
          class="text-gray-500"
          data-testid="proxy-server"
        >{{ props.gql.localSettings.preferences.proxyServer || '-' }}</span>
      </div>
      <div class="flex justify-between">
        <span class="font-medium text-gray-800">Proxy bypass list</span>
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
import { gql } from '@urql/vue'
import type { ProxySettingsFragment } from '../../generated/graphql'

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
