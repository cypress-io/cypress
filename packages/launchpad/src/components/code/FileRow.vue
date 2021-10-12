<script lang="ts" setup>
import { computed, ref } from 'vue'
import PrismJs from 'vue-prism-component'
import 'prismjs'
import '@packages/frontend-shared/src/styles/prism.scss'
import ListRow from '@cy/components/ListRow.vue'
import Button from '@cy/components/Button.vue'
import Badge from '@cy/components/Badge.vue'

const props = defineProps<{
    status: 'changes' | 'valid' | 'skipped' | 'error'
    filePath: string
    language: 'js' | 'ts'
    content: string
    description?: string
    warning?: {
      description: string,
      docsLink: string
    }
}>()

const open = ref(false)

const statusLabel = computed(() => props.status === 'skipped' ? 'Skipped' : props.status === 'changes' ? 'Changes required' : undefined)
const statusClasses = computed(() => props.status === 'skipped' ? 'skipped' : props.status === 'changes' ? 'warning' : undefined)

</script>
<template>
  <ListRow @click="open = !open">
    <template #icon>
      <i-cy-file-changes-added_x24
        v-if="status === 'valid'"
        class="w-24px h-24px"
      />
      <i-cy-file-changes-warning_x24
        v-if="status === 'changes'"
        class="w-24px h-24px"
      />
      <i-cy-file-changes-skipped_x24
        v-if="status === 'skipped'"
        class="w-24px h-24px"
      />
      <i-cy-file-changes-error_x24
        v-if="status === 'error'"
        class="w-24px h-24px"
      />
    </template>
    <template #header>
      <span class="inline-block align-top">{{ filePath }}</span>
      <Badge
        v-if="statusLabel && statusClasses && !open"
        :label="statusLabel"
        :status="statusClasses"
      />
    </template>
    <template #description>
      {{ description }}
    </template>
    <template #slider>
      <div
        v-if="warning && open"
        class="border-t border-gray-200 p-3 flex items-center bg-warning-100 text-warning-600"
      >
        <span class="font-semibold">{{ statusLabel }}: </span>
        <p class="flex-grow ml-1">
          {{ warning?.description }}
        </p>
        <Button>Learn more</Button>
      </div>
      <div
        class="border-t border-gray-100 p-3 pt-4 overflow-auto"
        :class="open ? 'block': 'hidden'"
      >
        <PrismJs :language="language">
          {{ content }}
        </PrismJs>
      </div>
    </template>
  </ListRow>
</template>
