<template>
  <div class="p-24px">
    <SettingsCard
      :title="t('settingsPage.device.title')"
      :description="t('settingsPage.device.description')"
      :icon="IconLaptop"
    >
      <DeviceSettings />
    </SettingsCard>
    <SettingsCard
      :title="t('settingsPage.project.title')"
      :description="t('settingsPage.project.description')"
      :icon="IconFolder"
    >
      <ProjectSettings
        v-if="props.gql.app.activeProject"
        :gql="props.gql.app.activeProject"
      />
    </SettingsCard>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import { gql } from '@urql/vue'
import SettingsCard from '../settings/SettingsCard.vue'
import ProjectSettings from '../settings/project/ProjectSettings.vue'
import DeviceSettings from '../settings/device/DeviceSettings.vue'
import type { SettingsPageFragment } from '../generated/graphql'
import IconLaptop from '~icons/cy/laptop_x24.svg'
import IconFolder from '~icons/cy/folder-outline_x24.svg'

const { t } = useI18n()

gql`
fragment SettingsPage on Query {
  app {
    activeProject {
      ...ProjectSettings
    }
  }
}`

const props = defineProps<{
  gql: SettingsPageFragment
}>()
</script>
