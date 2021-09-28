<template>
  <SettingsSection>
    <template #title>{{ t('settingsPage.proxy.title') }}</template>
    <template #description>{{ t('settingsPage.proxy.description') }}</template>
    <div class="bg-gray-50 border-1 rounded py-2 px-4 grid gap-1 w-364px">
      <div class="flex justify-between text-sm">
        <span class="font-medium text-gray-800">{{ t('settingsPage.proxy.proxyServer') }}</span>
        <span class="text-gray-500" data-testid="proxy-server">{{proxyServer}}</span>
      </div>
      <div class="flex justify-between text-sm">
        <span class="font-medium text-gray-800">{{ t('settingsPage.proxy.bypassList') }}</span>
        <span class="text-gray-500" data-testid="bypass-list">{{bypassList}}</span>
      </div>
    </div>
  </SettingsSection>
</template>

<script lang="ts" setup>
import SettingsSection from '../SettingsSection.vue'
import { useI18n } from '@cy/i18n';
import { ref } from 'vue';

const { t } = useI18n()

const proxyServer = ref('http://acme-bank.local:2739/')
const bypassList = ref('127.0.0.1,127.0.0.2')
</script>
