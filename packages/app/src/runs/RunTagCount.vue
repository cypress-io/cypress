<template>
  <Tooltip
    tab-index="0"
    placement="bottom"
  >
    <RunTag
      :aria-label="ariaLabel"
      :title="`+${value}`"
      :label="`+${value}`"
      data-cy="runTagCount"
    />
    <template
      v-if="tooltipData"
      #popper
    >
      <ul
        class="flex gap-[8px] flex-col max-w-full children:flex text-gray-300"
        data-cy="runTagCount-tooltip"
      >
        <li
          v-if="(tooltipData.flaky || 0 > 0)"
          class="items-center overflow-hidden"
        >
          <div
            class="flex border rounded flex-row gap-[8px] items-center h-6 border-white/20 text-orange-300 text-sm px-2 gap-x-1"
          >
            <span
              class="font-medium pr-1 opacity-70"
            >
              {{ tooltipData.flaky }}
            </span>
            <div class="w-px my-[6px] h-6 border-white/20 border" />
            <span class="font-semibold pl-1">
              {{ t('specPage.flaky.badgeLabel') }}
            </span>
          </div>
        </li>
        <li
          v-if="tooltipData.branchName"
          class="items-center overflow-hidden text-sm"
        >
          <IconTechnologyBranchH
            aria-hidden="true"
            class="shrink-0 mr-2 icon-dark-gray-500"
          />
          <span
            class="sr-only"
          >
            {{ t('runs.card.branchName') }}
          </span>
          <div class="grow-1 max-w-full overflow-hidden">
            <div class="max-w-full break-words whitespace-normal">
              {{ tooltipData.branchName }}
            </div>
            <div />
          </div>
        </li>
        <li
          v-if="tooltipData.tags && tooltipData.tags?.length > 0"
          class="flex-col items-start max-w-full  text-sm gap-[8px]"
        >
          <span class="font-medium">Tags</span>
          <ul
            class="flex flex-col gap-[8px] children:flex children:items-center w-full"
          >
            <li
              v-for="tag in tooltipData.tags"
              :key="tag"
              class="relative overflow-hidden max-w-full"
            >
              <div
                aria-hidden="true"
                class=" shrink-0 pr-[8px]"
              >
                <IconDotOutlineSmall class="icon-dark-gray-500 icon-light-gray-500" />
              </div>
              <div class="grow-1 max-w-full overflow-hidden">
                <div class="max-w-full break-words whitespace-normal">
                  {{ tag }}
                </div>
              </div>
            </li>
          </ul>
        </li>
      </ul>
    </template>
  </Tooltip>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import Tooltip from '@packages/frontend-shared/src/components/Tooltip.vue'
import { IconTechnologyBranchH, IconDotOutlineSmall } from '@cypress-design/vue-icon'
import RunTag from './RunTag.vue'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

const props = defineProps<{
  value: number
  tooltipData: {
    flaky?: number
    branchName?: string
    tags?: string[]
  }
}>()

const ariaLabel = computed(() => {
  let labelArray: string[] = []

  if (props.tooltipData.flaky) {
    labelArray.push(`${props.tooltipData.flaky}`, t('specPage.flaky.badgeLabel'))
  }

  if (props.tooltipData.branchName) {
    labelArray.push(t('runs.card.branchName'), props.tooltipData.branchName)
  }

  if (props.tooltipData.tags) {
    labelArray = labelArray.concat(props.tooltipData.tags)
  }

  return labelArray.join(' ')
})

</script>
