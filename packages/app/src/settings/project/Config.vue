<template>
  <SettingsSection
    data-cy="settings-config"
  >
    <template #title>
      Resolved configuration
    </template>
    <template #description>
      Since the options in the
      <OpenConfigFileInIDE :gql="props.gql" />
      can be set dynamically by your development environment, please refer to the legend below to understand how the configuration options are resolved.
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
import ConfigLegend from './ConfigLegend.vue'
import ConfigCode from './ConfigCode.vue'
import type { ConfigFragment } from '../../generated/graphql'
import OpenConfigFileInIDE from '@packages/frontend-shared/src/gql-components/OpenConfigFileInIDE.vue'

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
