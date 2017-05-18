<!-- Scripts -->
<!-- build:js build/js/main.js -->
{{ js('js/lang_select') }}
{{ js('js/scrollingelement') }}
{{ js('js/menuspy') }}
{{ js('js/toc') }}
{{ js('js/mobile_nav') }}
<!-- endbuild -->

{% if config.algolia[page.lang] %}
  <!-- Algolia -->
  {{ js('js/docsearch') }}
{% endif %}

<!-- Algolia -->
{% if config.algolia[page.lang] %}
  {{ partial('docsearch') }}
{% endif %}
