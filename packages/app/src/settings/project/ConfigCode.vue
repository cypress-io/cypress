<template>
  <div class="relative grow-1 w-full hide-scrollbar rounded-bl-md rounded-tl-md mx-auto border-1 overflow-auto min-w-100px select-none">
    <Button
      variant="outline"
      class="absolute top-4 right-4"
      :prefix-icon="IconCode"
      prefix-icon-class="text-gray-500"
    >
      {{ t('file.edit') }}
    </Button>
    <pre
      class="p-2 font-mono text-gray-600 text-sm"
    >
{<span
        v-for="(value, key) in config"
        :key="key"
><template v-if="value.value">
  {{ key }}: <span
    :class="CONFIG_LEGEND_COLOR_MAP[value.from]"
    ><Browsers
      v-if="key==='browsers' && Array.isArray(value.value)"
      :browsers="value.value"
    /><BlockHosts
      v-else-if="key==='blockHosts' && Array.isArray(value.value)"
      :block-hosts="value.value"
    /><Hosts
      v-else-if="key==='hosts'"
      :hosts="value.value"
    /><template
        v-else
      >{{ typeof value.value === 'string' ? `'${value.value}'` : value.value }}</template></span>,</template></span>
}</pre>
  </div>
</template>

<script lang="ts" setup>
import Button from '@cy/components/Button.vue'
import IconCode from '~icons/mdi/code'
import { useI18n } from '@cy/i18n'
import { CONFIG_LEGEND_COLOR_MAP } from './ConfigSourceColors'
import Browsers from './renderers/Browsers.vue'
import BlockHosts from './renderers/BlockHosts.vue'
import Hosts from './renderers/Hosts.vue'

defineProps<{
  config: Record<string, { from: 'default'| 'config', value: string | number | boolean | Record<string, string | number | boolean> | Array<string | number | boolean> }>
}>()

const { t } = useI18n()
</script>
