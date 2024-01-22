<template>
  <div class="pb-[8px]">
    <h1 class="font-medium text-center text-[32px] leading-snug text-body-gray-900">
      {{ t('migration.wizard.title', { version: cypressMajorVersion }) }}
    </h1>
    <p
      class="mt-2 text-lg text-center text-body-gray-600"
    >
      {{ t('migration.wizard.description') }}
    </p>
    <p class="flex mb-[24px] text-sm text-gray-700 justify-center items-center">
      <i-cy-clock_x16 class="mr-[8px] icon-dark-gray-700" />
      <span>{{ t('migration.wizard.typicalMigrationLabel') }}</span>
      <strong>&nbsp; {{ t('migration.wizard.typicalMigrationTime') }}</strong>
    </p>
    <template v-if="migration">
      <!-- used to ensure the wizard is actually rendered before running assertions-->
      <span data-cy="migration-wizard" />
      <MigrationStep
        :step="steps.find(step => step.name === 'renameAuto')"
        :title="t('migration.wizard.step1.title')"
        :description="t('migration.wizard.step1.description')"
      >
        <RenameSpecsAuto
          :gql="migration"
          @selectOption="(newVal) => selectedOption = newVal"
        />
        <template #footer>
          <Button
            size="40"
            @click="renameSpecs"
          >
            {{ buttonTitle }}
            <ArrowRightIcon class="ml-[8px] w-[16px] h-[16px] icon-dark-white" />
          </Button>
        </template>
      </MigrationStep>

      <MigrationStep
        :step="steps.find(step => step.name === 'renameManual')"
        :title="t('migration.wizard.step2.title')"
        :description="t('migration.wizard.step2.description')"
      >
        <RenameSpecsManual :gql="migration" />
        <template #footer>
          <div class="flex gap-[16px]">
            <Button
              v-if="migration.manualFiles?.completed"
              size="40"
              @click="finishedRenamingComponentSpecs"
            >
              {{ t('migration.wizard.step2.buttonDone') }}
              <ArrowRightIcon class="ml-[8px] w-[16px] h-[16px] icon-dark-white" />
            </Button>

            <Button
              v-else
              size="40"
              disabled
            >
              <template #prefix>
                <i-cy-loading_x16

                  class="animate-spin icon-dark-white icon-light-gray-400"
                />
              </template>
              {{ t('migration.wizard.step2.buttonWait') }}
            </Button>

            <Button
              v-if="!migration.manualFiles?.completed"
              size="40"
              variant="outline-light"
              @click="skipStep2"
            >
              {{ t('migration.wizard.step2.button') }}
            </Button>
          </div>
        </template>
      </MigrationStep>

      <MigrationStep
        :step="steps.find(step => step.name === 'renameSupport')"
        :title="t('migration.wizard.step3.title')"
        :description="t('migration.wizard.step3.description')"
      >
        <RenameSupport :gql="migration" />
        <template #footer>
          <Button
            size="40"
            data-cy="renameSupportButton"
            @click="launchRenameSupportFile"
          >
            {{ t('migration.wizard.step3.button') }}
            <ArrowRightIcon class="ml-[8px] w-[16px] h-[16px] icon-dark-white" />
          </Button>
        </template>
      </MigrationStep>

      <MigrationStep
        :step="steps.find(step => step.name === 'configFile')"
        :title="t('migration.wizard.step4.title')"
        :description="t('migration.wizard.step4.description')"
      >
        <ConvertConfigFile :gql="migration" />
        <template #footer>
          <Button
            size="40"
            data-cy="convertConfigButton"
            @click="convertConfig"
          >
            {{ t('migration.wizard.step4.button') }}
            <ArrowRightIcon class="ml-[8px] w-[16px] h-[16px] icon-dark-white" />
          </Button>
        </template>
      </MigrationStep>

      <MigrationStep
        :step="steps.find(step => step.name === 'setupComponent')"
        :title="t('migration.wizard.step5.title')"
        :description="t('migration.wizard.step5.description')"
      >
        <SetupComponentTesting />
        <template #footer>
          <Button
            size="40"
            data-cy="launchReconfigureButton"
            @click="launchReconfigureComponentTesting"
          >
            {{ t('migration.wizard.step5.button') }}
            <ArrowRightIcon class="w-[16px] h-[16px] icon-dark-white" />
          </Button>
        </template>
      </MigrationStep>
    </template>
    <Spinner
      v-else
      class="mx-auto mt-[100px]"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import { gql, useMutation, useQuery } from '@urql/vue'
import Spinner from '@cy/components/Spinner.vue'
import Button from '@cypress-design/vue-button'
import ArrowRightIcon from '~icons/cy/arrow-right_x16.svg'
import MigrationStep from './fragments/MigrationStep.vue'
import RenameSpecsAuto from './RenameSpecsAuto.vue'
import RenameSpecsManual from './RenameSpecsManual.vue'
import RenameSupport from './RenameSupport.vue'
import ConvertConfigFile from './ConvertConfigFile.vue'
import SetupComponentTesting from './SetupComponentTesting.vue'
import {
  MigrationWizardQueryDocument,
  MigrationWizard_ConvertFileDocument,
  MigrationWizard_FinishedRenamingComponentSpecsDocument,
  MigrationWizard_ReconfigureComponentTestingDocument,
  MigrationWizard_RenameSpecsDocument,
  MigrationWizard_RenameSupportDocument,
  MigrationWizard_SkipManualRenameDocument,
  MigrationWizard_RenameSpecsFolderDocument,
} from '../generated/graphql'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

