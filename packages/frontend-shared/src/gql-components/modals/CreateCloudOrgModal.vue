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
        <Button
          v-if="waitingOrgToBeCreated"
          size="lg"
          variant="pending"
        >
          <template #prefix>
            <i-cy-loading_x16
              class="animate-spin icon-dark-white icon-light-gray-400"
            />
          </template>
          {{ t('runs.connect.modal.createOrg.waitingButton') }}
        </Button>
        <Button
          v-else
          size="lg"
          @click="refetch()"
        >
          {{ t('runs.connect.modal.createOrg.refreshButton') }}
        </Button>
        <Button
          variant="outline"
          size="lg"
          @click="emit('cancel')"
        >
          {{ t('runs.connect.modal.cancel') }}
        </Button>
      </div>
    </template>
  </StandardModal>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { gql, useMutation } from '@urql/vue'
import StandardModal from '@cy/components/StandardModal.vue'
import Button from '@cy/components/Button.vue'
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
