<template>
  <StandardModal
    :model-value="show"
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
        :error="noPickedOrganizationError"
      >
        <template #label>
          <span class="flex items-end text-16px font-normal my-8px leading-24px">
            <span class="">
              {{ t('runs.connect.modal.selectProject.organization') }}
            </span>
            <span
              v-if="noPickedOrganizationError"
              class="ml-8px text-red-400 text-14px leading-22px"
            >
              {{ t('runs.connect.modal.selectProject.noOrganizationSelectedError') }}
            </span>
            <ExternalLink
              class="flex-grow text-right cursor-pointer text-indigo-500 hover:underline"
              :href="organizationUrl"
            >
              {{ t('runs.connect.modal.selectProject.manageOrgs') }}
            </ExternalLink>
          </span>
        </template>
        <template #input-prefix>
          <OrganizationIcon class="icon-dark-gray-500 h-16px w-16px" />
        </template>
        <template #item-prefix>
          <OrganizationIcon class="icon-dark-gray-500 h-16px w-16px" />
        </template>
      </Select>
      <Select
        v-if="!newProject"
        v-model="pickedProject"
        class="mt-16px transition-all"
        :class="pickedOrganization ? undefined : 'opacity-50'"
        :options="projects"
        item-value="slug"
        item-key="id"
        :disabled="!pickedOrganization"
        :placeholder="projectPlaceholder"
        data-cy="selectProject"
      >
        <template #label>
          <div class="flex items-center text-16px leading-24px font-normal">
            <p class="text-gray-800">
              {{ t('runs.connect.modal.selectProject.project') }}
            </p>
            <span class="text-red-500 ml-4px">*</span>
            <a
              class="my-8px flex-grow text-right cursor-pointer text-indigo-500 hover:underline"
              @click="newProject = true"
            >
              {{ t('runs.connect.modal.selectProject.createNewProject') }}
            </a>
          </div>
        </template>
        <template #input-prefix>
          <FolderIcon class="icon-dark-gray-500 h-16px w-16px" />
        </template>
        <template #item-prefix>
          <FolderIcon class="icon-dark-gray-500 h-16px w-16px" />
        </template>
      </Select>
      <template v-else>
        <div
          class="mt-24px flex text-16px leading-24px items-center font-normal"
        >
          <label
            class="flex-grow"
            for="projectName"
          >
            <span class="text-gray-800">
              {{ t('runs.connect.modal.selectProject.projectName') }}
            </span>
            <span class="text-red-500 ml-4px">*</span>
            <span class="text-gray-500 ml-8px">
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
          class="mt-8px"
          input-classes="h-38px"
          :model-value="projectName"
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
          @click="createProject"
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
import { gql } from '@urql/vue'
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
import { useI18n } from '@cy/i18n'
import type { SelectCloudProjectModalFragment } from '../generated/graphql'

const { t } = useI18n()

gql`
fragment SelectCloudProjectModal on CloudUser {
  id
  organizations(first: 10) {
    nodes {
      id
      name
      projects(first: 10) {
        nodes {
          id
          slug
        }
      }
    }
  }
}
`

const props = defineProps<{
  show: boolean,
  gql: SelectCloudProjectModalFragment,
}>()

const emit = defineEmits<{
  (event: 'cancel'): void
}>()

const newProject = ref(false)
const projectName = ref('')
const projectAccess = ref<'private' | 'public'>('private')
const organizations = computed(() => {
  return props.gql.organizations?.nodes.map((org) => {
    return {
      ...org,
      icon: FolderIcon,
    }
  }) || []
})
const pickedOrganization = ref(props.gql.organizations?.nodes.length === 1 ? props.gql.organizations.nodes[0] : undefined)
const watchingPickedOrganizationError = ref(false)
const noPickedOrganizationError = computed(() => {
  return watchingPickedOrganizationError.value && !pickedOrganization.value
})

const projects = computed(() => pickedOrganization.value?.projects?.nodes || [])
const pickedProject = ref()

const orgPlaceholder = t('runs.connect.modal.selectProject.placeholderOrganizations')
const projectPlaceholder = computed(() => {
  return pickedOrganization.value
    ? t('runs.connect.modal.selectProject.placeholderProjects')
    : t('runs.connect.modal.selectProject.placeholderProjectsPending')
})

// TODO: update this url with one coming from gql
const organizationUrl = '#'

function createProject () {
  if (pickedOrganization.value) {
    // eslint-disable-next-line no-console
    console.log('mutate to create a project')
  } else {
    watchingPickedOrganizationError.value = true
  }
}
</script>
