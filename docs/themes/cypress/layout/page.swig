<div id="content-wrap"  class="{{ page.containerClass }}">
  <div id="content" class="wrapper">
    <div id="content-inner">
      <article class="article-container" itemscope itemtype="http://schema.org/Article">
        <div class="article-inner">
          <div class="article">
            <header class="article-header">
              <h1 class="article-title" itemprop="name">{{ page.title }}</h1>
              {#  COMMENTING OUT  #}
              {#  Need to update once monorepo is OS  #}
              {# <a href="{{ raw_link(page.source) }}" class="article-edit-link"><i class="fa fa-pencil"></i> {{ __('page.improve') }}</a> #}
              <a href="https://github.com/cypress-io/cypress/issues/new" class="article-edit-link"><i class="fa fa-pencil"></i> {{ __('page.improve') }}</a>
            </header>
            <div class="article-content" itemprop="articleBody">
              {{ add_page_anchors(page.content) }}
            </div>
            <footer class="article-footer">
              {{ page_nav() }}
            </footer>
            <div class="article-footer-updated">
              <time datetime="{{ date_xml(page.updated) }}" itemprop="dateModified">{{ __('page.last-updated', date(page.updated)) }}</time>
            </div>
            {{ partial('partial/comment') }}
          </div>
          <aside id="article-toc" role="navigation">
            <div id="article-toc-inner">
              <strong class="sidebar-title">{{ __('page.contents') }}</strong>
              {{ toc(page.content, {list_number: false}) }}
              <a href="#" id="article-toc-top"><i class="fa fa-long-arrow-up"></i> {{ __('page.back-to-top') }}</a>
            </div>
          </aside>
        </div>
      </article>
      {{ partial('partial/sidebar') }}
    </div>
  </div>
</div>
