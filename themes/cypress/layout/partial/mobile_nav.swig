<nav id="mobile-nav">
  <div id="mobile-nav-inner">
    <ul id="mobile-nav-list">
      {{ header_menu('mobile-nav') }}
      <li class="mobile-nav-item">
        <a href="https://github.com/{{ config.github }}" class="mobile-nav-link" rel="external" target="_blank">GitHub</a>
      </li>
    </ul>
    {% if page.layout == 'page' %}
      {{ doc_sidebar('mobile-nav') }}
    {% endif %}
  </div>
  <div id="mobile-lang-select-wrap">
    <span id="mobile-lang-select-label"><i class="fa fa-globe"></i><span>{{ lang_name(page.lang) }}</span></span>
    <select id="mobile-lang-select" data-canonical="{{ canonical_path_for_nav() }}">
      {% for lang in site.data.languages %}
        <option value="{{ loop.key }}"{% if page.lang === loop.key %} selected{% endif %}>{{ lang_name(loop.key) }}</option>
      {% endfor %}
    </select>
  </div>
</nav>
