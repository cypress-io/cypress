<template>
  <StandardModal
    model-value
    :title="newProject
      ? t('runs.connect.modal.selectProject.createProject')
      : t('runs.connect.modal.title')"
    @update:model-value="emit('cancel')"
  >
    <div class="w-640px">
      <Select
        v-model="pickedOrganization"
        :options="organizations"
        item-value="name"
        item-key="id"
        :placeholder="orgPlaceholder"
        data-cy="selectOrganization"
      >
        <template #label>
          <span class="flex font-normal my-8px text-16px leading-24px items-end">
            <span class="">
              {{ t('runs.connect.modal.selectProject.organization') }}
            </span>
            <ExternalLink
              class="cursor-pointer flex-grow text-right text-indigo-500 hover:underline"
              :href="organizationUrl"
            >
              {{ t('runs.connect.modal.selectProject.manageOrgs') }}
            </ExternalLink>
          </span>
        </template>
        <template #input-prefix>
          <OrganizationIcon class="h-16px w-16px icon-dark-gray-500" />
        </template>
        <template #item-prefix>
          <OrganizationIcon class="h-16px w-16px icon-dark-gray-500" />
        </template>
      </Select>
      <Select
        v-if="!newProject && projects.length > 0"
        v-model="pickedProject"
        class="mt-16px transition-all"
        :class="pickedOrganization ? undefined : 'opacity-50'"
        :options="projects"
        item-value="name"
        item-key="id"
        :disabled="!pickedOrganization"
        :placeholder="projectPlaceholder"
        data-cy="selectProject"
      >
        <template #label>
          <div class="flex font-normal text-16px leading-24px items-center">
            <p class="text-gray-800">
              {{ t('runs.connect.modal.selectProject.project') }}
            </p>
            <span class="ml-4px text-red-500">*</span>
            <a
              class="cursor-pointer flex-grow my-8px text-right text-indigo-500 hover:underline"
              @click="newProject = true"
            >
              {{ t('runs.connect.modal.selectProject.createNewProject') }}
            </a>
          </div>
        </template>
        <template #input-prefix>
          <FolderIcon class="h-16px w-16px icon-dark-gray-500" />
        </template>
        <template #item-prefix>
          <FolderIcon class="h-16px w-16px icon-dark-gray-500" />
        </template>
      </Select>
      <template v-else>
        <div
          class="flex font-normal mt-24px text-16px leading-24px items-center"
        >
          <label
            class="flex-grow"
            for="projectName"
          >
            <span class="text-gray-800">
              {{ t('runs.connect.modal.selectProject.projectName') }}
            </span>
            <span class="ml-4px text-red-500">*</span>
            <span class="ml-8px text-gray-500">
              {{ t('runs.connect.modal.selectProject.projectNameDisclaimer') }}
            </span>
          </label>
          <a
            class="cursor-pointer text-indigo-500 hover:underline"
            @click="newProject = false"
          >
            {{ t('runs.connect.modal.selectProject.chooseExistsingProject') }}
          </a>
        </div>
        <Input
          id="projectName"
          v-model="projectName"
          class="mt-8px"
          input-classes="h-38px"
          :prefix-icon="FolderIcon"
          prefix-icon-classes="icon-dark-gray-500"
        />
        <Radio
          v-model:value="projectAccess"
          name="projectAccess"
          :label="t('runs.connect.modal.selectProject.newProjectAccess')"
          :options="[
            {
              label: t('runs.connect.modal.selectProject.privateLabel'),
              description: t('runs.connect.modal.selectProject.privateDescription'),
              value: 'private',
            },
            {
              label: t('runs.connect.modal.selectProject.publicLabel'),
              description: t('runs.connect.modal.selectProject.publicDescription'),
              value: 'public',
            },
          ]"
        />
      </template>
    </div>
    <template #footer>
      <div class="flex gap-16px">
        <Button
          size="lg"
          :prefix-icon="newProject ? CreateIcon : ConnectIcon"
          prefix-icon-class="icon-dark-white"
          @click="createOrConnectProject"
        >
          {{ newProject
            ? t('runs.connect.modal.selectProject.createProject')
            : t('runs.connect.modal.selectProject.connectProject') }}
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
import { computed, ref } from 'vue'
import { gql, useMutation } from '@urql/vue'
import StandardModal from '@cy/components/StandardModal.vue'
import Button from '@cy/components/Button.vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import Select from '@cy/components/Select.vue'
import Input from '@cy/components/Input.vue'
import Radio from '@cy/components/Radio.vue'
import ConnectIcon from '~icons/cy/chain-link_x16.svg'
import CreateIcon from '~icons/cy/add-large_x16.svg'
import FolderIcon from '~icons/cy/folder-outline_x16.svg'
import OrganizationIcon from '~icons/cy/office-building_x16.svg'
import { SelectCloudProjectModalFragment, SelectCloudProjectModal_CreateCloudProjectDocument } from '../../generated/graphql'
import { SelectCloudProjectModal_SetProjectIdDocument } from '@packages/data-context/src/gen/all-operations.gen'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

