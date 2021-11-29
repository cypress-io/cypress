<template>
  <TransitionQuickFade>
    <Alert
      v-if="showAlert"
      type="success"
      class="absolute top-24px left-24px right-24px"
      close-button
      @close="showAlert = false"
    >
      {{ t('runs.connectSuccessAlert.title') }}
      <template #details>
        <p class="flex items-center leading-24px pt-16px px-16px">
          <i-cy-arrow-outline-right_x16 class="inline align-middle h-16px w-16px mr-8px icon-dark-jade-500" />
          <i18n-t keypath="runs.connectSuccessAlert.item1">
            <template #projectId>
              <span class="font-normal text-jade-600 m-4px">projectId</span>
            </template>
            <template #configFile>
              <span class="font-normal text-jade-600 m-4px">cypress.config.js</span>
            </template>
          </i18n-t>
        </p>
        <p class="flex items-center leading-24px pt-16px px-16px pb-16px">
          <i-cy-arrow-outline-right_x16 class="inline align-middle h-16px w-16px mr-8px icon-dark-jade-500" />
          <i18n-t keypath="runs.connectSuccessAlert.item2">
            <span class="font-normal text-jade-600 m-4px">cypress.config.js</span>
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
}`

const props = defineProps<{
  gql: RunsConnectSuccessAlertFragment
}>()

const showAlert = ref(false)

const projectId = computed(() => props.gql.projectId)

whenever(projectId, () => {
  showAlert.value = true
})

</script>
