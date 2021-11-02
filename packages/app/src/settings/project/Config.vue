<template>
  <SettingsSection>
    <template #title>
      {{ t('settingsPage.config.title') }}
    </template>
    <template #description>
      <i18n-t keypath="settingsPage.config.description">
        <a
          href="https://docs.cypress.io"
          target="_blank"
        >cypress.config.js</a>
      </i18n-t>
    </template>
    <div class="flex w-full">
      <ConfigCode
        data-testid="config-code"
        :config="configObject"
      />
      <ConfigLegend
        class="rounded-tr-md px-22px py-28px border-1 border-l-0 rounded-br-md min-w-280px"
      />
    </div>
  </SettingsSection>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { gql } from '@urql/vue'
import SettingsSection from '../SettingsSection.vue'
import { useI18n } from '@cy/i18n'
import ConfigLegend from './ConfigLegend.vue'
import ConfigCode from './ConfigCode.vue'
import type { ConfigFragment } from '../../generated/graphql'

const { t } = useI18n()

gql`
fragment Config on Project {
  config
}
`

const props = defineProps<{
  gql: ConfigFragment
}>()

const configObject = computed(() => props.gql.config)
</script>
