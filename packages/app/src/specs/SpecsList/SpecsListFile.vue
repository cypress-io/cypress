<script setup lang="ts">
import { computed } from "vue";
import type { RouteLocationRaw } from "vue-router";
import type { SpecsListFragment } from "../../generated/graphql";
import HighlightedText from "../HighlightedText.vue";
import RunStatusDots from "../RunStatusDots.vue";
import { deriveIndexes } from "../spec-utils";
import SpecListGitInfo from "../SpecListGitInfo.vue";
import type { SpecTreeFileNode } from "../tree/deriveTree";
import { tableGridColumns } from "./constants";
import type { ProjectConnectionStatus} from '../tree/types'
import SpecsListHoverCell from "../SpecsListHoverCell.vue";
import SpecsListCloudButton from "../SpecsListCloudButton.vue";

const props = defineProps<{
  node: SpecTreeFileNode<SpecsListFragment>;
  projectConnectionStatus: ProjectConnectionStatus;
}>();

const route: RouteLocationRaw = {
  path: "/specs/runner",
  query: {
    file: props.node.data.relative.replace(/\\/g, "/"),
  },
};

// TODO: Fix
const split = computed(() => {
  const idx = deriveIndexes(
    props.node.data.fileName,
    // TODO: Types are janky
    props.node.data.fuzzyIndexes?.relative ?? []
  );
  return idx;
});
</script>

<template>
  <RouterLink
    :style="{ paddingLeft: `${(node.parent.depth + 1) * 10 + 22}px` }"
    class="h-full outline-none ring-inset grid pr-20px group focus:outline-transparent focus-within:ring-indigo-300 focus-within:ring-1 children:cursor-pointer"
    :class="tableGridColumns"
    :to="route"
  >
    <div
      class="h-full grid gap-8px grid-cols-[16px,auto,auto] items-center"
      data-cy="spec-item"
    >
      <i-cy-document-blank_x16
        class="icon-light-gray-50 icon-dark-gray-200 group-hocus:icon-light-indigo-200 group-hocus:icon-dark-indigo-400"
      />
      <div>
        <div
          :title="`${props.node.data.fileName + props.node.data.fileExtension}`"
          class="text-gray-400 text-indigo-500 truncate group-hocus:text-indigo-600"
        >
          <!-- {{ props.node.name }} -->
          <HighlightedText
            :text="props.node.data.fileName"
            :indexes="[] /* split.fileNameIndexes */"
            class="font-medium text-indigo-500 group-hocus:text-indigo-700"
            highlight-classes="text-gray-1000"
          />
          <HighlightedText
            :text="props.node.data.specFileExtension"
            :indexes="[] /* split.extensionIndexes */"
            class="font-light group-hocus:text-gray-400"
            highlight-classes="text-gray-1000"
          />
        </div>
      </div>
    </div>

    <SpecListGitInfo
      v-if="props.node.data.gitInfo"
      :gql="props.node.data.gitInfo"
    />

    <!-- latest -->
    <SpecsListHoverCell
      data-cy="specs-list-row-latest-runs"
      :is-hover-disabled="props.projectConnectionStatus === 'CONNECTED'"
    >
      <template #content>
        <slot name="latest-runs" />
      </template>

      <template #hover>
        <slot name="connect-button" utmMedium="Specs Latest Runs Empty State" />
        <SpecsListCloudButton 
          :project-connection-status="props.projectConnectionStatus"
        />
      </template>

    </SpecsListHoverCell>

    <!-- average duration -->
    <div>av</div>

  </RouterLink>
</template>
