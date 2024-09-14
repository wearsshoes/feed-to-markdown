const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');
const sanitize = require('sanitize-filename');
const TurndownService = require('turndown');
const imageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];

async function fetchAndParseFeed(feedUrl) {
  try {
    const response = await axios.get(feedUrl);
    const feedXml = response.data;
    return await parseStringPromise(feedXml);
  } catch (error) {
    console.error(`Error fetching or parsing feed: ${error.message}`);
    throw error;
  }
}

function parseAtomFeed(entry, feed) {
  const id = entry.id[0];
  const date = entry.published?.[0] || entry.updated?.[0];
  const link = entry.link?.find(l => l.$.rel === 'alternate')?.$.href || entry.link?.[0]?.$.href;
  const title = (entry.title?.[0]?._ || entry.title?.[0])?.toString().replace(/<[^>]*>/g, '').replace(/[^\w\s-]/g, '') || '';
  const content = entry.content?.[0]?._;
  const description = entry.summary?.[0] || (content ? content.replace(/(<([^>]+)>)/gi, "").split(" ").splice(0, 50).join(" ") : '');
  const author = entry.author?.[0]?.name?.[0] || feed?.author?.[0]?.name?.[0] || 'Unknown Author';
  const categories = Array.isArray(entry.category) ? entry.category.map(cat => cat._ || cat).join(',') : entry.category;

  return { id, date, link, title, content, description, author, categories };
}

function parseRSSFeed(entry) {
  const id = entry['yt:videoId']?.[0] || entry['id']?.[0] || entry.guid?.[0]?.['_'] || entry.guid?.[0] || '';
  const date = entry.published?.[0] || entry.pubDate?.[0] || entry.updated?.[0] || '';
  const link = entry.link?.[0]?.$?.href || entry.link?.[0] || '';
  const title = (entry.title?.[0] || entry.title || '')?.toString().replace(/[^\w\s-]/g, '') || '';
  const content = entry.description?.[0] || entry['media:group']?.[0]?.['media:description']?.[0] || entry.content?.[0]?.['_'] || '';
  const description = entry['media:group']?.[0]?.['media:description']?.[0] || (content ? content.replace(/(<([^>]+)>)/gi, "").split(" ").splice(0, 50).join(" ") : '') || '';
  const author = entry.author?.[0]?.name?.[0] || entry.author?.[0]?.['n']?.[0] || entry['dc:creator']?.[0] || 'Unknown Author';
  const categories = Array.isArray(entry.category) ? entry.category.join(',') : entry.category;
  const video = entry['media:group']?.[0]?.['media:content']?.[0]?.$?.url || '';
  const image = entry['media:group']?.[0]?.['media:thumbnail']?.[0]?.$.url || entry['media:thumbnail']?.[0]?.$.url || '';
  const images = (entry['enclosure'] || entry['media:content'])?.filter(e => imageTypes.includes(e.$['type']))?.map(e => e.$.url) || [];
  const views = entry['media:group']?.[0]?.['media:community']?.[0]?.['media:statistics']?.[0]?.$.views || '';
  const rating = entry['media:group']?.[0]?.['media:community']?.[0]?.['media:starRating']?.[0]?.$.average || '';

  return { id, date, link, title, content, description, author, categories, video, image, images, views, rating };
}

const generateMarkdown = (template, entry, feed) => {
  const isAtom = !!entry.id;
  const parsedEntry = isAtom ? parseAtomFeed(entry, feed) : parseRSSFeed(entry);

  const markdown = parsedEntry.content ? new TurndownService({codeBlockStyle: 'fenced', fenced: '```', bulletListMarker: '-'}).turndown(parsedEntry.content) : '';

  const safeDescription = (typeof parsedEntry.description === 'string') ? parsedEntry.description : String(parsedEntry.description);

  const output = template
    .replace(/\[ID\]/g, parsedEntry.id)
    .replace(/\[LINK\]/g, parsedEntry.link)
    .replace(/\[DATE\]/g, parsedEntry.date)
    .replace(/\[TITLE\]/g, parsedEntry.title.replace(/\s+/g, ' ').trim())
    .replace(/\[DESCRIPTION\]/g, safeDescription.replace(/\s+/g, ' ').trim())
    .replace(/\[CONTENT\]/g, parsedEntry.content || '')
    .replace(/\[MARKDOWN\]/g, markdown)
    .replace(/\[AUTHOR\]/g, parsedEntry.author)
    .replace(/\[VIDEO\]/g, parsedEntry.video || '')
    .replace(/\[IMAGE\]/g, parsedEntry.image || '')
    .replace(/\[IMAGES\]/g, parsedEntry.images ? parsedEntry.images.join(',') : '')
    .replace(/\[CATEGORIES\]/g, parsedEntry.categories || '')
    .replace(/\[VIEWS\]/g, parsedEntry.views || '')
    .replace(/\[RATING\]/g, parsedEntry.rating || '');

  return { output, date: parsedEntry.date, title: parsedEntry.title };
}

function saveMarkdown(outputDir, date, title, markdown) {
  const slug = sanitize(`${formattedDate}-${title.toLowerCase().replace(/\s+/g, '-')}`).substring(0, 50);
  const fileName = `${slug}.md`;
  const filePath = path.join(outputDir, fileName);

  fs.writeFileSync(filePath, markdown);

  return filePath;
}

module.exports = { fetchAndParseFeed, generateMarkdown, saveMarkdown };