gql`
fragment SelectCloudProjectModal on Query {
  cloudViewer {
    id
    cloudOrganizationsUrl
    organizations(first: 100) { # Not expecting there will be > 100 orgs for a user. If there are we will implement pagination
      nodes {
        id
        name
        projects(first: 100) { # Not expecting there will be > 100 projects. If there are we will implement pagination
          nodes {
            id
            slug
            name
          }
        }
      }
    }
    ...CreateCloudOrgModal
  }
  currentProject{
    id
    title
    ...NeedManualUpdateModal
  }
}
`

gql`
mutation SelectCloudProjectModal_SetProjectId( $projectId: String! ) {
  setProjectIdInConfigFile(projectId: $projectId) {
    currentProject{
      id
      projectId
      cloudProject {
        __typename
        ... on CloudProject {
          id
          runs(first: 10) {
            nodes {
              id
              ...RunCard
            }
          }
        }
      }
    }
  }
}
`

gql`
mutation SelectCloudProjectModal_CreateCloudProject( $name: String!, $orgId: ID!, $public: Boolean! ) {
  cloudProjectCreate(name: $name, orgId: $orgId, public: $public) {
    id
    slug
  }
}
`

const props = defineProps<{
  gql: SelectCloudProjectModalFragment,
}>()

const emit = defineEmits<{
  (event: 'success'): void
  (event: 'cancel'): void
  (event: 'update-projectId-failed', projectId: string): void
}>()

const newProject = ref(false)
const projectName = ref(props.gql.currentProject?.title || '')
const projectAccess = ref<'private' | 'public'>('private')
const organizations = computed(() => {
  return props.gql.cloudViewer?.organizations?.nodes.map((org) => {
    return {
      ...org,
      icon: FolderIcon,
    }
  }) || []
})
const pickedOrganization = ref(organizations.value.length >= 1 ? organizations.value[0] : undefined)

const projects = computed(() => pickedOrganization.value?.projects?.nodes || [])
const pickedProject = ref()

const orgPlaceholder = t('runs.connect.modal.selectProject.placeholderOrganizations')
const projectPlaceholder = computed(() => {
  return pickedOrganization.value
    ? t('runs.connect.modal.selectProject.placeholderProjects')
    : t('runs.connect.modal.selectProject.placeholderProjectsPending')
})

const organizationUrl = computed(() => props.gql.cloudViewer?.cloudOrganizationsUrl ?? '#')

const createCloudProjectMutation = useMutation(SelectCloudProjectModal_CreateCloudProjectDocument)
const setProjectIdMutation = useMutation(SelectCloudProjectModal_SetProjectIdDocument)

async function createOrConnectProject () {
  let projectId: string | undefined

  if (newProject.value && pickedOrganization.value) {
    const { data } = await createCloudProjectMutation.executeMutation({
      orgId: pickedOrganization.value.id,
      name: projectName.value,
      public: projectAccess.value === 'public',
    })

    projectId = data?.cloudProjectCreate?.slug
  } else {
    projectId = pickedProject.value?.slug
  }

  if (projectId) {
    const { data } = await setProjectIdMutation.executeMutation({ projectId })

    const updatedProjectId = data?.setProjectIdInConfigFile?.currentProject?.projectId

    if (updatedProjectId === projectId) {
      emit('success') // close the popup and show success alert
    } else {
      emit('update-projectId-failed', projectId)
    }
  }
}
</script>
