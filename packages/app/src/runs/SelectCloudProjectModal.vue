<template>
  <StandardModal
    :title="newProject
      ? t('runs.connect.modal.selectProject.createProject')
      : t('runs.connect.modal.title')"
    :model-value="show"
  >
    <div class="w-640px">
      <Select
        :options="[]"
      >
        <template #label>
          <span class="flex justify-between items-center text-16px leading-24px font-normal">
            <span class="text-gray-800">
              {{ t('runs.connect.modal.selectProject.organization') }}
            </span>
            <ExternalLink
              class="my-8px cursor-pointer text-indigo-500 hover:underline"
              :href="organizationUrl"
            >
              {{ t('runs.connect.modal.selectProject.manageOrgs') }}
            </ExternalLink>
          </span>
        </template>
      </Select>
      <Select
        v-if="!newProject"
        class="mt-16px"
        :options="[]"
      >
        <template #label>
          <div class="flex justify-between items-center text-16px leading-24px font-normal">
            <p class="text-gray-800">
              {{ t('runs.connect.modal.selectProject.project') }}
            </p>
            <a
              class="my-8px cursor-pointer text-indigo-500 hover:underline"
              @click="newProject = true"
            >
              {{ t('runs.connect.modal.selectProject.createNewProject') }}
            </a>
          </div>
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
            <span class="text-gray-800">{{ t('runs.connect.modal.selectProject.projectName') }}</span>
            <span class="text-gray-500 ml-8px">{{ t('runs.connect.modal.selectProject.projectNameDisclaimer') }}</span>
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
import { ref } from 'vue'
import StandardModal from '@cy/components/StandardModal.vue'
import Button from '@cy/components/Button.vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import Select from '@cy/components/Select.vue'
import Input from '@cy/components/Input.vue'
import Radio from '@cy/components/Radio.vue'
import ConnectIcon from '~icons/cy/chain-link_x16.svg'
import CreateIcon from '~icons/cy/add-large_x16.svg'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (event: 'cancel'): void
}>()

const newProject = ref(false)
const projectName = ref('')
const projectAccess = ref<'private' | 'public'>('private')

const organizationUrl = '#'
</script>
