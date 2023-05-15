<template>
  <div class="rounded-bl-md rounded-tl-md mx-auto border w-full min-w-[100px] relative hide-scrollbar overflow-auto grow-1">
    <OpenConfigFileInIDE
      v-slot="{onClick}"
      :gql="props.gql"
    >
      <Button
        size="32"
        variant="outline-light"
        class="top-4 right-4 absolute gap-[8px]"
        @click="onClick"
      >
        <IconCode />
        {{ t('file.edit') }}
      </Button>
    </OpenConfigFileInIDE>
    <code
      class="font-thin p-[16px] text-gray-600 text-[14px] leading-[24px] block"
    >
      {<br>
      <div class="pl-[24px]">
        <span
          v-for="{ field, value, from } in sortAlphabetical(props.gql.config)"
          :key="field"
        >
          {{ field }}:
          <template v-if="value && typeof value === 'object'">
            <RenderObject
              :value="value"
              :color-classes="`rounded-sm px-[2px] ${colorMap[from]}`"
              :from="from"
            />
            <span>,</span>
          </template>
          <RenderPrimitive
            v-else
            :from="from"
            :value="value"
            :data-cy-config="from"
            class="rounded-sm px-[2px]"
            :class="colorMap[from]"
          />
          <br>
        </span>
      </div>
      }
    </code>
  </div>
</template>

<script lang="ts" setup>
import Button from '@cypress-design/vue-button'
import IconCode from '~icons/mdi/code'
import { useI18n } from '@cy/i18n'
import { CONFIG_LEGEND_COLOR_MAP } from './ConfigSourceColors'
import RenderObject from './renderers/RenderObject.vue'
import { gql } from '@urql/core'
import OpenConfigFileInIDE from '@packages/frontend-shared/src/gql-components/OpenConfigFileInIDE.vue'
import type { ConfigCodeFragment } from '../../generated/graphql'
import RenderPrimitive from './renderers/RenderPrimitive.vue'

gql`
fragment ConfigCode on CurrentProject {
  id
  config
  ...OpenConfigFileInIDE
}
`

const props = defineProps<{
  gql: ConfigCodeFragment
}>()

const sortAlphabetical = (config) => {
  return config.sort((a, b) => {
    return a.field.localeCompare(b.field)
  })
}

// a bug in vite demands that we do this passthrough
const colorMap = CONFIG_LEGEND_COLOR_MAP

const { t } = useI18n()
</script>
