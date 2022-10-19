<template>
  <template v-if="isManualUpdateOpen">
    <NeedManualUpdateModal
      v-if="props.gql.currentProject"
      :gql="props.gql.currentProject"
      :new-project-id="newProjectId"
      @cancel="emit('cancel')"
    />
  </template>
  <SelectCloudProjectModal
    v-else-if="props.gql.cloudViewer?.organizations?.nodes.length ?? 0 > 0"
    :gql="props.gql"
    show
    :utm-medium="props.utmMedium"
    :utm-content="props.utmContent"
    @update-project-id-failed="showManualUpdate"
    @success="emit('success')"
    @cancel="emit('cancel')"
  />
  <CreateCloudOrgModal
    v-else-if="props.gql.cloudViewer"
    :gql="props.gql.cloudViewer"
    @cancel="emit('cancel')"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import SelectCloudProjectModal from './SelectCloudProjectModal.vue'
import CreateCloudOrgModal from './CreateCloudOrgModal.vue'
import NeedManualUpdateModal from './NeedManualUpdateModal.vue'
import { gql, useSubscription } from '@urql/vue'
import type { CloudConnectModalsFragment } from '../../generated/graphql'
import { CloudConnectModals_MonitorCloudViewerDocument } from '../../generated/graphql'

gql`
fragment CloudConnectModals on Query {
  ...SelectCloudProjectModal
  cloudViewer {
    id
    ...CreateCloudOrgModal
    firstOrganization: organizations(first: 1) {
      nodes {
        id
      }
    }
  }
  currentProject{
    id
    ...NeedManualUpdateModal
  }
}
`

gql`
subscription CloudConnectModals_MonitorCloudViewer {
  cloudViewerChange {
    ...CloudConnectModals
  }
}
`

useSubscription({ query: CloudConnectModals_MonitorCloudViewerDocument })

const emit = defineEmits<{
  (event: 'success'): void
  (event: 'cancel'): void
}>()

const props = defineProps<{
  gql: CloudConnectModalsFragment
  utmMedium: string
  utmContent?: string
}>()

const newProjectId = ref('')
const isManualUpdateOpen = ref(false)

function showManualUpdate (projectId: string) {
  newProjectId.value = projectId
  isManualUpdateOpen.value = true
}
</script>
