(() => {
  const openMenuSelector = '.site-topic-menu[open]';

  document.addEventListener('click', (event) => {
    document.querySelectorAll(openMenuSelector).forEach((menu) => {
      if (!menu.contains(event.target)) menu.open = false;
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const menu = document.querySelector(openMenuSelector);
    if (!menu) return;
    menu.open = false;
    menu.querySelector('summary').focus();
    event.stopPropagation();
  }, true);
})();
