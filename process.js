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

function parseFeedEntry(entry, feed) {
  const isAtom = !!entry.id;
  const isMRSS = !!entry['media:group'];

  let id, date, link, title, content, description, author, categories, video, image, views, rating;

  if (isAtom) {
    id = entry.id?.[0] || '';
    date = entry.updated?.[0] || entry.published?.[0] || '';
    link = entry.link?.find(l => l.$ && l.$.rel === 'alternate')?.$.href || entry.link?.[0]?.$.href || '';
    title = entry.title?.[0]?._ || entry.title?.[0] || '';
    content = entry.content?.[0]?._ || entry.content?.[0] || '';
    description = entry.summary?.[0] || '';
    author = entry.author?.[0]?.name?.[0] || feed?.author?.[0]?.name?.[0] || '';
    categories = entry.category
      ? Array.isArray(entry.category)
        ? entry.category.map(cat => cat.$.term || '').filter(Boolean).join(',')
        : entry.category.$.term || ''
      : '';
  } else {
    id = entry.guid?.[0]?.['_'] || entry.guid?.[0] || '';
    date = entry.pubDate?.[0] || '';
    link = entry.link?.[0] || '';
    title = entry.title?.[0] || '';
    content = entry['content:encoded']?.[0] || entry.description?.[0] || '';
    description = entry.description?.[0] || '';
    author = entry.author?.[0] || entry['dc:creator']?.[0] || '';
    categories = Array.isArray(entry.category)
      ? entry.category.map(cat => typeof cat === 'object' ? cat._ || '' : cat).join(',')
      : entry.category || '';
  }

  if (isMRSS) {
    const mediaGroup = entry['media:group']?.[0] || {};
    description = mediaGroup['media:description']?.[0] || description;
    video = mediaGroup['media:content']?.[0]?.$.url || '';
    image = mediaGroup['media:thumbnail']?.[0]?.$.url || '';
    views = mediaGroup['media:community']?.[0]?.['media:statistics']?.[0]?.$.views || '';
    rating = mediaGroup['media:community']?.[0]?.['media:starRating']?.[0]?.$.average || '';
  }

  if (typeof content === 'object') content = content._ || '';
  if (typeof description === 'object') description = description._ || '';

  return {
    id, date, link, title, content, description, author, categories,
    video, image, views, rating
  };
}

const generateMarkdown = (template, entry, feed) => {
  const parsedEntry = parseFeedEntry(entry, feed);
  const turndownService = new TurndownService({
    codeBlockStyle: 'fenced',
    fenced: '```',
    bulletListMarker: '-'
  });

  const markdownContent = parsedEntry.content ? turndownService.turndown(parsedEntry.content) : '';
  const markdownDescription = parsedEntry.description ? turndownService.turndown(parsedEntry.description) : '';

  const safeReplace = (placeholder, value) => value?.toString() || '';

  const output = template
    .replace(/\[ID\]/g, safeReplace('ID', parsedEntry.id))
    .replace(/\[LINK\]/g, safeReplace('LINK', parsedEntry.link))
    .replace(/\[DATE\]/g, safeReplace('DATE', parsedEntry.date))
    .replace(/\[TITLE\]/g, safeReplace('TITLE', parsedEntry.title).replace(/\s+/g, ' ').trim())
    .replace(/\[DESCRIPTION\]/g, safeReplace('DESCRIPTION', markdownDescription).replace(/\s+/g, ' ').trim())
    .replace(/\[CONTENT\]/g, safeReplace('CONTENT', markdownContent))
    .replace(/\[AUTHOR\]/g, safeReplace('AUTHOR', parsedEntry.author))
    .replace(/\[VIDEO\]/g, safeReplace('VIDEO', parsedEntry.video))
    .replace(/\[IMAGE\]/g, safeReplace('IMAGE', parsedEntry.image))
    .replace(/\[CATEGORIES\]/g, safeReplace('CATEGORIES', parsedEntry.categories))
    .replace(/\[VIEWS\]/g, safeReplace('VIEWS', parsedEntry.views))
    .replace(/\[RATING\]/g, safeReplace('RATING', parsedEntry.rating));

  return { output, date: parsedEntry.date, title: parsedEntry.title };
}

function saveMarkdown(outputDir, date, title, markdown) {
  const formattedDate = new Date(date).toISOString().split('T')[0]; // Format date as YYYY-MM-DD
  const slug = sanitize(`${formattedDate}-${title.toLowerCase().replace(/\s+/g, '-')}`).substring(0, 50);
  const fileName = `${slug}.md`;
  const filePath = path.join(outputDir, fileName);

  fs.writeFileSync(filePath, markdown);

  return filePath;
}

module.exports = { fetchAndParseFeed, generateMarkdown, saveMarkdown };