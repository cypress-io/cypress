<template>
  <SettingsSection data-cy="settings-config">
    <template #title>
      {{ t('settingsPage.config.title') }}
    </template>
    <template #description>
      <i18n-t
        scope="global"
        keypath="settingsPage.config.description"
      >
        <OpenConfigFileInIDE :gql="props.gql" />
      </i18n-t>
    </template>
    <div class="flex w-full">
      <ConfigCode
        data-testid="config-code"
        :config="configObject"
      />
      <ConfigLegend
        class="rounded-tr-md px-22px py-28px border-1 border-l-0 rounded-br-md min-w-280px"
        :gql="props.gql"
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
import OpenConfigFileInIDE from '@packages/frontend-shared/src/gql-components/OpenConfigFileInIDE.vue'

const { t } = useI18n()

gql`
fragment Config on Query {
  currentProject {
    id
    config
  }
  ...ConfigLegend
  ...OpenConfigFileInIDE
}
`

const props = defineProps<{
  gql: ConfigFragment
}>()

const configObject = computed(() => props.gql.currentProject?.config)
</script>
