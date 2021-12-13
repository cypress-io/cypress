<template>
  <MigrationStep
    checked
    :step="1"
    :title="'Automatically rename existing specs'"
    :description="'In this step, we\'ll automatically rename and move your existing spec files.'"
  >
    <RenameSpecsAuto />
    <template #footer>
      <Button
        @click="renameSpecs"
      >
        Rename these specs for me
      </Button>
    </template>
  </MigrationStep>
  <MigrationStep
    open
    :step="2"
    :title="'Manually move your existing component specs'"
    :description="'In this step, you\'ll manually move your existing component specs to their new default location.'"
  >
    <RenameSpecsManual />
    <template #footer>
      <Button>
        <template #prefix>
          <i-cy-loading_x16

            class="animate-spin icon-dark-white icon-light-gray-400"
          />
        </template>
        Waiting for you to move your component specs...
      </Button>
      <Button
        variant="outline"
        class="ml-24px"
        @click="skipStep2"
      >
        I'll do this later
      </Button>
    </template>
  </MigrationStep>
  <MigrationStep
    :step="3"
    :title="'Automatically migrate the Cypress configuration file'"
    :description="'In this step, we\'ll automatically migrate your existing cypress configuration to the new Cypress configuration file.'"
  >
    <ConvertConfigFile />
    <template #footer>
      <Button
        @click="convertConfig"
      >
        Migrate and continue
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

function renameSpecs () {

}

function skipStep2 () {

}

function convertConfig () {

}
</script>
