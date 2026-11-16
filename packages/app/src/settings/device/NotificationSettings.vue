<template>
  <SettingsSection anchor="notifications">
    <template #title>
      Desktop notifications
    </template>
    <template #description>
      Cypress can notify you about Cloud test runs for your branch.
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
          To modify notification settings, enable desktop notifications
        </div>

        <ButtonDS
          size="32"
          class="font-normal"
          @click="enableNotifications"
        >
          Enable desktop notifications
        </ButtonDS>
      </div>

      <div class="px-[16px] divide-y divide-gray-50">
        <div
          v-for="({id, labelId, title}) in switches"
          :key="id"
          class="py-[16px]"
        >
          <h4 class="flex text-gray-800 text-[16px] leading-[24px] items-center">
            <label :id="labelId">{{ title }}</label>
            <Switch
              :id="id"
              class="mx-[8px]"
              :value="props.gql.localSettings.preferences[id] ?? false"
              :label-id="labelId"
              :disabled="!desktopNotificationsEnabled"
              @update="(value) => updatePref(id, value)"
            />
          </h4>
        </div>
        <div class="py-[16px]">
          <h4 class="flex text-gray-800 text-[16px] leading-[24px] items-center">
            Notify me when a run completes
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
            Send a test notification
          </Button>
          <p class="pt-[15px] text-gray-600 text-sm font-normal">
            Not receiving notifications? You might need to allow notifications from Cypress in your computer's system preferences.
            <ExternalLink :href="troubleshootingHref">
              Troubleshoot
            </ExternalLink>
          </p>
        </div>
      </div>
    </div>
  </SettingsSection>
</template>

<script lang="ts" setup>
import { computed, ref, watchEffect } from 'vue'
import { gql, useMutation } from '@urql/vue'
import Switch from '@packages/frontend-shared/src/components/Switch.vue'
import SettingsSection from '../SettingsSection.vue'
import { SetNotificationSettingsDocument, NotificationSettings_ShowNotificationDocument } from '../../generated/graphql'
import type { NotificationSettingsFragment } from '../../generated/graphql'
import Checkbox from '@packages/frontend-shared/src/components/Checkbox.vue'
import ButtonDS from '@cypress-design/vue-button'
import Button from '@packages/frontend-shared/src/components/Button.vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import { getUrlWithParams } from '@packages/frontend-shared/src/utils/getUrlWithParams'
import { debouncedWatch } from '@vueuse/core'
import { IconSecurityLockLocked } from '@cypress-design/vue-icon'

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
    labelId: 'notifyWhenRunStartsLabel',
    title: 'Notify me when a run starts',
  },
  {
    id: 'notifyWhenRunStartsFailing',
    labelId: 'notifyWhenRunStartsFailingLabel',
    title: 'Notify me when a run begins to fail',
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
  { id: 'passed', label: 'Passed' },
  { id: 'failed', label: 'Failed' },
  { id: 'cancelled', label: 'Canceled' },
  { id: 'errored', label: 'Errored' },
]

const desktopNotificationsEnabled = computed(() => props.gql.localSettings.preferences.desktopNotificationsEnabled)

const setPreferences = useMutation(SetNotificationSettingsDocument)
const showNotification = useMutation(NotificationSettings_ShowNotificationDocument)

async function showTestNotification () {
  await showNotification.executeMutation({ title: 'Hello From Cypress', body: 'This is a test notification' })
}

function updatePref (property: string, value: boolean) {
  setPreferences.executeMutation({
    value: JSON.stringify({ [property]: value }),
  })
}

async function enableNotifications () {
  updatePref('desktopNotificationsEnabled', true)

  await showNotification.executeMutation({ title: 'Notifications Enabled', body: 'Nice, notifications are enabled!' })
}

const debounce = 200

debouncedWatch(() => listRef.value, async (newVal) => {
  await setPreferences.executeMutation({
    value: JSON.stringify({ notifyWhenRunCompletes: newVal }),
  })
}, { debounce })

const troubleshootingHref = getUrlWithParams({ url: 'https://on.cypress.io/notifications-troubleshooting', params: {} })

</script>
