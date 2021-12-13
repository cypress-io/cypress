<template>
  <h1 class="font-medium text-center pt-20px text-32px text-body-gray-900">
    {{ t('migration.wizard.title') }}
  </h1>
  <p
    class="mx-42px mt-12px text-center text-body-gray-600 text-18px"
  >
    {{ t('migration.wizard.description') }}
  </p>

  <MigrationStep
    checked
    :step="1"
    :title="t('migration.wizard.step1.title')"
    :description="t('migration.wizard.step1.description')"
  >
    <RenameSpecsAuto />
    <template #footer>
      <Button
        @click="renameSpecs"
      >
        {{ t('migration.wizard.step1.button') }}
      </Button>
    </template>
  </MigrationStep>
  <MigrationStep
    open
    :step="2"
    :title="t('migration.wizard.step2.title')"
    :description="t('migration.wizard.step2.description')"
  >
    <RenameSpecsManual />
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
          t('migration.wizard.step2.buttonWait')
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
    :step="3"
    :title="t('migration.wizard.step3.title')"
    :description="t('migration.wizard.step3.description')"
  >
    <ConvertConfigFile />
    <template #footer>
      <Button
        @click="convertConfig"
      >
        {{ t('migration.wizard.step3.button') }}
      </Button>
    </template>
  </MigrationStep>
</template>

<script setup lang="ts">
import Button from '@cy/components/Button.vue'
import MigrationStep from './fragments/MigrationStep.vue'
import RenameSpecsAuto from './RenameSpecsAuto.vue'
import RenameSpecsManual from './RenameSpecsManual.vue'
import ConvertConfigFile from './ConvertConfigFile.vue'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

function renameSpecs () {

}

function skipStep2 () {

}

function convertConfig () {

}
</script>