gql`
fragment MigrationBaseError on Query {
  baseError {
    id
    ...BaseError
  }
}
`

gql`
fragment MigrationWizardData on Query {
  versions {
    current {
      id
      version
    }
  }
  migration {
    filteredSteps {
      id
      name
      ...MigrationStep
    }
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

// The requestPolicy needs to be cache-and-network because otherwise
// if a user visits 2 projects with migration data - is gonna show only the first data
const query = useQuery({ query: MigrationWizardQueryDocument, requestPolicy: 'cache-and-network', pause: true })

const migration = computed(() => query.data.value?.migration)
const steps = computed(() => migration.value?.filteredSteps || [])

onBeforeMount(async () => {
  await query.executeQuery()
})

// specs rename

const selectedOption = ref<'rename' | 'renameFolder' | 'skip'>()

gql`
mutation MigrationWizard_RenameSpecs($skip: Boolean, $before: [String!], $after: [String!]) {
  migrateRenameSpecs(skip: $skip, before: $before, after: $after) {
    ...MigrationBaseError
    migration {
      filteredSteps {
        id
        isCurrentStep
        isCompleted
      }
    }
  }
}
`

gql`
mutation MigrationWizard_RenameSpecsFolder {
  migrateRenameSpecsFolder {
    ...MigrationBaseError
    migration {
      ...ConvertConfigFile
      ...RenameSpecsManual
      filteredSteps {
        id
        isCurrentStep
        isCompleted
      }
    }
  }
}
`

const renameMutation = useMutation(MigrationWizard_RenameSpecsDocument)
const renameFolderMutation = useMutation(MigrationWizard_RenameSpecsFolderDocument)

function renameSpecs () {
  if (selectedOption.value === 'skip') {
    renameMutation.executeMutation({
      skip: true,
      before: null,
      after: null,
    })
  } else if (selectedOption.value === 'renameFolder') {
    renameFolderMutation.executeMutation({})
  } else {
    // we are renaming!
    interface BeforeAfterPairs {
      before: string[]
      after: string[]
    }

    const relativePath = (arr: Readonly<Array<{ text: string }>>) => arr.map((x) => x.text).join('')

    const result = migration.value?.specFiles?.reduce<BeforeAfterPairs>((acc, curr) => {
      return {
        before: acc.before.concat(relativePath(curr.before.parts)),
        after: acc.after.concat(relativePath(curr.after.parts)),
      }
    }, { before: [], after: [] })

    renameMutation.executeMutation({
      skip: false,
      before: result?.before || [],
      after: result?.after || [],
    })
  }
}

// manual rename

gql`
mutation MigrationWizard_SkipManualRename {
  migrateSkipManualRename {
    migration {
      filteredSteps {
        id
        isCurrentStep
        isCompleted
      }
    }
  }
}
`

const skipManualMutation = useMutation(MigrationWizard_SkipManualRenameDocument)

function skipStep2 () {
  skipManualMutation.executeMutation({})
}

// rename support files

gql`
mutation MigrationWizard_RenameSupport {
  migrateRenameSupport {
    migration {
      filteredSteps {
        id
        isCurrentStep
        isCompleted
      }
    }
  }
}
`

const renameSupportMutation = useMutation(MigrationWizard_RenameSupportDocument)

function launchRenameSupportFile () {
  renameSupportMutation.executeMutation({})
}

// done renaming component specs

gql`
mutation MigrationWizard_FinishedRenamingComponentSpecs {
  finishedRenamingComponentSpecs {
    migration {
      filteredSteps {
        id
        isCurrentStep
        isCompleted
      }
    }
  }
}
`

const finishedRenamingComponentSpecsMutation = useMutation(MigrationWizard_FinishedRenamingComponentSpecsDocument)

function finishedRenamingComponentSpecs () {
  finishedRenamingComponentSpecsMutation.executeMutation({})
}

// config file migration

gql`
mutation MigrationWizard_ConvertFile {
  migrateConfigFile {
    migration {
      filteredSteps{
        id
        isCurrentStep
        isCompleted
      }
    }
  }
}
`

const configMutation = useMutation(MigrationWizard_ConvertFileDocument)

function convertConfig () {
  configMutation.executeMutation({})
}

// launch reconfigure component testing

gql`
mutation MigrationWizard_ReconfigureComponentTesting {
  migrateComponentTesting {
    currentProject {
      id
      currentTestingType
      needsLegacyConfigMigration
    }
  }
}
`

const launchReconfigureMutation = useMutation(MigrationWizard_ReconfigureComponentTestingDocument)

function launchReconfigureComponentTesting () {
  launchReconfigureMutation.executeMutation({})
}

const buttonTitle = computed(() => {
  if (selectedOption.value === 'skip') {
    return t('migration.wizard.step1.buttonSkip')
  }

  if (selectedOption.value === 'renameFolder') {
    return t('migration.wizard.step1.buttonRenameFolder')
  }

  return t('migration.wizard.step1.button')
})

const cypressMajorVersion = computed(() => query.data.value?.versions?.current.version.split('.')[0] ?? '')
</script>
