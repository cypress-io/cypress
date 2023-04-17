<template>
  <div class="flex p-5 align-center">
    <div class="mr-2 pt-1">
      <IconWarningCircle
        stroke-color="gray-500"
        fill-color="gray-50"
      />
    </div>
    <div class="text-gray-700">
      {{ t('debugPage.foundMoreThan100Runs') }}
      <ExternalLink
        v-if="runUrl"
        :href="cloudProjectHref"
      >
        {{ t('debugPage.goToCypressCloud') }}
      </ExternalLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import { useI18n } from '@cy/i18n'
import { IconWarningCircle } from '@cypress-design/vue-icon'

const { t } = useI18n()

const props = defineProps<{runUrl: string | null}>()

const cloudProjectHref = computed(() => {
  return props.runUrl?.slice(0, props.runUrl.indexOf('/runs'))
})

</script>
