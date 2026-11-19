document.addEventListener('DOMContentLoaded', () => {
  const sourceTopic = document.body.dataset.topicDetailSource || '';
  const cards = new Set([
    ...document.querySelectorAll('[data-campaign]'),
    ...document.querySelectorAll('[data-topic-detail-source] .activity-directory > .detail-section[id]')
  ]);

  cards.forEach((card) => {
    const primaryLink = card.querySelector('a[href]');
    const title = card.querySelector('h2, h3');
    if (!primaryLink || !title) return;

    const href = primaryLink.getAttribute('href');
    if (!href) return;
    const detailId = card.dataset.detailId || '';
    const detailTopic = card.dataset.detailTopic || sourceTopic;
    let detailHref = href;
    if (/^\d+$/.test(detailId)) {
      detailHref = `/detail.html?id=${encodeURIComponent(detailId)}`;
    } else if (card.matches('[data-website-only]') && /^[a-z0-9-]+$/.test(card.id)) {
      const topicQuery = /^[a-z0-9-]+$/.test(detailTopic)
        ? `&topic=${encodeURIComponent(detailTopic)}`
        : '';
      detailHref = `/detail.html?web=${encodeURIComponent(card.id)}${topicQuery}`;
    } else if (detailTopic && /^[a-z0-9-]+$/.test(card.id)) {
      detailHref = `/detail.html?web=${encodeURIComponent(card.id)}&topic=${encodeURIComponent(detailTopic)}`;
    }

    card.querySelectorAll('a[href]').forEach((link) => {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    });

    if (!title.querySelector('a')) {
      const titleLink = document.createElement('a');
      titleLink.href = detailHref;
      titleLink.target = '_blank';
      titleLink.rel = 'noopener noreferrer';
      titleLink.textContent = title.textContent.trim();
      title.replaceChildren(titleLink);
    }

    if (detailTopic) {
      const directParagraphs = [...card.querySelectorAll(':scope > p')];
      const summary = directParagraphs.find((paragraph) =>
        !paragraph.classList.contains('seo-card-meta') && !paragraph.querySelector('a[href]')
      );
      if (summary) summary.classList.add('topic-card-summary-source');

      const extraParagraphs = directParagraphs.filter((paragraph) =>
        paragraph !== summary && !paragraph.classList.contains('seo-card-meta')
      );
      if (extraParagraphs.length) {
        const more = document.createElement('details');
        more.className = 'topic-card-more';
        const moreSummary = document.createElement('summary');
        moreSummary.textContent = '展开页面内规则摘要（可选）';
        more.appendChild(moreSummary);
        extraParagraphs.forEach((paragraph) => more.appendChild(paragraph));
        card.appendChild(more);
      }

      if (!card.querySelector('.topic-card-action-link')) {
        const action = document.createElement('a');
        action.className = 'topic-card-action-link';
        action.href = detailHref;
        action.target = '_blank';
        action.rel = 'noopener noreferrer';
        action.textContent = '查看活动详情 ↗';
        card.insertBefore(action, card.querySelector('.topic-card-more'));
      }
      card.classList.add('topic-compact-card');
    }

    card.classList.add('is-card-link');
    card.tabIndex = 0;
    card.setAttribute('role', 'link');
    card.setAttribute('aria-label', `打开活动：${title.textContent.trim()}`);

    const openPrimaryLink = () => {
      window.open(detailHref, '_blank', 'noopener,noreferrer');
    };

    card.addEventListener('click', (event) => {
      if (event.target.closest('a, button, summary, details')) return;
      openPrimaryLink();
    });

    card.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (event.target.closest('a, button, summary, details')) return;
      event.preventDefault();
      openPrimaryLink();
    });
  });
});
