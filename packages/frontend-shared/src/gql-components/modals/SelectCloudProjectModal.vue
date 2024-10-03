<template>
  <StandardModal
    model-value
    :title="newProject
      ? t('runs.connect.modal.selectProject.createProject')
      : t('runs.connect.modal.title')"
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
      class="w-[640px]"
    >
      <Alert
        v-if="graphqlError"
        :v-model="Boolean(graphqlError)"
        status="error"
        :title="isInternalServerError ? t('runs.connect.errors.internalServerError.title') : t('runs.connect.errors.baseError.title')"
        class="mb-[16px]"
        :icon="WarningIcon"
        :dismissible="isInternalServerError"
      >
        <p v-if="!isInternalServerError">
          {{ graphqlError.message }}
        </p>
        <i18n-t
          v-else
          scope="global"
          keypath="runs.connect.errors.internalServerError.description"
        >
          <ExternalLink href="https://www.cypressstatus.com/">
            {{ t('runs.connect.errors.internalServerError.link') }}
          </ExternalLink>
        </i18n-t>
      </Alert>
      <Select
        v-model="pickedOrganization"
        :options="organizationOptions"
        item-value="name"
        item-key="id"
        label-id="organization-label"
        :placeholder="orgPlaceholder"
        data-cy="selectOrganization"
      >
        <template #label>
          <span class="flex font-normal my-[8px] text-[16px] leading-[24px] items-end justify-between">
            <span
              id="organization-label"
              class=""
            >
              {{ t('runs.connect.modal.selectProject.organization') }}
            </span>
            <ExternalLink
              v-if="organizationUrl"
              class="cursor-pointer text-right text-indigo-500 hover:underline"
              :href="organizationUrl"
            >
              {{ t('runs.connect.modal.selectProject.manageOrgs') }}
            </ExternalLink>
          </span>
        </template>
        <template #input-prefix>
          <OrganizationIcon class="h-[16px] w-[16px] icon-dark-gray-500" />
        </template>
        <template #item-prefix>
          <OrganizationIcon class="h-[16px] w-[16px] icon-dark-gray-500" />
        </template>
      </Select>
      <Select
        v-if="!newProject"
        v-model="pickedProject"
        class="mt-[16px] transition-all"
        :class="pickedOrganization ? undefined : 'opacity-50'"
        :options="projectOptions"
        item-value="name"
        item-key="id"
        label-id="project-label"
        :disabled="!pickedOrganization"
        :placeholder="projectPlaceholder"
        data-cy="selectProject"
      >
        <template #label>
          <div class="flex font-normal text-[16px] leading-[24px] items-center justify-between">
            <p
              id="project-label"
              class="text-gray-800"
            >
              {{ t('runs.connect.modal.selectProject.project') }}
              <span class="text-red-500">*</span>
            </p>
            <a
              class="cursor-pointer my-[8px] text-right text-indigo-500 hover:underline"
              @click="newProject = true"
            >
              {{ t('runs.connect.modal.selectProject.createNewProject') }}
            </a>
          </div>
        </template>
        <template #input-prefix>
          <FolderIcon class="h-[16px] w-[16px] icon-dark-gray-500" />
        </template>
        <template #item-prefix>
          <FolderIcon class="h-[16px] w-[16px] icon-dark-gray-500" />
        </template>
      </Select>
      <template v-else>
        <div
          class="flex font-normal mt-[24px] text-[16px] leading-[24px] items-center"
        >
          <label
            class="grow"
            for="projectName"
          >
            <span class="text-gray-800">
              {{ t('runs.connect.modal.selectProject.projectName') }}
            </span>
            <span class="ml-[4px] text-red-500">*</span>
            <span class="ml-[8px] text-gray-500">
              {{ t('runs.connect.modal.selectProject.projectNameDisclaimer') }}
            </span>
          </label>
          <a
            v-if="projectOptions.length > 0"
            class="cursor-pointer text-indigo-500 hover:underline"
            @click="newProject = false"
          >
            {{ t('runs.connect.modal.selectProject.chooseExistingProject') }}
          </a>
        </div>
        <Input
          id="projectName"
          v-model="projectName"
          class="mt-[8px]"
          input-classes="h-[38px]"
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
    <template
      v-if="isOnline"
      #footer
    >
      <div class="flex gap-[16px]">
        <Button
          size="lg"
          :prefix-icon="newProject ? CreateIcon : ConnectIcon"
          prefix-icon-class="icon-dark-white"
          :disabled="disableButton"
          data-cy="connect-project"
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
import { computed, ref, watch } from 'vue'
import { gql, useMutation } from '@urql/vue'
import StandardModal from '@cy/components/StandardModal.vue'
import Button from '@cy/components/Button.vue'
import ExternalLink from '../ExternalLink.vue'
import Select from '@cy/components/Select.vue'
import Input from '@cy/components/Input.vue'
import Radio from '@cy/components/Radio.vue'
import NoInternetConnection from '@cy/components/NoInternetConnection.vue'
import Alert from '@cy/components/Alert.vue'
import ConnectIcon from '~icons/cy/chain-link_x16.svg'
import CreateIcon from '~icons/cy/add-large_x16.svg'
import FolderIcon from '~icons/cy/folder-outline_x16.svg'
import OrganizationIcon from '~icons/cy/office-building_x16.svg'
import { SelectCloudProjectModal_CreateCloudProjectDocument, SelectCloudProjectModal_SetProjectIdDocument } from '../../generated/graphql'
import type { SelectCloudProjectModalFragment } from '../../generated/graphql'
import { useI18n } from '@cy/i18n'
import { isEqual, sortBy } from 'lodash'
import { useOnline } from '@vueuse/core'
import WarningIcon from '~icons/cy/warning_x16.svg'
import { clearPendingError } from '@packages/frontend-shared/src/graphql/urqlClient'
import { getUtmSource } from '@packages/frontend-shared/src/utils/getUtmSource'

