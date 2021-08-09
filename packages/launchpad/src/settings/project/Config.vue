<template>
  <SettingsSection>
    <template #title>{{ t('settingsPage.config.title') }}</template>
    <template #description>
      <i18n-t keypath="settingsPage.config.description">
        <a href="https://docs.cypress.io" target="_blank">cypress.config.js</a>
      </i18n-t>
    </template>
    <div class="flex w-full select-none">
      <ConfigCode
        data-testid="config-code"
        :code="code"
        class="relative grow-1 w-full hide-scrollbar rounded-bl-md rounded-tl-md mx-auto border-1 overflow-hidden"
      />
      <ConfigLegend
        class="rounded-tr-md px-22px py-28px border-1 border-l-0 rounded-br-md min-w-280px"
      />
    </div>
  </SettingsSection>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import SettingsSection from '../SettingsSection.vue'
import { useI18n } from '../../composables'
import cypressJson from '../../../cypress.json?raw' // TODO: remove this
import ConfigLegend from './ConfigLegend.vue'
import ConfigCode from './ConfigCode.vue'

const code = ref(JSON.parse(JSON.stringify(cypressJson, null, 2)))
const { t } = useI18n()
</script>
