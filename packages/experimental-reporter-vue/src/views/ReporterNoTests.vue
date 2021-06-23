<template>
  <div className="no-tests">
    <h2><i className="fas fa-exclamation-triangle" /> No tests found.</h2>
    <p>Cypress could not detect tests in this file.</p>
    <template v-if="!isAllSpecs">
      <FileOpener
        :column="0"
        :line="0"
        :originalFile="spec.relative"
        :relativeFile="spec.relative"
        :absoluteFile="spec.absolute"
      >
        <h3><i className="fas fa-external-link-alt" /> Open file in IDE</h3>
      </FileOpener>
      <p className="text-muted">
        Write a test using your preferred text editor.
      </p>
      <a className="open-studio" onClick="{_launchStudio}"
        ><h3>
          <i className="fas fa-magic" /> Create test with Cypress Studio
        </h3></a
      >
      <p className="open-studio-desc text-muted">
        Use an interactive tool to author a test right here.
      </p>
    </template>
    <hr />
    <p>
      Need help? Learn how to
      <a
        className="help-link"
        href="https://on.cypress.io/intro"
        target="_blank"
        >test your application</a
      >
      with Cypress
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";

export default defineComponent({
  props: {
    spec: { required: true, type: Object },
  },

  setup({ spec }) {
    const isAllSpecs = computed(
      () => spec.absolute === "__all" || spec.relative === "__all"
    );
    return {
      isAllSpecs,
    };
  },
});
</script>

<style lang="scss" scoped>
.no-tests {
  background-color: #f5f5f5;
  min-height: 20px;
  padding: 24px;

  h2 {
    color: #e94f5f;
    font-size: 1.3em;
    font-weight: 500;
    line-height: 1.4;
    margin-bottom: 0.6em;
  }

  h3 {
    color: #3386d4;
    font-size: 1.2em;
    font-weight: 500;
    line-height: 1.4;
    margin-top: 1.2em;
    margin-bottom: 0.3em;
  }

  p {
    font-size: 1.1em;

    &.text-muted {
      color: #b4b5bc;
    }
  }

  a {
    color: #3386d4;
    cursor: pointer;
  }

  i {
    margin-right: 5px;
  }

  hr {
    margin-top: 1.6em;
    margin-bottom: 1.6em;
    border: none;
    height: 1px;
    color: #dadade;
    background-color: #dadade;
  }

  .open-studio,
  .open-studio-desc {
    display: none;
  }
}

.experimental-studio-enabled .no-tests .open-studio,
.experimental-studio-enabled .no-tests .open-studio-desc {
  display: inline;
}
</style>