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
import { gql } from '@urql/vue'
import type { CloudConnectModalsFragment } from '../../generated/graphql'

gql`
fragment CloudConnectModals on Query {
  ...SelectCloudProjectModal
  cloudViewer {
    id
    ...CreateCloudOrgModal
  }
  currentProject{
    id
    ...NeedManualUpdateModal
  }
}
`

const emit = defineEmits<{
  (event: 'success'): void
  (event: 'cancel'): void
}>()

const props = defineProps<{
  gql: CloudConnectModalsFragment
}>()

const newProjectId = ref('')
const isManualUpdateOpen = ref(false)

function showManualUpdate (projectId: string) {
  newProjectId.value = projectId
  isManualUpdateOpen.value = true
}
</script>
