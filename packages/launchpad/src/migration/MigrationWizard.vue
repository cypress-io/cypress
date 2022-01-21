<template>
  <h1 class="font-medium text-center pt-20px text-32px text-body-gray-900">
    {{ t('migration.wizard.title') }}
  </h1>
  <p
    class="mx-42px mt-12px text-center mb-32px text-body-gray-600 text-18px"
  >
    {{ t('migration.wizard.description') }}
  </p>
  <template v-if="query.data.value?.migration">
    <MigrationStep
      :open="migration.step === 'renameAuto'"
      :checked="migration.step !== 'renameAuto'"
      :step="1"
      :title="t('migration.wizard.step1.title')"
      :description="t('migration.wizard.step1.description')"
    >
      <RenameSpecsAuto
        :gql="query.data.value?.migration"
        @skipChange="(newVal) => skipRename = newVal"
      />
      <template #footer>
        <Button
          @click="renameSpecs"
        >
          {{ skipRename ? t('migration.wizard.step1.buttonSkip') : t('migration.wizard.step1.button') }}
        </Button>
      </template>
    </MigrationStep>
    <MigrationStep
      :open="migration.step === 'renameManual'"
      :checked="migration.step === 'configFile'"
      :step="2"
      :title="t('migration.wizard.step2.title')"
      :description="t('migration.wizard.step2.description')"
    >
      <RenameSpecsManual :gql="query.data.value?.migration" />
      <template #footer>
        <div class="flex gap-16px">
          <Button
            disabled
            variant="pending"
          >
            <template #prefix>
              <i-cy-loading_x16

                class="animate-spin icon-dark-white icon-light-gray-400"
              />
            </template>
            {{ t('migration.wizard.step2.buttonWait') }}
          </Button>
          <Button
            variant="outline"
            @click="skipStep2"
          >
            {{ t('migration.wizard.step2.button') }}
          </Button>
        </div>
      </template>
    </MigrationStep>
    <MigrationStep
      :open="migration.step === 'configFile'"
      :step="3"
      :title="t('migration.wizard.step3.title')"
      :description="t('migration.wizard.step3.description')"
    >
      <ConvertConfigFile :gql="query.data.value?.migration" />
      <template #footer>
        <Button
          data-cy="convertConfigButton"
          @click="convertConfig"
        >
          {{ t('migration.wizard.step3.button') }}
        </Button>
      </template>
    </MigrationStep>
  </template>
</template>

<script setup lang="ts">
import Button from '@cy/components/Button.vue'
import MigrationStep from './fragments/MigrationStep.vue'
import RenameSpecsAuto from './RenameSpecsAuto.vue'
import RenameSpecsManual from './RenameSpecsManual.vue'
import ConvertConfigFile from './ConvertConfigFile.vue'
import { useI18n } from '@cy/i18n'
import { gql, useMutation, useQuery } from '@urql/vue'
import { MigrationWizardQueryDocument } from '../generated/graphql'
import { computed, ref } from 'vue'

const { t } = useI18n()

gql`
fragment MigrationWizardData on Query {
  migration {
    step
    ...RenameSpecsAuto
    ...RenameSpecsManual
    ...ConvertConfigFile
  }
}`

gql`
query MigrationWizardQuery {
  ...MigrationWizardData
}
`

const query = useQuery({ query: MigrationWizardQueryDocument })

const migration = computed(() => query.data.value?.migration ?? { step: 'renameAuto' })

// specs rename

const skipRename = ref(false)

const renameSpecsMutation = gql`
mutation MigrationWizard_RenameSpecs($skip: Boolean) {
  migrateRenameSpecs(skip: $skip){
    migration {
      step
    }
  }
}
`

const renameMutation = useMutation(renameSpecsMutation)

function renameSpecs () {
  renameMutation.executeMutation({ skip: skipRename.value })
}

// manual rename

const skipManualRenameMutation = gql`
mutation MigrationWizard_ConvertFile {
  migrateSkipManualRename {
    migration {
      step
    }
  }
}
`

const skipManualMutation = useMutation(skipManualRenameMutation)

function skipStep2 () {
  skipManualMutation.executeMutation({})
}

// config file migration

const convertConfigMutation = gql`
mutation MigrationWizard_ConvertFile {
  migrateConfigFile
}
`

const configMutation = useMutation(convertConfigMutation)

function convertConfig () {
  configMutation.executeMutation({})
}

</script>