const { t } = useI18n()
const online = useOnline()

gql`
fragment CloudProjectNode on CloudProject {
  id
  slug
  name
}
`

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
            ...CloudProjectNode
          }
        }
      }
    }
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
              createdAt
              status
              totalDuration
              url
              tags {
                id
                name
              }
              totalPassed
              totalFailed
              totalPending
              totalSkipped
              totalFlakyTests
              commitInfo {
                authorName
                authorEmail
                summary
                branch
              }
            }
          }
        }
      }
    }
  }
}
`

gql`
mutation SelectCloudProjectModal_CreateCloudProject( $name: String!, $orgId: ID!, $public: Boolean!, $campaign: String, $cohort: String, $medium: String, $source: String! ) {
  cloudProjectCreate(name: $name, orgId: $orgId, public: $public, campaign: $campaign, cohort: $cohort, medium: $medium, source: $source) {
    id
    slug
  }
}
`

const props = defineProps<{
  gql: SelectCloudProjectModalFragment
  utmMedium: string
  utmContent?: string
}>()

const emit = defineEmits<{
  (event: 'success'): void
  (event: 'cancel'): void
  (event: 'update-projectId-failed', projectId: string): void
}>()

const isInternalServerError = ref(false)
const graphqlError = ref<{ extension: string, message: string} | undefined>()
const projectName = ref(props.gql.currentProject?.title || '')
const projectAccess = ref<'private' | 'public'>('private')
const organizationOptions = computed(() => {
  const options = props.gql.cloudViewer?.organizations?.nodes?.map((org) => {
    return {
      id: org.id,
      name: org.name,
      icon: FolderIcon,
    }
  })

  return sortBy(options || [], 'name')
})
const pickedOrganization = ref(organizationOptions.value.length >= 1 ? organizationOptions.value[0] : undefined)

const projectOptions = computed(() => {
  const organization = props.gql.cloudViewer?.organizations?.nodes?.find((org) => org.id === pickedOrganization?.value?.id)
  const options = organization?.projects?.nodes?.map((project) => {
    return {
      id: project.id,
      name: project.name,
      slug: project.slug,
    }
  })

  return sortBy(options || [], 'name')
})
const newProject = ref(projectOptions.value.length === 0)
const pickedProject = ref<typeof projectOptions.value[number]>()

watch(projectOptions, (newVal, oldVal) => {
  // avoid unselecting currently chosen project
  // can happen when gql updates due to polling
  if (isEqual(newVal, oldVal)) {
    return
  }

  if (newVal.length === 1) {
    pickedProject.value = newVal[0]
  } else {
    pickedProject.value = newVal.find((p) => p.name === projectName.value)
  }

  newProject.value = newVal.length === 0
}, {
  immediate: true,
})

const orgPlaceholder = t('runs.connect.modal.selectProject.placeholderOrganizations')
const projectPlaceholder = computed(() => {
  return pickedOrganization.value
    ? t('runs.connect.modal.selectProject.placeholderProjects')
    : t('runs.connect.modal.selectProject.placeholderProjectsPending')
})

const organizationUrl = computed(() => props.gql.cloudViewer?.cloudOrganizationsUrl)

const createCloudProjectMutation = useMutation(SelectCloudProjectModal_CreateCloudProjectDocument)
const setProjectIdMutation = useMutation(SelectCloudProjectModal_SetProjectIdDocument)

async function createOrConnectProject () {
  let projectId: string | undefined

  const isNewProject = Boolean(newProject.value && pickedOrganization.value)

  if (isNewProject) {
    const { data, error } = await createCloudProjectMutation.executeMutation({
      orgId: pickedOrganization.value!.id,
      name: projectName.value,
      public: projectAccess.value === 'public',
      campaign: 'Create project',
      cohort: props.utmContent || '',
      medium: props.utmMedium,
      source: getUtmSource(),
    })

    if (error?.graphQLErrors.length) {
      const err = error.graphQLErrors[0]

      const extension = err.extensions?.code

      isInternalServerError.value = extension === 'INTERNAL_SERVER_ERROR'

      graphqlError.value = {
        extension,
        message: err.message,
      }

      clearPendingError()
    } else {
      graphqlError.value = undefined
    }

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

const isOnline = computed(() => online.value)

const disableButton = computed(() => {
  if (newProject.value) {
    return !projectName.value
  }

  return !pickedProject.value
})

</script>
