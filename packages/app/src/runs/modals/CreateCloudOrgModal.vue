<template>
  <StandardModal
    model-value
    :title="t('runs.connect.modal.title')"
    help-link="https://on.cypress.io/adding-new-project"
    @update:model-value="emit('cancel')"
  >
    <div class="border border-dashed rounded border-gray-100 text-center p-24px w-592px">
      <p class=" mb-16px text-gray-700">
        {{ t('runs.connect.modal.createOrg.description') }}
      </p>
      <div @click="startWaitingOrgToBeCreated()">
        <ExternalLink
          class="border rounded mx-auto border-gray-100 py-4px px-16px text-indigo-500 inline-block"
          :href="createOrgUrl"
          :include-graphql-port="true"
        >
          <i-cy-office-building_x16 class="inline-block icon-dark-gray-500" />
          {{ t('runs.connect.modal.createOrg.button') }}
        </ExternalLink>
      </div>
    </div>
    <template #footer>
      <div class="flex gap-16px">
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
import { gql, useQuery } from '@urql/vue'
import StandardModal from '@cy/components/StandardModal.vue'
import Button from '@cy/components/Button.vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import type { CreateCloudOrgModalFragment } from '../../generated/graphql'
import { CloudOrganizationsCheckDocument } from '../../generated/graphql'
import { useI18n } from '@cy/i18n'
import { useDebounceFn } from '@vueuse/core'

const { t } = useI18n()

const emit = defineEmits<{
  (event: 'cancel'): void
}>()

gql`
fragment CreateCloudOrgModal on CloudUser {
  id
  createCloudOrganizationUrl
  organizationControl: organizations (first: 1) {
    nodes {
      id
    }
  }
}
`

gql`
query CloudOrganizationsCheck {
  ...CloudConnectModals
}
`

const props = defineProps<{
  gql: CreateCloudOrgModalFragment
}>()

const query = useQuery({
  query: CloudOrganizationsCheckDocument,
  requestPolicy: 'network-only',
  pause: true,
})

const refetch = useDebounceFn(() => query.executeQuery(), 1000)

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

const createOrgUrl = computed(() => props.gql.createCloudOrganizationUrl || '#')
</script>
