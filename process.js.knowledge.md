# process.js Knowledge

## Purpose
- Contains core functionality for fetching, parsing, and processing RSS feeds

## Key Functions
- `fetchAndParseFeed(feedUrl)`: Fetches and parses the RSS feed
- `generateMarkdown(template, entry)`: Generates Markdown content from a template and feed entry
- `saveMarkdown(outputDir, date, title, output)`: Saves the generated Markdown to a file

## Important Notes
- Uses `axios` for HTTP requests
- Uses `xml2js` for XML parsing
- Uses `turndown` for converting HTML to Markdown
- Handles various RSS feed formats (RSS 2.0, Atom)

## Best Practices
- Handle different feed formats gracefully
- Sanitize file names to avoid issues with special characters
- Ensure proper error handling and data validation

