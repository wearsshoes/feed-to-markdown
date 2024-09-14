const core = require('@actions/core');
const github = require('@actions/github');
const { fetchAndParseFeed, generateMarkdown, saveMarkdown } = require('./process');
const fs = require('fs');

async function run() {
  try {
    let feedUrl, templateFile, outputDir;

    if (process.env.GITHUB_ACTIONS) {
      // Running in GitHub Actions
      feedUrl = core.getInput('feed_url');
      templateFile = core.getInput('template_file');
      outputDir = core.getInput('output_dir');
    } else {
      // Running locally
      feedUrl = process.argv[2];
      templateFile = process.argv[3];
      outputDir = process.argv[4];
    }
    if (!fs.existsSync(templateFile)) {
      throw new Error(`Template file '${templateFile}' does not exist.`);
    }

    if (!feedUrl || !templateFile || !outputDir) {
      throw new Error('Missing required inputs: feed_url, template_file, or output_dir');
    }
    if (!fs.existsSync(templateFile)) {
      throw new Error(`Template file '${templateFile}' does not exist.`);
    }

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`Output directory '${outputDir}' created.`);
    }

    // Read the template file
    const template = fs.readFileSync(templateFile, 'utf8');

    // Fetch and parse the RSS feed
    const feedData = await fetchAndParseFeed(feedUrl);

    const entries = feedData?.feed?.entry || feedData?.rss?.channel?.[0]?.item || [];

    // Process the feed entries and generate Markdown files
    entries.forEach((entry) => {

      const { output, date, title } = generateMarkdown(template, entry, feedData);
      const filePath = saveMarkdown(outputDir, date, title, output);

      console.log(`Markdown file '${filePath}' created.`);
    });
  }
  catch (error) {
    if (process.env.GITHUB_ACTIONS) {
      core.setFailed(error.message);
    } else {
      console.error(error.message);
      process.exit(1);
    }
  }
}

run();