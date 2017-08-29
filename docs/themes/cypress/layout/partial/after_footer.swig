<!-- Scripts -->
<!-- build:js /js/application.js -->
{{ js('js/global_variable') }}
{{ js('js/lang_select') }}
{{ js('js/vendor/scrollingelement') }}
{{ js('js/vendor/menuspy') }}
{{ js('js/toc') }}
{{ js('js/mobile_nav') }}
{{ js('js/ac_tracking') }}
{% if config.algolia[page.lang] %}
  <!-- Algolia -->
  {{ js('js/vendor/docsearch') }}
{% endif %}
<!-- endbuild -->

<!-- Algolia -->
{% if config.algolia[page.lang] %}
  {{ partial('docsearch') }}
{% endif %}
