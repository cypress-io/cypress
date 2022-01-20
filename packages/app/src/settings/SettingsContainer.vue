<template>
  <div
    class="space-y-32px h-[calc(100vh-64px)] p-32px overflow-auto"
    data-cy="settings"
  >
    <div class="space-y-24px">
      <SettingsCard
        :title="t('settingsPage.device.title')"
        :description="t('settingsPage.device.description')"
        :icon="IconLaptop"
        max-height="800px"
        :initially-open="initiallyOpen.device"
      >
        <ExternalEditorSettings :gql="props.gql" />
        <ProxySettings :gql="props.gql" />
        <TestingPreferences :gql="props.gql" />
      </SettingsCard>
      <SettingsCard
        :title="t('settingsPage.project.title')"
        :description="t('settingsPage.project.description')"
        :icon="IconFolder"
        max-height="10000px"
        :initially-open="initiallyOpen.project"
      >
        <ProjectSettings
          v-if="props.gql"
          :gql="props.gql"
        />
      </SettingsCard>
    </div>
    <hr class="border-gray-100">
    <p class="font-light mx-auto text-center max-w-500px text-16px text-gray-500 leading-24px">
      {{ t('settingsPage.footer.text') }}
    </p>
    <Button
      class="mx-auto group"
      variant="outline"
      :prefix-icon="SettingsIcon"
      prefix-icon-class="icon-dark-gray-500 icon-light-gray-50 group-hocus:icon-dark-indigo-400 group-hocus:icon-light-indigo-50"
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
import ProxySettings from './device/ProxySettings.vue'
import SettingsCard from './SettingsCard.vue'
import ProjectSettings from './project/ProjectSettings.vue'
import TestingPreferences from './device/TestingPreferences.vue'
import { SettingsContainer_ReconfigureProjectDocument, SettingsContainerFragment } from '../generated/graphql'
import IconLaptop from '~icons/cy/laptop_x24.svg'
import IconFolder from '~icons/cy/folder-outline_x24.svg'
import SettingsIcon from '~icons/cy/settings_x16.svg'
import { useRoute } from 'vue-router'
import { computed, onMounted, ref, watchEffect } from 'vue'

const { t } = useI18n()

gql`
mutation SettingsContainer_ReconfigureProject {
  reconfigureProject
}
`

gql`
fragment SettingsContainer on Query {
  ...TestingPreferences
  ...ProjectSettings
  ...ExternalEditorSettings
  ...ProxySettings
}`

const props = defineProps<{
  gql: SettingsContainerFragment
}>()

const route = useRoute()

const isMounted = ref(false)

onMounted(() => isMounted.value = true)

watchEffect(() => {
  if (route.name === 'Settings' && isMounted.value) {
    const scrollToElement = document.getElementById(`${(route.query.setting as string)}-anchor`)

    if (scrollToElement) {
      scrollToElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
})

const initiallyOpen = computed(() => {
  return {
    device: route.query.section === 'device',
    project: route.query.section === 'project',
  }
})

const openElectron = useMutation(SettingsContainer_ReconfigureProjectDocument)

function reconfigure () {
  openElectron.executeMutation({})
}
</script>
