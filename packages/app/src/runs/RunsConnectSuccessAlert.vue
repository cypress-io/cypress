<template>
  <Alert
    v-model="showAlert"
    status="success"
    class="mb-[24px]"
    dismissible
    :title="t('runs.connectSuccessAlert.title')"
  >
    <p class="flex px-[16px] pt-[16px] leading-[24px] md:items-center">
      <i-cy-arrow-outline-right_x16 class="h-[16px] mr-[8px] w-[16px] inline align-middle icon-dark-jade-500 mt-[4px] md:mt-0" />
      <span>
        <i18n-t
          scope="global"
          keypath="runs.connectSuccessAlert.item1"
        >
          <template #projectId>
            <span class="font-normal text-jade-600">projectId</span>
          </template>
          <template #configFile>
            <span class="font-normal text-jade-600">{{ configFilePath }}</span>
          </template>
        </i18n-t>
      </span>
    </p>
    <p class="flex px-[16px] pt-[16px] pb-[16px] leading-[24px] md:items-center">
      <i-cy-arrow-outline-right_x16 class="h-[16px] mr-[8px] w-[16px] inline align-middle icon-dark-jade-500 mt-[4px] md:mt-0" />
      <span>
        <i18n-t
          scope="global"
          keypath="runs.connectSuccessAlert.item2"
        >
          <span class="font-normal text-jade-600">{{ configFilePath }}</span>
        </i18n-t>
      </span>
    </p>
  </Alert>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { whenever } from '@vueuse/core'
import { gql } from '@urql/vue'
import Alert from '@cy/components/Alert.vue'
import type { RunsConnectSuccessAlertFragment } from '../generated/graphql'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

gql`
fragment RunsConnectSuccessAlert on CurrentProject {
  id
  projectId
  configFileAbsolutePath
  projectRoot
}`

const props = defineProps<{
  gql: RunsConnectSuccessAlertFragment
}>()

const showAlert = ref(true)

const projectId = computed(() => props.gql.projectId)
const configFilePath = computed(() => props.gql.configFileAbsolutePath?.replace(props.gql.projectRoot, '').replace(/^\//, ''))

whenever(projectId, () => {
  showAlert.value = true
})

</script>
