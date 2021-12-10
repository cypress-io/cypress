<template>
  <TransitionQuickFade>
    <Alert
      v-if="showAlert"
      type="success"
      class="top-24px right-24px left-24px absolute"
      close-button
      @close="showAlert = false"
    >
      {{ t('runs.connectSuccessAlert.title') }}
      <template #details>
        <p class="flex px-16px pt-16px leading-24px items-center">
          <i-cy-arrow-outline-right_x16 class="h-16px mr-8px w-16px inline align-middle icon-dark-jade-500" />
          <i18n-t keypath="runs.connectSuccessAlert.item1">
            <template #projectId>
              <span class="font-normal m-4px text-jade-600">projectId</span>
            </template>
            <template #configFile>
              <span class="font-normal m-4px text-jade-600">{{ configFilePath }}</span>
            </template>
          </i18n-t>
        </p>
        <p class="flex px-16px pt-16px pb-16px leading-24px items-center">
          <i-cy-arrow-outline-right_x16 class="h-16px mr-8px w-16px inline align-middle icon-dark-jade-500" />
          <i18n-t keypath="runs.connectSuccessAlert.item2">
            <span class="font-normal m-4px text-jade-600">{{ configFilePath }}</span>
          </i18n-t>
        </p>
      </template>
    </Alert>
  </TransitionQuickFade>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { whenever } from '@vueuse/core'
import { gql } from '@urql/vue'
import TransitionQuickFade from '@cy/components/transitions/TransitionQuickFade.vue'
import Alert from '@cy/components/Alert.vue'
import type { RunsConnectSuccessAlertFragment } from '../generated/graphql'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

gql`
fragment RunsConnectSuccessAlert on CurrentProject {
  id
  projectId
  configFilePath
}`

const props = defineProps<{
  gql: RunsConnectSuccessAlertFragment
}>()

const showAlert = ref(false)

const projectId = computed(() => props.gql.projectId)
const configFilePath = computed(() => props.gql.configFilePath)

whenever(projectId, () => {
  showAlert.value = true
})

</script>
