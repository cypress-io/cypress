<template>
  <SettingsSection
    data-cy="settings-experiments"
  >
    <template #title>
      {{ t('settingsPage.experiments.title') }}
    </template>
    <template #description>
      <i18n-t
        scope="global"
        keypath="settingsPage.experiments.description"
      >
        <ExternalLink
          href="https://on.cypress.io/experiments"
        >
          {{ t('links.learnMore') }}
        </ExternalLink>
      </i18n-t>
    </template>
    <div
      class="border rounded mx-auto border-gray-100 grid px-[24px] gap-0 align-center first:border-t-0"
    >
      <ExperimentRow
        v-for="experiment in localExperiments"
        :key="experiment.key"
        :data-cy="`experiment-${experiment.key}`"
        class="border-t border-gray-100 py-[24px] first:border-0"
        :experiment="experiment"
      />
    </div>
  </SettingsSection>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { gql } from '@urql/vue'
import ExperimentRow from './ExperimentRow.vue'
import SettingsSection from '../SettingsSection.vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import type { ExperimentsFragment } from '../../generated/graphql'
import { useI18n } from '@cy/i18n'
import type { CypressResolvedConfig } from '@packages/types/src/config'
const { t } = useI18n()

gql`
fragment Experiments on CurrentProject {
  id
  config
}
`

const props = defineProps<{
  gql?: ExperimentsFragment | null
}>()

const localExperiments = computed(() => {
  // get experiments out of the config
  const config: CypressResolvedConfig = props.gql?.config ?? []
  const experimentalConfigurations: { field: string, value: unknown }[] = config.filter((item) => item.field.startsWith('experimental'))

  // get experimental retry properties on the 'retries' config object. Mutate the experimentalConfigurations array as to not have side effects with props.gql.config
  // TODO: remove this once experimentalRetries becomes GA. This is to be treated as a one off as supported nested experiments inside config is rare.
  const retries = config.find((item) => item.field === 'retries')

  if (retries) {
    const { value } = retries
    // `retries` may also be a number, or null to turn retries off; neither sets the experimental options
    const options = value && typeof value === 'object' && !Array.isArray(value) ? value : undefined

    experimentalConfigurations.push({
      field: 'retries.experimentalStrategy',
      value: options?.experimentalStrategy,
    })

    experimentalConfigurations.push({
      field: 'retries.experimentalOptions',
      value: options?.experimentalOptions,
    })
  }
  // end TODO removal

  return experimentalConfigurations.map((configItem) => {
    return {
      key: configItem.field,
      name: t(`settingsPage.experiments.${configItem.field}.name`),
      enabled: !!configItem.value,
      description: t(`settingsPage.experiments.${configItem.field}.description`),
    }
  })
})
</script>
