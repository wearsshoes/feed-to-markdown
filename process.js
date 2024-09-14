const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');
const sanitize = require('sanitize-filename');
const TurndownService = require('turndown');
const imageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
async function fetchAndParseFeed(feedUrl) {
  const response = await axios.get(feedUrl);
  const feedXml = response.data;
  return parseStringPromise(feedXml);
}
const generateMarkdown = (template, entry, feed) => {
  const isAtom = !!entry.id;
  const id = isAtom ? entry.id[0] : (entry['yt:videoId']?.[0] || entry['id']?.[0] || entry.guid?.[0]?.['_'] || entry.guid?.[0] || '');
  const date = isAtom ? entry.published?.[0] || entry.updated?.[0] : (entry.published?.[0] || entry.pubDate?.[0] || entry.updated?.[0] || '');
  const link = isAtom ? entry.link?.[0]?.$.href : (entry.link?.[0]?.$?.href || entry.link?.[0] || '');
  const title = (isAtom ? entry.title?.[0]?._ || entry.title?.[0] : entry.title?.[0] || entry.title || '')?.toString().replace(/[^\w\s-]/g, '') || '';
  const content = isAtom ? entry.content?.[0]?._ : (entry.description?.[0] || entry['media:group']?.[0]?.['media:description']?.[0] || entry.content?.[0]?.['_'] || '');
  const markdown = content ? new TurndownService({codeBlockStyle: 'fenced', fenced: '```', bulletListMarker: '-'}).turndown(content) : '';
  const description = entry.summary?.[0] || entry['media:group']?.[0]?.['media:description']?.[0] || (content ? content.replace(/(<([^>]+)>)/gi, "").split(" ").splice(0, 50).join(" ") : '') || '';
  const author = isAtom
    ? (feed?.author?.[0]?.name?.[0] || 'Unknown Author')
    : (entry.author?.[0]?.name?.[0] || entry.author?.[0]?.['n']?.[0] || entry['dc:creator']?.[0] || 'Unknown Author');
  const video = entry['media:group']?.[0]?.['media:content']?.[0]?.$?.url || '';
  const image = entry['media:group']?.[0]?.['media:thumbnail']?.[0]?.$.url || entry['media:thumbnail']?.[0]?.$.url || '';
  const images = (entry['enclosure'] || entry['media:content'])?.filter(e => imageTypes.includes(e.$['type']))?.map(e => e.$.url) || [];

  let categories = '';
  if (Array.isArray(entry.category)) {
    categories = entry.category.map(cat => cat._ || cat).join(',');
  } else if (typeof entry.category === 'string') {
    categories = entry.category;
  } else if (entry.category && typeof entry.category === 'object') {
    categories = Object.values(entry.category).join(',');
  }
  const views = entry['media:group']?.[0]?.['media:community']?.[0]?.['media:statistics']?.[0]?.$.views || '';
  const rating = entry['media:group']?.[0]?.['media:community']?.[0]?.['media:starRating']?.[0]?.$.average || '';

  const safeDescription = (typeof description === 'string') ? description : String(description);

  const output = template
    .replace(/\[ID\]/g, id)
    .replace(/\[LINK\]/g, link)
    .replace(/\[DATE\]/g, date)
    .replace(/\[TITLE\]/g, title.replace(/\s+/g, ' ').trim())
    .replace(/\[DESCRIPTION\]/g, safeDescription.replace(/\s+/g, ' ').trim())
    .replace(/\[CONTENT\]/g, content || '')
    .replace(/\[MARKDOWN\]/g, markdown)
    .replace(/\[AUTHOR\]/g, author)
    .replace(/\[VIDEO\]/g, video)
    .replace(/\[IMAGE\]/g, image)
    .replace(/\[IMAGES\]/g, images.join(','))
    .replace(/\[CATEGORIES\]/g, categories)
    .replace(/\[VIEWS\]/g, views)
    .replace(/\[RATING\]/g, rating);

  return { output, date, title };
}

function saveMarkdown(outputDir, date, title, markdown) {
  const formattedDate = date ? new Date(date).toISOString().split('T')[0] : '';
  const slug = sanitize(`${formattedDate}-${title.toLowerCase().replace(/\s+/g, '-')}`).substring(0, 50);
  const fileName = `${slug}.md`;
  const filePath = path.join(outputDir, fileName);

  fs.writeFileSync(filePath, markdown);

  return filePath;
}

module.exports = { fetchAndParseFeed, generateMarkdown, saveMarkdown };
