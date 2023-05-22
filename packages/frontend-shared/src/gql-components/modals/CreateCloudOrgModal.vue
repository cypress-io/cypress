<template>
  <StandardModal
    model-value
    :title="t('runs.connect.modal.title')"
    help-link="https://on.cypress.io/adding-new-project"
    @update:model-value="emit('cancel')"
  >
    <NoInternetConnection
      v-if="!isOnline"
      class="mt-[24px]"
    >
      {{ t('launchpadErrors.noInternet.message') }}
    </NoInternetConnection>
    <div
      v-else
      class="border border-dashed rounded border-gray-100 text-center p-[24px] w-[592px]"
    >
      <p class=" mb-[16px] text-gray-700">
        {{ t('runs.connect.modal.createOrg.description') }}
      </p>
      <ExternalLink
        v-if="createOrgUrl"
        data-cy="create-org-link"
        class="border rounded mx-auto outline-none bg-indigo-500 border-indigo-500 text-white max-h-[60px] py-[11px] px-[16px] inline-block hocus-default"
        :href="createOrgUrl"
        :include-graphql-port="true"
        @click="startWaitingOrgToBeCreated()"
      >
        <i-cy-office-building_x16 class="inline-block icon-dark-white" />
        {{ t('runs.connect.modal.createOrg.button') }}
      </ExternalLink>
    </div>
    <template
      v-if="isOnline"
      #footer
    >
      <div class="flex gap-[16px]">
        <DSButton
          v-if="waitingOrgToBeCreated"
          data-cy="waiting-button"
          size="40"
          class="gap-[8px]"
          variant="disabled"
        >
          <IconStatusRunningOutline />
          {{ t('runs.connect.modal.createOrg.waitingButton') }}
        </DSButton>
        <DSButton
          v-else
          data-cy="refetch-button"
          size="40"
          @click="refetch()"
        >
          {{ t('runs.connect.modal.createOrg.refreshButton') }}
        </DSButton>
        <DSButton
          data-cy="cancel-button"
          variant="outline-light"
          size="40"
          @click="emit('cancel')"
        >
          {{ t('runs.connect.modal.cancel') }}
        </DSButton>
      </div>
    </template>
  </StandardModal>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { gql, useMutation } from '@urql/vue'
import StandardModal from '@cy/components/StandardModal.vue'
import DSButton from '@cypress-design/vue-button'
import { IconStatusRunningOutline } from '@cypress-design/vue-icon'
import ExternalLink from '../ExternalLink.vue'
import NoInternetConnection from '@cy/components/NoInternetConnection.vue'

import { CreateCloudOrgModalFragment, CreateCloudOrgModal_CloudOrganizationsCheckDocument } from '../../generated/graphql'
import { useI18n } from '@cy/i18n'
import { useDebounceFn, useOnline } from '@vueuse/core'

const { t } = useI18n()
const online = useOnline()

const emit = defineEmits<{
  (event: 'cancel'): void
}>()

gql`
fragment CreateCloudOrgModal on CloudUser {
  id
  createCloudOrganizationUrl
}
`

gql`
mutation CreateCloudOrgModal_CloudOrganizationsCheck {
  refreshCloudViewer {
    ...CloudConnectModals
  }
}
`

const props = defineProps<{
  gql: CreateCloudOrgModalFragment
}>()

const refreshOrgs = useMutation(CreateCloudOrgModal_CloudOrganizationsCheckDocument)

const refetch = useDebounceFn(() => refreshOrgs.executeMutation({}), 1000)

const waitingOrgToBeCreated = ref(false)

let timer

function startWaitingOrgToBeCreated () {
  waitingOrgToBeCreated.value = true

  timer = setTimeout(() => {
    waitingOrgToBeCreated.value = false
  }, 60000)
}

onBeforeUnmount(() => {
  window.clearTimeout(timer)
})

const createOrgUrl = computed(() => props.gql.createCloudOrganizationUrl)
const isOnline = computed(() => online.value)

</script>
