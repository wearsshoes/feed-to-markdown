const { generateMarkdown, saveMarkdown } = require('../process');
const { parseStringPromise } = require('xml2js');
const fs = require('fs');
const path = require('path');



// Mocking writeFileSync while keeping readFileSync operational
jest.mock('fs', () => {
    const actualFs = jest.requireActual('fs');
    return {
        ...actualFs,
        writeFileSync: jest.fn(),
    };
});

// Helper function to load files
const loadFile = (filePath) => {
    try {
        console.log(`Loading file from path: ${filePath}`);
        // Check if file exists
        if (fs.existsSync(filePath)) {
            // Read file synchronously
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            console.log(`Loaded file content: ${fileContent}`);
            return fileContent;
        } else {
            console.log("File not found");
            return null;
        }
    } catch (error) {
        console.error(`Error loading file: ${error.message}`);
        return null;
    }
};

const normalizeWhitespace = (str) => str.replace(/\s+/g, ' ').trim();

describe('YouTube Feed Tests', () => {
    test('Load and process YouTube XML and template', async () => {
        const xmlPath = 'tests/youtube/feed.xml';
        const templatePath = 'tests/youtube/template.md';

        const xmlFilePath = path.join(__dirname, '..', xmlPath);
        const templateFilePath = path.join(__dirname, '..', templatePath);

        const xmlContent = loadFile(xmlFilePath);
        const templateContent = loadFile(templateFilePath);

        if (!xmlContent || !templateContent) {
            throw new Error('Failed to load XML or template file');
        }

        const feedData = await parseStringPromise(xmlContent);
        console.log('feedData', feedData.feed.entry[0]);

        const entry = feedData.feed.entry[0];
        const { output, date, title } = generateMarkdown(templateContent, entry, feedData.feed);

        console.log('Generated markdown:', output);
        expect(output).toBeDefined();
    });

    test('YouTube generateMarkdown should replace placeholders correctly', async () => {
        const xmlPath = 'tests/youtube/feed.xml';
        const templatePath = 'tests/youtube/template.md';

        const xmlFilePath = path.join(__dirname, '..', xmlPath);
        const templateFilePath = path.join(__dirname, '..', templatePath);

        const xmlContent = loadFile(xmlFilePath);
        const templateContent = loadFile(templateFilePath);

        if (!xmlContent || !templateContent) {
            throw new Error('Failed to load XML or template file');
        }

        const feedData = await parseStringPromise(xmlContent);
        const entry = feedData.feed.entry[0];
        const { output, date, title } = generateMarkdown(templateContent, entry, feedData.feed);

        const expectedMarkdown = `
# My Title
**Link:** https://www.youtube.com/watch?v=4BxrfhUwldc
**Description:** My description here
**Author:** Keiran Lovett
**Published Date:** 2024-05-10T09:21:26+00:00
**Video:** https://www.youtube.com/v/4BxrfhUwldc?version=3
**Thumbnail:** ![Thumbnail](https://i1.ytimg.com/vi/4BxrfhUwldc/hqdefault.jpg)
**Categories:**
**Views:** 48
**Rating:** 5.00
`;

        console.log('Expected markdown:', normalizeWhitespace(expectedMarkdown));
        console.log('Generated markdown:', normalizeWhitespace(output));

        expect(normalizeWhitespace(output)).toBe(normalizeWhitespace(expectedMarkdown));
        expect(date).toBe('2024-05-10T09:21:26+00:00');
        expect(title).toBe('My Title');
    });
});

describe('Atom Feed Tests', () => {
    test('Process Atom feed', async () => {
        const xmlPath = 'tests/atom/feed.xml';
        const templatePath = 'tests/atom/template.md';

        const xmlFilePath = path.join(__dirname, '..', xmlPath);
        const templateFilePath = path.join(__dirname, '..', templatePath);

        const xmlContent = loadFile(xmlFilePath);
        const templateContent = loadFile(templateFilePath);

        if (!xmlContent || !templateContent) {
            throw new Error('Failed to load Atom XML or template file');
        }

        const feedData = await parseStringPromise(xmlContent);
        const feed = feedData.feed;
        const entry = feed.entry[0];
        console.log('Atom feed entry:', JSON.stringify(entry, null, 2));
        console.log('Atom feed:', JSON.stringify(feed, null, 2));
        const { output, date, title } = generateMarkdown(templateContent, entry, feedData);

        const expectedMarkdown = `
# New Feature Alert: Access Archived Webpages Directly Through Google Search
**Link:** https://blog.archive.org/2024/09/11/new-feature-alert-access-archived-webpages-directly-through-google-search/
**Description:** In a significant step forward for digital preservation, Google Search is now making it easier than ever to access the past. Starting today, users everywhere can view archived versions of webpages directly through Google Search, with a simple link to the Internet Archive's Wayback Machine.
**Author:** Chris Freeland
**Published Date:** 2024-09-11T12:23:41Z
**Content:** In a significant step forward for digital preservation, Google Search is now making it easier than ever to access the past. Starting today, users everywhere can view archived versions of webpages directly through Google Search, with a simple link to the Internet Archive's Wayback Machine.

How It Works

To access this new feature, conduct a search on Google as usual. Next to each search result, you'll find three dots—clicking on these will bring up the "About this Result" panel. Within this panel, select "More About This Page" to reveal a link to the Wayback Machine page for that website.

Through this direct link, you'll be able to view previous versions of a webpage via the Wayback Machine, offering a snapshot of how it appeared at different points in time.

A Commitment to Preservation

At the Internet Archive, our mission is to provide, "Universal Access to All Knowledge." The Wayback Machine, one of our best-known services, provides access to billions of archived webpages, ensuring that the digital record remains accessible for future generations.

As Mark Graham, director of the Wayback Machine, explains:


"The web is aging, and with it, countless URLs now lead to digital ghosts. Businesses fold, governments shift, disasters strike, and content management systems evolve—all erasing swaths of online history. Sometimes, creators themselves hit delete, or bow to political pressure. Enter the Internet Archive's Wayback Machine: for more than 25 years, it's been preserving snapshots of the public web. This digital time capsule transforms our "now-only" browsing into a journey through internet history. And now, it's just a click away from Google search results, opening a portal to a fuller, richer web—one that remembers what others have forgotten."


This collaboration with Google underscores the importance of web archiving and expands the reach of the Wayback Machine, making it even easier for users to access and explore archived content. However, the link to archived webpages will not be available in instances where the rights holder has opted out of having their site archived or if the webpage violates content policies.

For more information about the Wayback Machine and how you can explore the web's history, visit https://web.archive.org/.
`;

        expect(normalizeWhitespace(output)).toBe(normalizeWhitespace(expectedMarkdown));
        expect(date).toBe('2024-09-11T12:23:41Z');
        expect(title).toBe('New Feature Alert: Access Archived Webpages Directly Through Google Search');
    });
});

test('saveMarkdown should save file correctly', () => {
    const outputDir = 'output';
    const date = '2024-05-10T09:21:26+00:00';
    const title = 'My Title';
    const markdown = 'Test Content';

    fs.writeFileSync.mockImplementation(() => {});

    const filePath = saveMarkdown(outputDir, date, title, markdown);

    const expectedFileName = path.join(outputDir, '2024-05-10-my-title.md');
    expect(fs.writeFileSync).toHaveBeenCalledWith(expectedFileName, markdown);
    expect(filePath).toBe(expectedFileName);
});