<template>
  <SettingsSection
    data-cy="settings-experiments"
  >
    <template #title>
      Experiments
    </template>
    <template #description>
      If you'd like to try out new features that we're working on, you can enable beta features for your project by turning on the experimental features you'd like to try.
      <ExternalLink
        href="https://on.cypress.io/experiments"
      >
        Learn more.
      </ExternalLink>
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
import type { CypressResolvedConfig } from '@packages/types/src/config'

const experimentText = {
  experimentalCspAllowList: {
    name: 'CSP Allow List',
    description: 'Enables Cypress to selectively permit Content-Security-Policy and Content-Security-Policy-Report-Only header directives, including those that might otherwise block Cypress from running.',
  },
  experimentalInteractiveRunEvents: {
    name: 'Interactive run events',
    description: 'Allows listening to the [`before:run`](https://on.cypress.io/before-run), [`after:run`](https://on.cypress.io/after-run), [`before:spec`](https://on.cypress.io/before-spec), and [`after:spec`](https://on.cypress.io/after-spec) events in plugins during interactive mode.',
  },
  experimentalModifyObstructiveThirdPartyCode: {
    name: 'Modify obstructive third party code',
    description: 'Applies `modifyObstructiveCode` to third party `.html` and `.js`, removes subresource integrity, and modifies the user agent in Electron.',
  },
  'retries.experimentalStrategy': {
    name: 'Retries Strategy',
    description: 'Applies a strategy for test retries according to your "flake tolerance"; options are `detect-flake-but-always-fail` or `detect-flake-and-pass-on-threshold`.',
  },
  'retries.experimentalOptions': {
    name: 'Retries Strategy Options',
    description: 'Sets retries strategy-specific options like `maxRetries`, `passesRequired`, and `stopIfAnyPassed`.',
  },
  experimentalSingleTabRunMode: {
    name: 'Single tab run mode',
    description: 'Runs all component specs in a single tab, trading spec isolation for faster run mode execution.',
  },
  experimentalWebKitSupport: {
    name: 'WebKit Support',
    description: 'Adds support for testing in the WebKit browser engine used by Safari. See https://on.cypress.io/webkit-experiment for more information.',
  },
  experimentalRunAllSpecs: {
    name: 'Run All Specs',
    description: 'Enables the "Run All Specs" UI feature, allowing the execution of multiple specs sequentially.',
  },
  experimentalOriginDependencies: {
    name: 'Origin Dependencies',
    description: 'Enables support for `Cypress.require()` for including dependencies within the `cy.origin()` callback.',
  },
}

const isKnownExperiment = (field: string): field is keyof typeof experimentText => field in experimentText

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
    const { field } = configItem
    // An experiment added to the config options without an entry above still shows up, under its field name
    const text = isKnownExperiment(field) ? experimentText[field] : { name: field, description: '' }

    return {
      key: field,
      name: text.name,
      enabled: !!configItem.value,
      description: text.description,
    }
  })
})
</script>
