<template>
  <StandardModal
    :title="t('runs.connect.modal.title')"
    :model-value="show"
  >
    <div class="border border-dashed rounded border-gray-100 p-24px w-592px ">
      <p class="text-center text-gray-700">
        {{ t('runs.connect.modal.createOrg.description') }}
      </p>
      <ExternalLink
        class="mx-auto mt-16px"
        :href="createOrgUrl"
        :prefix-icon="OrganizationIcon"
        prefix-icon-class="icon-light-transparent icon-dark-white"
      >
        {{ t('runs.connect.modal.createOrg.button') }}
      </ExternalLink>
    </div>
    <template #footer>
      <div class="flex gap-16px">
        <Button
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
import StandardModal from '@cy/components/StandardModal.vue'
import Button from '@cy/components/Button.vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import OrganizationIcon from '~icons/cy/office-building_x16.svg'
import { useI18n } from '@cy/i18n'
import { ref } from 'vue'

const { t } = useI18n()

const emit = defineEmits<{
  (event: 'cancel'): void
}>()

const show = ref(true)

// TODO: https://dashboard-staging.cypress.io/organizations/new
const createOrgUrl = '#'
</script>
