<template>
  <div class="children:mb-[18px]">
    <ConfigBadge
      :class="CONFIG_LEGEND_COLOR_MAP.default"
      :label="legendText.default.label"
    >
      {{ legendText.default.description }}
    </ConfigBadge>

    <ConfigBadge
      :class="CONFIG_LEGEND_COLOR_MAP.config"
      :label="legendText.config.label"
    >
      <i18n-t
        scope="global"
        :keypath="legendText.config.descriptionKey"
      >
        <OpenConfigFileInIDE :gql="props.gql" />
      </i18n-t>
    </ConfigBadge>

    <ConfigBadge
      :class="CONFIG_LEGEND_COLOR_MAP.env"
      :label="legendText.env.label"
    >
      {{ legendText.env.description }}
    </ConfigBadge>

    <ConfigBadge
      :class="CONFIG_LEGEND_COLOR_MAP.cli"
      :label="legendText.cli.label"
    >
      {{ legendText.cli.description }}
    </ConfigBadge>

    <ConfigBadge
      :class="CONFIG_LEGEND_COLOR_MAP.plugin"
      :label="legendText.dynamic.label"
    >
      <i18n-t
        scope="global"
        :keypath="legendText.dynamic.descriptionKey"
      >
        <ExternalLink
          href="https://on.cypress.io/setup-node-events"
          class="text-purple-500"
        >
          setupNodeEvents
        </ExternalLink>
      </i18n-t>
    </ConfigBadge>
  </div>
</template>

<script lang="ts" setup>
import ConfigBadge from './ConfigBadge.vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import { computed } from 'vue'
import { useI18n } from '@cy/i18n'
import { CONFIG_LEGEND_COLOR_MAP } from './ConfigSourceColors'
import OpenConfigFileInIDE from '@packages/frontend-shared/src/gql-components/OpenConfigFileInIDE.vue'
import type { OpenConfigFileInIdeFragment } from '../../generated/graphql'

const props = defineProps<{
  gql: OpenConfigFileInIdeFragment
}>()

const { t } = useI18n()
const legendText = computed(() => {
  return {
    default: {
      label: t('settingsPage.config.legend.default.label'),
      description: t('settingsPage.config.legend.default.description'),
    },
    config: {
      label: t('settingsPage.config.legend.config.label'),
      descriptionKey: 'settingsPage.config.legend.config.description',
    },
    env: {
      label: t('settingsPage.config.legend.env.label'),
      description: t('settingsPage.config.legend.env.description'),
    },
    cli: {
      label: t('settingsPage.config.legend.cli.label'),
      description: t('settingsPage.config.legend.cli.description'),
    },
    dynamic: {
      label: t('settingsPage.config.legend.dynamic.label'),
      descriptionKey: 'settingsPage.config.legend.dynamic.description',
    },
  }
})
</script>
