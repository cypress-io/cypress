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

      <ExternalEditorSettings :gql="props.gql" />
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
    <hr class="border-gray-100 my-32px">
    <p class="leading-24px text-16px text-light max-w-500px text-gray-500 mx-auto text-center">
      {{ t('settingsPage.footer.text') }}
    </p>
    <Button
      class="my-16px mx-auto"
      variant="outline"
      :prefix-icon="SettingsIcon"
      prefix-icon-class="icon-dark-gray-500 icon-light-gray-50"
      @click="reconfigure"
    >
      {{ t('settingsPage.footer.button') }}
    </Button>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import { gql, useMutation } from '@urql/vue'
import Button from '@cy/components/Button.vue'
import ExternalEditorSettings from './device/ExternalEditorSettings.vue'
import SettingsCard from './SettingsCard.vue'
import ProjectSettings from './project/ProjectSettings.vue'
import DeviceSettings from './device/DeviceSettings.vue'
import { SettingsContainer_ReconfigureProjectDocument, SettingsContainerFragment } from '../generated/graphql'
import IconLaptop from '~icons/cy/laptop_x24.svg'
import IconFolder from '~icons/cy/folder-outline_x24.svg'
import SettingsIcon from '~icons/cy/settings_x16.svg'

const { t } = useI18n()

gql`
mutation SettingsContainer_ReconfigureProject {
  reconfigureProject
}
`

gql`
fragment SettingsContainer on Query {
  currentProject {
    id
    ...ProjectSettings
  }
  ...ExternalEditorSettings
}`

const props = defineProps<{
  gql: SettingsContainerFragment
}>()

const openElectron = useMutation(SettingsContainer_ReconfigureProjectDocument)

function reconfigure () {
  openElectron.executeMutation({})
}
</script>
