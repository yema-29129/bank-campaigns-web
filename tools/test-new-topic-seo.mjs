#!/usr/bin/env node

import { readFileSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url);
const SITE = 'https://bank.vooqqqm.com';

function read(path) {
  return readFileSync(new URL(path, ROOT), 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function jsonLdBlocks(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)]
    .map((match) => JSON.parse(match[1]));
}

const topics = [
  {
    path: 'activities/topics/travel-card-offers.html',
    url: `${SITE}/activities/topics/travel-card-offers.html`,
    countPattern: /<li class="detail-section"/g,
    expectedCount: 47,
    lastmod: "2026-11-23",
  },
  {
    path: 'activities/topics/black-friday-2026.html',
    url: `${SITE}/activities/topics/black-friday-2026.html`,
    countPattern: /<li class="detail-section"[^>]*data-campaign/g,
    expectedCount: 125,
    lastmod: "2026-11-26",
    allWebsiteOnly: true,
  },
];

for (const topic of topics) {
  const html = read(topic.path);
  const count = (html.match(topic.countPattern) || []).length;
  assert(count === topic.expectedCount, `${topic.path}: expected ${topic.expectedCount} activities, found ${count}`);
  assert(html.includes('<meta name="robots" content="index,follow'), `${topic.path}: missing indexable robots meta`);
  assert(html.includes(`<link rel="canonical" href="${topic.url}">`), `${topic.path}: missing canonical URL`);
  assert(html.includes(`<meta property="og:url" content="${topic.url}">`), `${topic.path}: missing Open Graph URL`);
  assert(html.includes('<meta name="twitter:card" content="summary">'), `${topic.path}: missing Twitter card`);
  assert(html.includes('href="https://bank.vooqqqm.com/llms.txt"'), `${topic.path}: missing llms.txt discovery link`);
  assert(html.includes('href="https://bank.vooqqqm.com/llms-full.txt"'), `${topic.path}: missing llms-full.txt discovery link`);
  assert(html.includes(`<time datetime="${topic.lastmod}">`), `${topic.path}: missing machine-readable verification date`);
  assert(html.includes('href="/editorial-policy.html"'), `${topic.path}: missing editorial policy link`);

  const schemas = jsonLdBlocks(html);
  assert(schemas.length > 0, `${topic.path}: missing JSON-LD`);
  const graph = schemas.flatMap((schema) => schema['@graph'] || [schema]);
  assert(graph.some((node) => node['@type'] === 'CollectionPage' && node.url === topic.url), `${topic.path}: missing CollectionPage schema`);
  assert(graph.some((node) => node['@type'] === 'BreadcrumbList'), `${topic.path}: missing BreadcrumbList schema`);
  assert(graph.some((node) => node['@type'] === 'ItemList'), `${topic.path}: missing ItemList schema`);

  if (topic.allWebsiteOnly) {
    const campaignTags = [...html.matchAll(/<li class="detail-section"[^>]*data-campaign[^>]*>/g)].map((match) => match[0]);
    assert(campaignTags.every((tag) => tag.includes('data-website-only')), `${topic.path}: every Black Friday activity must remain website-only`);
  }
}

const sitemap = read('sitemap.xml');
for (const topic of topics) {
  const escapedUrl = topic.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = sitemap.match(new RegExp(`<loc>${escapedUrl}</loc>`, 'g')) || [];
  assert(matches.length === 1, `sitemap.xml: ${topic.url} must appear exactly once`);
  assert(sitemap.includes(`<loc>${topic.url}</loc>\n    <lastmod>${topic.lastmod}</lastmod>`), `sitemap.xml: ${topic.url} needs current lastmod`);
}

const llms = read('llms.txt');
const llmsFull = read('llms-full.txt');
for (const topic of topics) {
  assert(llms.includes(topic.url), `llms.txt: missing ${topic.url}`);
  assert(llmsFull.includes(topic.url), `llms-full.txt: missing ${topic.url}`);
}

const robots = read('robots.txt');
for (const bot of ['Googlebot', 'Bingbot', 'OAI-SearchBot', 'GPTBot', 'ClaudeBot', 'PerplexityBot', 'Baiduspider', 'Bytespider']) {
  assert(robots.includes(`User-agent: ${bot}\nAllow: /`), `robots.txt: ${bot} is not explicitly allowed`);
}

const home = read('index.html');
const topicIndex = read('activities/topics/index.html');
for (const topic of topics) {
  assert(home.includes(topic.url), `index.html JSON-LD: missing ${topic.url}`);
  assert(topicIndex.includes(topic.url.replace(SITE, '')), `topic index: missing internal link to ${topic.url}`);
}

console.log('New topic SEO/GEO checks passed.');
