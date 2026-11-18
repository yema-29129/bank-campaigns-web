document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-campaign]').forEach((card) => {
    const primaryLink = card.querySelector('a[href]');
    const title = card.querySelector('h2');
    if (!primaryLink || !title) return;

    const href = primaryLink.getAttribute('href');
    if (!href) return;

    if (!title.querySelector('a')) {
      const titleLink = document.createElement('a');
      titleLink.href = href;
      titleLink.textContent = title.textContent.trim();
      title.replaceChildren(titleLink);
    }

    card.classList.add('is-card-link');
    card.tabIndex = 0;
    card.setAttribute('role', 'link');
    card.setAttribute('aria-label', `打开活动：${title.textContent.trim()}`);

    const openPrimaryLink = () => {
      window.location.assign(href);
    };

    card.addEventListener('click', (event) => {
      if (event.target.closest('a, button')) return;
      openPrimaryLink();
    });

    card.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (event.target.closest('a, button')) return;
      event.preventDefault();
      openPrimaryLink();
    });
  });
});
