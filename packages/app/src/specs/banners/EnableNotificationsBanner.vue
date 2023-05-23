<template>
  <div class="flex max-[900px]:flex-col max-[900px]:items-start min-[901px]:items-center justify-between w-full px-[20px] py-[10px] bg-indigo-50 border border-b-indigo-100 min-h-[80px]">
    <div class="flex flex-col">
      <div class="text-gray-900 font-medium text-base">
        {{ t('specPage.banners.enableNotifications.title') }}
      </div>
      <div class="text-gray-700 text-sm mt-[3px]">
        {{ t('specPage.banners.enableNotifications.subtitle') }}
      </div>
    </div>
    <div class="flex max-[900px]:mt-[8px]">
      <div>
        <Button
          size="40"
          @click="enableNotifications"
        >
          {{ t('specPage.banners.enableNotifications.enableDesktopNotifications') }}
        </Button>
      </div>
      <div class="ml-[7px]">
        <Button
          variant="outline-light"
          @click="remindLater"
        >
          {{ t('specPage.banners.enableNotifications.remindMeLater') }}
        </Button>
      </div>
      <div class="ml-[7px] text-gray-200">
        <Button
          class="flex items-center h-[42px]"
          variant="outline-light"
          @click="dismissBanner"
        >
          <Icon
            name="action-delete-medium"
            stroke-color="gray-500"
            fill-color="gray-500"
          />
        </Button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import { gql, useMutation } from '@urql/vue'
import Button from '@cypress-design/vue-button'
import Icon from '@cypress-design/vue-icon'
import { dayjs } from '../../runs/utils/day.js'
import { EnableNotificationsBanner_SetDesktopNotificationsEnabledDocument, EnableNotificationsBanner_ShowNotificationDocument, EnableNotificationsBanner_SetDismissNotificationBannerUntilDocument } from '../../generated/graphql'

const { t } = useI18n()

gql`
mutation EnableNotificationsBanner_ShowNotification($title: String!, $body: String!) {
  showSystemNotification(title: $title, body: $body)
}`

gql`
mutation EnableNotificationsBanner_SetDesktopNotificationsEnabled ($value: String!) {
  setPreferences (value: $value, type: global) {
    currentProject {
      id
      savedState
    }
  }
}`

gql`
mutation EnableNotificationsBanner_SetDismissNotificationBannerUntil ($value: String!) {
  setPreferences (value: $value, type: global) {
    currentProject {
      id
      savedState
    }
  }
}`

const showNotification = useMutation(EnableNotificationsBanner_ShowNotificationDocument)
const setDesktopNotificationsEnabled = useMutation(EnableNotificationsBanner_SetDesktopNotificationsEnabledDocument)
const setDismissNotificationBannerUntil = useMutation(EnableNotificationsBanner_SetDismissNotificationBannerUntilDocument)

const enableNotifications = async () => {
  await showNotification.executeMutation({ title: 'Notifications Enabled', body: 'Nice, notifications are enabled!' })

  await setDesktopNotificationsEnabled.executeMutation({ value: JSON.stringify({ desktopNotificationsEnabled: true }) })
}

const remindLater = async () => {
  const in3Days = dayjs().add(dayjs.duration({ days: 3 }))

  await setDismissNotificationBannerUntil.executeMutation({ value: JSON.stringify({ dismissNotificationBannerUntil: in3Days }) })
}

const dismissBanner = async () => {
  await setDesktopNotificationsEnabled.executeMutation({ value: JSON.stringify({ desktopNotificationsEnabled: false }) })
}

</script>
