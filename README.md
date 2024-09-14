# RSS Feed to Markdown

This GitHub Action converts RSS feed entries to Markdown files. It fetches the RSS feed, extracts relevant information from each entry, and generates Markdown files using a provided template.

## Input Variables

- `feed_url` (required): The URL of the RSS feed.
- `template_file` (required): The path to the template file.
- `output_dir` (required): The directory where the generated Markdown files will be saved.

## Example Usage

```yaml
name: RSS Feed to Markdown

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  convert_feeds:
    runs-on: ubuntu-latest

    steps:
      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'

      - name: Checkout code
        uses: actions/checkout@v2

      - name: Run RSS Feed to Markdown Action
        uses: keiranlovett/rss-feed-to-markdown@main
        with:
          feed_url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCuVczNc74_jsmgNlAhHbz-Q'
          template_file: 'assets/template.md'
          output_dir: '_posts/events/'
```

## Template File

The template file is used to define the structure of the generated Markdown files. You can customize it to fit your desired output format. Here's how to create and use a template:

1. Create a new Markdown file named `template.md`.
2. Use Markdown syntax and add placeholders for dynamic content.
3. Available placeholders:
   - `[ID]`: Unique identifier for the entry
   - `[DATE]`: Publication date
   - `[LINK]`: URL of the entry
   - `[TITLE]`: Title of the entry
   - `[DESCRIPTION]`: Short description or summary
   - `[CONTENT]`: Full content (HTML)
   - `[MARKDOWN]`: Full content (converted to Markdown)
   - `[AUTHOR]`: Author of the entry
   - `[VIDEO]`: Video URL (if available)
   - `[IMAGE]`: Main image URL
   - `[IMAGES]`: Comma-separated list of image URLs
   - `[CATEGORIES]`: Comma-separated list of categories
   - `[VIEWS]`: Number of views (if available)
   - `[RATING]`: Rating (if available)

Example template:

```markdown
---
id: [ID]
link: [LINK]
title: [TITLE]
date: [DATE]
author: [AUTHOR]
categories: [CATEGORIES]
image: [IMAGE]
description: >
  [DESCRIPTION]
---
# [TITLE]
##### By [AUTHOR] on [DATE]

[MARKDOWN]
![Thumbnail]([IMAGE])
```

## Development

To set up the project for development:

1. Clone the repository
2. Install dependencies:
   ```
   yarn install
   ```
3. Run tests:
   ```
   yarn test
   ```

## Building the Project

```bash
yarn build
```

This command uses `@vercel/ncc` to compile all source code and dependencies into a single file in the `dist` directory.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

If you have any questions or need further assistance, please open an issue.
