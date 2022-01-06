<template>
  <SettingsSection data-cy="settings-recordKey">
    <template #title>
      {{ t('settingsPage.recordKey.title') }}
    </template>
    <template #description>
      <i18n-t
        scope="global"
        keypath="settingsPage.recordKey.description"
      >
        <ExternalLink
          href="https://on.cypress.io/what-is-a-record-key"
        >
          {{ t('links.learnMore') }}
        </ExternalLink>
      </i18n-t>
    </template>
    <template v-if="cloudProject?.__typename === 'CloudProject'">
      <template v-if="cloudProject.recordKeys?.length">
        <RecordKey
          v-for="recordKey of cloudProject.recordKeys"
          :key="recordKey.id"
          :gql="recordKey"
          :settings-url="cloudProject.cloudProjectSettingsUrl"
        />
      </template>
      <Alert
        v-else
        :title="t('settingsPage.recordKey.errorEmpty')"
      >
        <div class="flex justify-end">
          <Button
            :variant="requestStatus ? 'pending' : 'primary'"
            @click="requestAccess()"
          >
            {{ t('settingsPage.recordKey.errorEmptyButton') }}
          </Button>
        </div>
      </Alert>
    </template>
    <Alert
      v-else-if="cloudProject?.__typename === 'CloudProjectNotFound'"
      :title="t('settingsPage.recordKey.errorNotFound')"
    >
      <div class="flex justify-end">
        <Button
          @click="connectDialog = true"
        >
          {{ t('settingsPage.recordKey.errorNotFoundButton') }}
        </Button>
      </div>
    </Alert>
    <Alert
      v-else-if="cloudProject?.__typename === 'CloudProjectUnauthorized'"
      :title="cloudProject.hasRequestedAccess
        ? t('settingsPage.recordKey.errorAccessPending')
        : t('settingsPage.recordKey.errorAccess')"
    >
      <div class="flex justify-end">
        <Button
          :variant="requestStatus ? 'pending' : 'primary'"
          @click="requestAccess()"
        >
          {{ t('settingsPage.recordKey.errorAccessButton') }}
        </Button>
      </div>
    </Alert>
    <CloudConnectModals
      v-if="connectDialog"
      :gql="props.gql"
      @close="connectDialog = false"
      @success="connectDialog = false"
      @cancel="connectDialog = false"
    />
  </SettingsSection>
</template>

<script lang="ts" setup>
import { computed, Ref, ref } from 'vue'
import { gql } from '@urql/core'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import Alert from '@cy/components/Alert.vue'
import Button from '@cy/components/Button.vue'
import SettingsSection from '../SettingsSection.vue'
import RecordKey from './RecordKey.vue'
import CloudConnectModals from '../../runs/modals/CloudConnectModals.vue'
import { RecordKeySettingsFragment, RecordKeySettings_RequestAccessDocument } from '../../generated/graphql'
import { useI18n } from '@cy/i18n'
import { useMutation } from '@urql/vue'

const { t } = useI18n()

gql`
fragment RecordKeySettings on Query {
  currentProject {
    id
    projectId
    cloudProject {
      __typename
      ... on CloudProject {
        id
        cloudProjectSettingsUrl
        recordKeys {
          id
          ...RecordKey
        }
      }
      ... on CloudProjectUnauthorized {
        hasRequestedAccess
      }
    }
  }
  ...CloudConnectModals
}
`

const connectDialog = ref(false)

const props = defineProps<{
  gql: RecordKeySettingsFragment
}>()

const cloudProject = computed(() => {
  return props.gql.currentProject?.cloudProject
})

gql`
mutation RecordKeySettings_RequestAccess( $projectId: String! ) {
  cloudProjectRequestAccess(projectSlug: $projectId)
}
`

const requestAccessMutation = useMutation(RecordKeySettings_RequestAccessDocument)

const requestStatus: Ref<undefined | 'sent' | 'pending' | 'success'> = ref()

async function requestAccess () {
  const projectId = props.gql.currentProject?.projectId

  if (projectId && !requestStatus.value) {
    requestStatus.value = 'sent'
    const res = await requestAccessMutation.executeMutation({ projectId })

    if (res.data?.cloudProjectRequestAccess) {
      requestStatus.value = 'pending'
    }
  }
}
</script>
