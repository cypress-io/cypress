<template>
  <SettingsSection
    data-cy="settings-config"
  >
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
        data-cy="config-code"
        :gql="props.gql"
      />
      <ConfigLegend
        :gql="props.gql"
        data-cy="config-legend"
        class="rounded-tr-md rounded-br-md border border-l-0 min-w-[280px] py-[28px] px-[22px]"
      />
    </div>
  </SettingsSection>
</template>

<script lang="ts" setup>
import { gql } from '@urql/vue'
import SettingsSection from '../SettingsSection.vue'
import { useI18n } from '@cy/i18n'
import ConfigLegend from './ConfigLegend.vue'
import ConfigCode from './ConfigCode.vue'
import type { ConfigFragment } from '../../generated/graphql'
import OpenConfigFileInIDE from '@packages/frontend-shared/src/gql-components/OpenConfigFileInIDE.vue'

const { t } = useI18n()

gql`
fragment Config on CurrentProject {
  id
  ...OpenConfigFileInIDE
  ...ConfigCode
}
`

const props = defineProps<{
  gql: ConfigFragment
}>()
</script>
