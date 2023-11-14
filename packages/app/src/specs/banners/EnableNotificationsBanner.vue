<template>
  <div
    data-cy="enable-notifications-banner"
    class="flex items-start flex-wrap gap-[8px] justify-between w-full px-[24px] py-[16px] bg-indigo-50 border-b border-b-indigo-100"
  >
    <div>
      <div class="text-gray-900 font-medium text-base">
        {{ t('specPage.banners.enableNotifications.title') }}
      </div>
      <div class="text-gray-700 text-sm mt-[3px]">
        {{ t('specPage.banners.enableNotifications.subtitle') }}
      </div>
    </div>
    <div class="flex gap-[8px]">
      <Button
        size="40"
        @click="enableNotifications"
      >
        {{ t('specPage.banners.enableNotifications.enableDesktopNotifications') }}
      </Button>
      <Button
        variant="outline-light"
        @click="remindLater"
      >
        {{ t('specPage.banners.enableNotifications.remindMeLater') }}
      </Button>
      <Button
        :aria-label="t('specPage.banners.enableNotifications.dismissBanner')"
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
import { useI18n } from '@cy/i18n'
import { gql, useMutation } from '@urql/vue'
import Button from '@cypress-design/vue-button'
import { IconActionDeleteMedium } from '@cypress-design/vue-icon'
import { dayjs } from '../../runs/utils/day.js'
import { EnableNotificationsBanner_ShowNotificationDocument, EnableNotificationsBanner_SetPreferencesDocument } from '../../generated/graphql'
import { useRouter } from 'vue-router'

const { t } = useI18n()

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
  await showNotification.executeMutation({ title: t('specPage.banners.enableNotifications.notificationsEnabledTitle'), body: t('specPage.banners.enableNotifications.notificationsEnabledBody') })

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
