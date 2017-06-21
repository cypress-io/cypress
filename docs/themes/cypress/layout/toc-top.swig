<div id="content-wrap" class="{{ page.containerClass }} toc-top">
  <div id="content" class="wrapper">
    <div id="content-inner">
      <article class="article-container" itemscope itemtype="http://schema.org/Article">
        <div class="article-inner">
          <div class="article">
            <div>
              <h1 class="article-title" itemprop="name">{{ page.title }}</h1>
              {{ toc(page.content, {list_number: false}) }}
            </div>
            <div class="article-content" itemprop="articleBody">
              {{ add_page_anchors(page.content) }}
            </div>
            <footer class="article-footer">
              {{ page_nav() }}
            </footer>
            <div class="article-footer-updated">
              <time datetime="{{ date_xml(page.updated) }}" itemprop="dateModified">{{ __('page.last-updated', date(page.updated)) }}</time>
            </div>
          </div>
        </div>
      </article>
      {{ partial('partial/sidebar') }}
    </div>
  </div>
</div>
