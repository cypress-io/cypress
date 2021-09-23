<template>
  <div class="children:mb-18px">
    <ConfigBadge
      class="bg-gray-100 text-gray-700"
      :label="legendText.default.label"
    >
      {{ legendText.default.description }}
    </ConfigBadge>

    <ConfigBadge
      class="bg-teal-100 text-teal-700"
      :label="legendText.config.label"
    >
      <i18n-t :keypath="legendText.config.descriptionKey">
        <a
          href="https://docs.cypress.io"
          target="_blank"
        >cypress.config.js</a>
      </i18n-t>
    </ConfigBadge>

    <ConfigBadge
      class="bg-yellow-100 text-yellow-700"
      :label="legendText.env.label"
    >
      {{ legendText.env.description }}
    </ConfigBadge>

    <ConfigBadge
      class="bg-red-50 text-red-700"
      :label="legendText.cli.label"
    >
      {{ legendText.cli.description }}
    </ConfigBadge>

    <ConfigBadge
      class="bg-purple-50 text-purple-700"
      :label="legendText.dynamic.label"
    >
      <i18n-t :keypath="legendText.dynamic.descriptionKey">
        <a
          href="https://docs.cypress.io"
          target="_blank"
        >setupNodeEnv</a>
      </i18n-t>
    </ConfigBadge>
  </div>
</template>

<script lang="ts" setup>
import ConfigBadge from './ConfigBadge.vue'
import { computed } from 'vue'
import { useI18n } from '../../composables'

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
