<template>
  <SettingsSection>
    <template #title>
      {{ t('settingsPage.notifications.title') }}
    </template>
    <template #description>
      {{ t('settingsPage.notifications.description') }}
    </template>
    <div class="divide-y border rounded divide-gray-50 border-gray-100 px-[16px]">
      <div
        v-for="({id, title}) in switches"
        :key="id"
        class="py-[16px]"
      >
        <h4 class="flex text-gray-800 text-[16px] leading-[24px] items-center">
          <label :for="id">{{ title }}</label>
          <Switch
            class="mx-[8px]"
            :value="props.gql.localSettings?.preferences[id] ?? false"
            :name="id"
            @update="(value) => updatePref(value, id)"
          />
          {{ gql.localSettings }}
        </h4>
      </div>
      <div class="py-[16px]">
        <h4 class="flex text-gray-800 text-[16px] leading-[24px] items-center">
          {{ t('settingsPage.notifications.notifyMeWhenRunCompletes') }}
        </h4>
        <div class="pt-[5px]">
          <Checkbox
            v-for="({id, label}) in statuses"
            :id="id"
            :key="id"
            v-model="listRef"
          >
            <template #label>
              <label
                :for="id"
                class="text-sm text-gray-900"
              >
                {{ label }}
              </label>
            </template>
          </Checkbox>
        </div>
      </div>
      <div class="py-[16px]">
        <Button
          variant="white"
          size="32"
          @click="showTestNotification"
        >
          {{ t('settingsPage.notifications.sendTestNotification') }}
        </Button>
        <i18n-t
          tag="p"
          scope="global"
          keypath="settingsPage.notifications.notReceivingNotifications"
          class="pt-[15px] text-gray-600 text-sm font-normal"
        >
          <ExternalLink :href="troubleshootingHref">
            {{ t('settingsPage.notifications.troubleshoot') }}
          </ExternalLink>
        </i18n-t>
      </div>
    </div>
  </SettingsSection>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { gql, useMutation } from '@urql/vue'
import { useI18n } from '@cy/i18n'
import Switch from '@packages/frontend-shared/src/components/Switch.vue'
import SettingsSection from '../SettingsSection.vue'
import { NotificationSettingsFragment, SetNotificationSettingsDocument, NotificationSettings_ShowNotificationDocument } from '../../generated/graphql'
import Checkbox from '@cy/components/Checkbox.vue'
import Button from '@cypress-design/vue-button'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import { getUrlWithParams } from '@packages/frontend-shared/src/utils/getUrlWithParams'
import { debouncedWatch } from '@vueuse/core'

const { t } = useI18n()

const props = defineProps<{
  gql: NotificationSettingsFragment
}>()

gql`
fragment NotificationSettings on Query {
  localSettings {
    preferences {
      notifyWhenRunStarts
      notifyWhenRunStartsFailing
      notifyWhenRunCompletes
    }
  }
}
`

gql`
mutation SetNotificationSettings($value: String!) {
  setPreferences (value: $value, type: global) {
    ...NotificationSettings
  }
}`

gql`
mutation NotificationSettings_ShowNotification($title: String!, $body: String!) {
  showSystemNotification(title: $title, body: $body)
}`

const switches = [
  {
    id: 'notifyWhenRunStarts',
    title: t('settingsPage.notifications.notifyMeWhenRunStarts'),
  },
  {
    id: 'notifyWhenRunStartsFailing',
    title: t('settingsPage.notifications.notifyMeWhenRunIsFailing'),
  },
]

const listRef = ref(props.gql.localSettings.preferences.notifyWhenRunCompletes)

const statuses = [
  { id: 'passed', label: t('settingsPage.notifications.passed') },
  { id: 'failed', label: t('settingsPage.notifications.failed') },
  { id: 'canceled', label: t('settingsPage.notifications.canceled') },
  { id: 'errored', label: t('settingsPage.notifications.errored') },
]

const setPreferences = useMutation(SetNotificationSettingsDocument)
const showNotification = useMutation(NotificationSettings_ShowNotificationDocument)

async function showTestNotification () {
  await showNotification.executeMutation({ title: t('settingsPage.notifications.testNotificationTitle'), body: t('settingsPage.notifications.testNotificationBody') })
}

function updatePref (value: boolean, property: string) {
  setPreferences.executeMutation({
    value: JSON.stringify({ [property]: value }),
  })
}

const debounce = 200

debouncedWatch(() => listRef.value, async (newVal) => {
  await setPreferences.executeMutation({
    value: JSON.stringify({ notifyWhenRunCompletes: newVal }),
  })
}, { debounce })

// TODO: Add documentation link https://github.com/cypress-io/cypress-documentation/issues/5280
const troubleshootingHref = getUrlWithParams({ url: '#', params: {} })

</script>
