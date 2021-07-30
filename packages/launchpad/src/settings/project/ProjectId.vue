<template>
  <ProjectSettingsSection>
     <template #title>Project ID</template>
     <template #description>Lorem ipsum dolor sit amet consectetur adipisicing elit. Odio cum dolorem doloribus voluptate consectetur recusandae?</template>
     <div class="inline-grid grid-flow-col justify-start gap-10px">
      <Input v-model="projectId" disabled inputClass="font-mono text-xs" type="text" size="sm">
        <template #prefix>
            <Icon icon="mdi:code-braces" class="text-cool-gray-400 braces" />
        </template>
      </Input>
      <Button variant="outline" @click="clipboard.copy">
        <template #prefix>
          <Icon class="text-cool-gray-600" icon="si-glyph:square-dashed-2" />
        </template>
        {{ clipboard.copied.value ? 'Copied!' : 'Copy' }}
      </Button>
     </div>
   </ProjectSettingsSection>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import Input from '../../components/Input.vue'
import Button from '../../components/Button.vue'
import ProjectSettingsSection from './ProjectSettingsSection.vue'
import { useClipboard } from '@vueuse/core'

export default defineComponent({
  components: {
    Input,
    Button,
    ProjectSettingsSection,
  },
  setup() {
    const projectId = ref('74e08848-f0f6-11eb-9a03-0242ac130003')
    return {
      clipboard: useClipboard({ source: projectId }),
      projectId,
    }
  },
})
</script>
