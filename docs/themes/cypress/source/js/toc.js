(function(){
  'use strict';

  var header = document.getElementById('header');
  var toc = document.getElementById('article-toc');
  var tocInner = document.querySelector('.toc');
  var tocTop = document.getElementById('article-toc-top');
  var headerHeight = header.clientHeight;

  if (!toc) return;

  var ms = new MenuSpy(tocInner)

  // we need this to be called after all images have loaded
  // otherwise the height for the menuspy is not properly calculated
  window.addEventListener('load', function(){
    // https://github.com/lcdsantos/menuspy
    // This highlights the proper toc link while scrolling
    ms.cacheItems()
    ms.tick()
  });

  // This keeps the toc within the view
  function updateSidebarPosition(){
    var scrollTop = document.scrollingElement.scrollTop;

    if (scrollTop > headerHeight){
      toc.classList.add('fixed');
    } else {
      toc.classList.remove('fixed');
    }
  }

  window.addEventListener('scroll', function(){
    window.requestAnimationFrame(updateSidebarPosition);
  });

  updateSidebarPosition();

  tocTop.addEventListener('click', function(e){
    e.preventDefault();
    document.scrollingElement.scrollTop = 0;
  });
})();
