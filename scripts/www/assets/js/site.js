(function () {
  var path = location.pathname.split('/').pop() || 'index.html';

  // 侧栏当前页高亮
  document.querySelectorAll('.sidebar a.nav').forEach(function (a) {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });

  // 移动端抽屉菜单
  var toggle = document.querySelector('.menu-toggle');
  if (toggle) toggle.addEventListener('click', function () {
    document.body.classList.toggle('nav-open');
  });
  var scrim = document.querySelector('.scrim');
  if (scrim) scrim.addEventListener('click', function () {
    document.body.classList.remove('nav-open');
  });
  // 点击侧栏链接后自动收起抽屉
  document.querySelectorAll('.sidebar a.nav').forEach(function (a) {
    a.addEventListener('click', function () { document.body.classList.remove('nav-open'); });
  });

  // 滚动到顶按钮显隐
  var up = document.querySelector('.up');
  if (up) {
    var onScroll = function () {
      up.classList.toggle('show', window.scrollY > 400);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // 滚动入场动效：为各区块加 .rise，进入视口后加 .in
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && 'IntersectionObserver' in window) {
    var targets = document.querySelectorAll(
      '.doc h2, .doc .grid, .doc .tblwrap, .doc .note, .doc .tip, .doc pre, .doc .tocmini'
    );
    targets.forEach(function (el) { el.classList.add('rise'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    targets.forEach(function (el) { io.observe(el); });
  }
})();
