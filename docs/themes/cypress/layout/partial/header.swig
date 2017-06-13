<header id="header" class="wrapper">
  <div id="header-inner" class="inner">
    <h1 id="logo-wrap">
      <a href="/" id="logo">
        <img src="/{{ config.logo }}" alt="Cypress"/>
      </a>
    </h1>
    <nav id="main-nav">
      {{ menu('main') }}
      <a href="https://github.com/{{ config.github_main_repo }}" class="main-nav-link"><i class="fa fa-github"></i></a>

      <div id="search-container">
        <div id="search-input-wrap">
          <div id="search-input-icon">
            <i class="fa fa-search"></i>
          </div>
          <input type="search" id="search-input" placeholder="Search...">
        </div>
      </div>
      <div id="lang-select-wrap">
        <label id="lang-select-label"><i class="fa fa-globe"></i><span>{{ lang_name(page.lang) }}</span><i class="fa fa-caret-down"></i></label>
        <select id="lang-select" data-canonical="{{ canonical_path_for_nav() }}">
          {% for lang in site.data.languages %}
            <option value="{{ loop.key }}"{% if page.lang === loop.key %} selected{% endif %}>{{ lang_name(loop.key) }}</option>
          {% endfor %}
        </select>
      </div>
    </nav>

    <a id="mobile-nav-toggle">
      <span class="mobile-nav-toggle-bar"></span>
      <span class="mobile-nav-toggle-bar"></span>
      <span class="mobile-nav-toggle-bar"></span>
    </a>
  </div>
</header>
