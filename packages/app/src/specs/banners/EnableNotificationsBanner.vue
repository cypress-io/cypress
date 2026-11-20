<template>
  <div
    data-cy="enable-notifications-banner"
    class="flex items-start flex-wrap gap-[8px] justify-between w-full px-[24px] py-[16px] bg-indigo-50 border-b border-b-indigo-100"
  >
    <div>
      <div class="text-gray-900 font-medium text-base">
        Start debugging as soon as your first tests fail
      </div>
      <div class="text-gray-700 text-sm mt-[3px]">
        Cypress can notify you about Cloud test runs for your branch.
      </div>
    </div>
    <div class="flex gap-[8px]">
      <Button
        size="40"
        @click="enableNotifications"
      >
        Enable desktop notifications
      </Button>
      <Button
        variant="outline-light"
        @click="remindLater"
      >
        Remind me later
      </Button>
      <Button
        aria-label="Dismiss banner"
        class="flex items-center text-gray-200"
        variant="outline-light"
        @click="dismissBanner"
      >
        <IconActionDeleteMedium />
      </Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { gql, useMutation } from '@urql/vue'
import Button from '@cypress-design/vue-button'
import { IconActionDeleteMedium } from '@cypress-design/vue-icon'
import { dayjs } from '../../runs/utils/day.js'
import { EnableNotificationsBanner_ShowNotificationDocument, EnableNotificationsBanner_SetPreferencesDocument } from '../../generated/graphql'
import { useRouter } from 'vue-router'

gql`
mutation EnableNotificationsBanner_ShowNotification($title: String!, $body: String!) {
  showSystemNotification(title: $title, body: $body)
}`

gql`
mutation EnableNotificationsBanner_SetPreferences ($value: String!) {
  setPreferences (value: $value, type: global) {
    localSettings {
        preferences {
          desktopNotificationsEnabled
          dismissNotificationBannerUntil
      }
    }
  }
}`

const showNotification = useMutation(EnableNotificationsBanner_ShowNotificationDocument)
const setPreferences = useMutation(EnableNotificationsBanner_SetPreferencesDocument)

const router = useRouter()

const enableNotifications = async () => {
  await showNotification.executeMutation({ title: 'Notifications Enabled', body: 'Nice, notifications are enabled!' })

  await setPreferences.executeMutation({ value: JSON.stringify({ desktopNotificationsEnabled: true }) })

  // Redirect to the /settings page, expand the Device Settings and scroll to the #notifications anchor.
  router.push({
    path: '/settings',
    query: {
      section: 'device',
      anchor: 'notifications',
    },
  })
}

const remindLater = async () => {
  const in3Days = dayjs().add(dayjs.duration({ days: 3 }))

  await setPreferences.executeMutation({ value: JSON.stringify({ dismissNotificationBannerUntil: in3Days }) })
}

const dismissBanner = async () => {
  await setPreferences.executeMutation({ value: JSON.stringify({ desktopNotificationsEnabled: false }) })
}

</script>
