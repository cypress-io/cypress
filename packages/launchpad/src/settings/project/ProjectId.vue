<template>
  <ProjectSettingsSection>
    <template #title>Project ID</template>
    <template
      #description
    >Lorem ipsum dolor sit amet consectetur adipisicing elit. Odio cum dolorem doloribus voluptate consectetur recusandae?</template>
    <div class="inline-grid grid-flow-col justify-start gap-10px">
      <InlineCodeEditor
        class="text-sm"
        :prefixIcon="IconCodeBraces"
        prefixIconClass="text-cool-gray-400"
        readonly
        v-model="formattedProjectId"
      ></InlineCodeEditor>
      <Button variant="outline" @click="clipboard.copy">
        <template #prefix>
          <Icon class="text-cool-gray-600" :icon="IconDashedSquare" />
        </template>
        {{ clipboard.copied.value ? 'Copied!' : 'Copy' }}
      </Button>
    </div>
  </ProjectSettingsSection>
</template>

<script lang="ts">
import { defineComponent, computed, ref, onMounted } from 'vue'
import "prismjs"
import "@packages/reporter/src/errors/prism.scss"
import IconCodeBraces from 'virtual:vite-icons/mdi/code-braces'
import IconDashedSquare from 'virtual:vite-icons/si-glyph/square-dashed-2'
import Input from '../../components/Input/Input.vue'
import Button from '../../components/Button.vue'
import ProjectSettingsSection from './ProjectSettingsSection.vue'
import { useClipboard } from '@vueuse/core'
import PrismJs from "vue-prism-component"
import InlineCodeEditor from '../../components/Input/InlineCodeEditor.vue'

export default defineComponent({
  components: {
    PrismJs,
    Input,
    Button,
    ProjectSettingsSection,
    InlineCodeEditor
  },
  setup() {
    const projectId = ref('74e08848-f0f6-11eb-9a03-0242ac130003')
    const yamlRegistered = ref(false)
    // await import("prismjs/components/prism-yaml")
    onMounted(() => {
      import("prismjs/components/prism-yaml").then(() => {
        yamlRegistered.value = true
      })
    })
    return {
      formattedProjectId: computed(() => `projectId: '${projectId.value}'`),
      clipboard: useClipboard({ source: projectId }),
      projectId,
      yamlRegistered,
      IconCodeBraces,
      IconDashedSquare
    }
  },
})
</script>

<style lang="scss" scoped>
pre {
  @apply bg-transparent m-0 p-0;
}
</style>
