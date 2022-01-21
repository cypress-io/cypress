<template>
  <h1 class="font-medium text-center pt-20px text-32px text-body-gray-900">
    {{ t('migration.wizard.title') }}
  </h1>
  <p
    class="mx-42px mt-12px text-center mb-32px text-body-gray-600 text-18px"
  >
    {{ t('migration.wizard.description') }}
  </p>
  <template v-if="migration">
    <MigrationStep
      step="renameAuto"
      :current-step="migration.step"
      :title="t('migration.wizard.step1.title')"
      :description="t('migration.wizard.step1.description')"
    >
      <RenameSpecsAuto
        :gql="migration"
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
      step="renameManual"
      :current-step="migration.step"
      :title="t('migration.wizard.step2.title')"
      :description="t('migration.wizard.step2.description')"
    >
      <RenameSpecsManual :gql="migration" />
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
      step="renameSupport"
      :current-step="migration.step"
      :title="t('migration.wizard.step3.title')"
      :description="t('migration.wizard.step3.description')"
    >
      <RenameSupport :gql="migration" />
      <template #footer>
        <Button
          data-cy="renameSupportButton"
          @click="launchRenameSupportFile"
        >
          {{ t('migration.wizard.step3.button') }}
        </Button>
      </template>
    </MigrationStep>
    <MigrationStep
      step="configFile"
      :current-step="migration.step"
      :title="t('migration.wizard.step4.title')"
      :description="t('migration.wizard.step4.description')"
    >
      <ConvertConfigFile :gql="migration" />
      <template #footer>
        <Button
          data-cy="convertConfigButton"
          @click="convertConfig"
        >
          {{ t('migration.wizard.step4.button') }}
        </Button>
      </template>
    </MigrationStep>
    <MigrationStep
      step="setupComponent"
      :current-step="migration.step"
      :title="t('migration.wizard.step3.title')"
      :description="t('migration.wizard.step3.description')"
    >
      <SetupComponentTesting />
      <template #footer>
        <Button
          data-cy="launchReconfigureButton"
          @click="launchReconfigureComponentTesting"
        >
          {{ t('migration.wizard.step5.button') }}
        </Button>
      </template>
    </MigrationStep>
  </template>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { gql, useMutation, useQuery } from '@urql/vue'
import { MIGRATION_STEPS } from '@packages/types'
import Button from '@cy/components/Button.vue'
import MigrationStep from './fragments/MigrationStep.vue'
import RenameSpecsAuto from './RenameSpecsAuto.vue'
import RenameSpecsManual from './RenameSpecsManual.vue'
import RenameSupport from './RenameSupport.vue'
import ConvertConfigFile from './ConvertConfigFile.vue'
import SetupComponentTesting from './SetupComponentTesting.vue'
import { MigrationWizardQueryDocument } from '../generated/graphql'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

gql`
fragment MigrationWizardData on Query {
  migration {
    step
    ...RenameSpecsAuto
    ...RenameSpecsManual
    ...RenameSupport
    ...ConvertConfigFile
  }
}`

gql`
query MigrationWizardQuery {
  ...MigrationWizardData
}
`

const query = useQuery({ query: MigrationWizardQueryDocument })

const migration = computed(() => query.data.value?.migration)

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
mutation MigrationWizard_SkipManualRename {
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

// rename support files

const renameSupportFileMutation = gql`
mutation MigrationWizard_RenameSupport {
  migrateRenameSupport {
    migration {
      step
    }
  }
}
`

const renameSupportMutation = useMutation(renameSupportFileMutation)

function launchRenameSupportFile () {
  renameSupportMutation.executeMutation({})
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

// launch reconfigure component testing

const launchReconfigureCTMutation = gql`
mutation MigrationWizard_ReconfigureComponentTesting {
  migrateComponentTesting
}
`

const launchReconfigureMutation = useMutation(launchReconfigureCTMutation)

function launchReconfigureComponentTesting () {
  launchReconfigureMutation.executeMutation({})
}
</script>
