<template>
  <SettingsSection anchor="notifications">
    <template #title>
      {{ t('settingsPage.notifications.title') }}
    </template>
    <template #description>
      {{ t('settingsPage.notifications.description') }}
    </template>
    <div class="border rounded border-gray-100">
      <div
        v-if="!props.gql.localSettings.preferences.desktopNotificationsEnabled"
        class="min-h-[56px] bg-indigo-50 px-[16px] py-[10px] flex flex-wrap justify-between items-center gap-[5px]"
        data-cy="enable-notifications"
      >
        <div class="text-indigo-700 font-medium flex items-center">
          <IconSecurityLockLocked
            class="mr-[7px]"
            fill-color="indigo-200"
            stroke-color="indigo-500"
          />
          {{ t('settingsPage.notifications.enableNotificationsLabel') }}
        </div>

        <ButtonDS
          size="32"
          class="font-normal"
          @click="enableNotifications"
        >
          {{ t('specPage.banners.enableNotifications.enableDesktopNotifications') }}
        </ButtonDS>
      </div>

      <div class="px-[16px] divide-y divide-gray-50">
        <div
          v-for="({id, title}) in switches"
          :key="id"
          class="py-[16px]"
        >
          <h4 class="flex text-gray-800 text-[16px] leading-[24px] items-center">
            <label :id="id">{{ title }}</label>
            <Switch
              class="mx-[8px]"
              :value="props.gql.localSettings.preferences[id] ?? false"
              :label-id="id"
              :disabled="!desktopNotificationsEnabled"
              @update="(value) => updatePref(id, value)"
            />
            {{ gql.localSettings }}
          </h4>
        </div>
        <div class="py-[16px]">
          <h4 class="flex text-gray-800 text-[16px] leading-[24px] items-center">
            {{ t('settingsPage.notifications.notifyMeWhenRunCompletes') }}
          </h4>
          <div class="pt-[5px]">
            <!-- TODO: Use Design System Checkbox when https://github.com/cypress-io/cypress-design/issues/255 is fixed -->
            <Checkbox
              v-for="({id, label}) in statuses"
              :id="id"
              :key="id"
              v-model="listRef"
              :label="label"
              :state="desktopNotificationsEnabled ? 'default' : 'disabled'"
              :disabled="!desktopNotificationsEnabled"
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
          <!-- TODO: Use design system button when https://github.com/cypress-io/cypress-design/issues/254 is fixed -->
          <Button
            variant="white"
            data-cy="send-test-notification"
            :disabled="!desktopNotificationsEnabled"
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
    </div>
  </SettingsSection>
</template>

<script lang="ts" setup>
import { computed, ref, watchEffect } from 'vue'
import { gql, useMutation } from '@urql/vue'
import { useI18n } from '@cy/i18n'
import Switch from '@packages/frontend-shared/src/components/Switch.vue'
import SettingsSection from '../SettingsSection.vue'
import { NotificationSettingsFragment, SetNotificationSettingsDocument, NotificationSettings_ShowNotificationDocument } from '../../generated/graphql'
import Checkbox from '@packages/frontend-shared/src/components/Checkbox.vue'
import ButtonDS from '@cypress-design/vue-button'
import Button from '@packages/frontend-shared/src/components/Button.vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import { getUrlWithParams } from '@packages/frontend-shared/src/utils/getUrlWithParams'
import { debouncedWatch } from '@vueuse/core'
import { IconSecurityLockLocked } from '@cypress-design/vue-icon'

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
      desktopNotificationsEnabled
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

const listRef = ref()

// allow for gql value to load when navigating straight here from EnableNotificationsBanner
watchEffect(() => {
  if (!listRef.value) {
    listRef.value = props.gql.localSettings.preferences.notifyWhenRunCompletes
  }
})

const statuses = [
  { id: 'passed', label: t('settingsPage.notifications.passed') },
  { id: 'failed', label: t('settingsPage.notifications.failed') },
  { id: 'cancelled', label: t('settingsPage.notifications.canceled') },
  { id: 'errored', label: t('settingsPage.notifications.errored') },
]

const desktopNotificationsEnabled = computed(() => props.gql.localSettings.preferences.desktopNotificationsEnabled)

const setPreferences = useMutation(SetNotificationSettingsDocument)
const showNotification = useMutation(NotificationSettings_ShowNotificationDocument)

async function showTestNotification () {
  await showNotification.executeMutation({ title: t('settingsPage.notifications.testNotificationTitle'), body: t('settingsPage.notifications.testNotificationBody') })
}

function updatePref (property: string, value: boolean) {
  setPreferences.executeMutation({
    value: JSON.stringify({ [property]: value }),
  })
}

async function enableNotifications () {
  updatePref('desktopNotificationsEnabled', true)

  await showNotification.executeMutation({ title: t('specPage.banners.enableNotifications.notificationsEnabledTitle'), body: t('specPage.banners.enableNotifications.notificationsEnabledBody') })
}

const debounce = 200

debouncedWatch(() => listRef.value, async (newVal) => {
  await setPreferences.executeMutation({
    value: JSON.stringify({ notifyWhenRunCompletes: newVal }),
  })
}, { debounce })

const troubleshootingHref = getUrlWithParams({ url: 'https://on.cypress.io/notifications-troubleshooting', params: {} })

</script>
