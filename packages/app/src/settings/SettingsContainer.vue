<template>
  <div
    class="p-24px h-full"
    data-cy="settings"
  >
    <SettingsCard
      :title="t('settingsPage.device.title')"
      :description="t('settingsPage.device.description')"
      :icon="IconLaptop"
      max-height="800px"
    >
      <DeviceSettings />
    </SettingsCard>
    <SettingsCard
      :title="t('settingsPage.project.title')"
      :description="t('settingsPage.project.description')"
      :icon="IconFolder"
      max-height="3200px"
    >
      <ProjectSettings
        v-if="props.gql.currentProject"
        :gql="props.gql.currentProject"
      />
    </SettingsCard>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import { gql } from '@urql/vue'
import SettingsCard from './SettingsCard.vue'
import ProjectSettings from './project/ProjectSettings.vue'
import DeviceSettings from './device/DeviceSettings.vue'
import type { SettingsContainerFragment } from '../generated/graphql'
import IconLaptop from '~icons/cy/laptop_x24.svg'
import IconFolder from '~icons/cy/folder-outline_x24.svg'

const { t } = useI18n()

gql`
fragment SettingsContainer on Query {
  currentProject {
    id
    ...ProjectSettings
  }
}`

const props = defineProps<{
  gql: SettingsContainerFragment
}>()
</script>
