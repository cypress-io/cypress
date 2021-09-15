<script setup lang="ts">
import { onMounted, ref } from "vue";
import Iframe from "./IFrame.vue";
import { useGetStorySource } from "../composables/getStorySource";

interface Spec {
  name: string;
  absolute: string;
  relative: string;
}

const props = defineProps({
  cypressConfig: {
    type: Object,
    required: true,
  },
});

const stories = ref([] as Spec[]);
onMounted(async () => {
  const { componentFolder } = props.cypressConfig;
  const { files, globPattern } = await fetch(
    "/__/getStories?projectRoot=" + componentFolder
  ).then((res) => res.json());
  stories.value = files;
});

const selectedStory = ref("");
function onStorySelect() {
  status.value = "IDLE";
  console.log({ selectedStory: selectedStory.value });
}

const { status, specTxt, specPath } = useGetStorySource();
</script>

<template>
  <div>
    <div class="p-4">
      <h1 class="text-xl">Step 1: Find Stories (aka Previews)</h1>
      <div class="p-4">
        <p>
          At this point, the user has no specs but has a bunch of stories. We
          can kill two birds with one stone.
        </p>
        <ul class="pl-8 list-disc">
          <li>
            Give them a playground in which they can get their components
            looking like production
          </li>
          <li>Get them writing tests faster</li>
        </ul>
        <br />
        <p>
          Given some glob pattern and a project root, we can find any stories
          that currently exist.
        </p>
        <ul class="pl-8 list-disc">
          <li>
            fetch('/__/findStories' , {projectRoot, globPattern}) =
            {{ stories.map((story) => story.name) }}
          </li>
        </ul>
      </div>
    </div>

    <div class="p-4">
      <h1 class="text-xl">Step 2: Bundle the story and codegen a spec.</h1>
      <div class="p-4">
        <p>
          We bundle the code in a iframe to retrieve the information we need to
          codegen. Using the <code>composeStories</code> API with stories
          written with the latest Storybook standard, we can generate code with
          ease.
        </p>
        <select v-model="selectedStory" class="w-48" @change="onStorySelect">
          <option disabled value="">Please select one</option>
          <option v-for="story in stories" :value="story.name">
            {{ story.name }}
          </option>
        </select>
        <Iframe
          v-if="selectedStory && status !== 'SUCCESS'"
          :spec-path="
            stories.find((story) => story.name === selectedStory)?.absolute
          "
          :cypress-config="props.cypressConfig"
        ></Iframe>
        <ul v-if="status === 'SUCCESS'" class="pl-8 list-disc">
          <li>Spec Created: {{ specPath }}</li>
          <li>
            Spec Content:
            <pre>{{ specTxt }}</pre>
          </li>
        </ul>
      </div>
    </div>

    <div class="p-4" v-if="status === 'SUCCESS'">
      <h1 class="text-xl">Step 3: Give user a component playground.</h1>
      <div class="p-4">
        <p>
          The user can update the newly generated spec, the story, the styles...
          whatever they need to in order to get their component rendering
          properly.
        </p>
        <Iframe
          class="p-8 border-dotted border-gray-700 border"
          v-if="specPath && status === 'SUCCESS'"
          :spec-path="specPath"
          :cypress-config="props.cypressConfig"
        ></Iframe>
      </div>
    </div>
  </div>
</template>

<style></style>
