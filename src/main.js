import { Actor } from 'apify';

await Actor.init();

const input = await Actor.getInput() || {};
const niche = input.grantNiche || 'Small Business';
const maxResults = input.maxResults || 10;

// Call the Google Search Scraper
const searchRun = await Actor.call('apify/google-search-scraper', {
    "queries": [`${niche} grants 2026`, `apply for ${niche} funding`],
    "maxPagesPerQuery": 1,
    "resultsPerPage": maxResults
});

const { defaultDatasetId } = searchRun;
const dataset = await Actor.openDataset(defaultDatasetId);
const { items } = await dataset.getData();

const results = items[0].organicResults.map((item) => {
    return {
        grantTitle: item.title,
        link: item.url,
        description: item.description,
        audit_status: item.description.toLowerCase().includes('deadline') ? '🔥 ACTIVE' : 'CHECK SITE',
        pitch: `I found a potential ${niche} grant for you here: ${item.url}`
    };
});

await Actor.pushData(results);
await Actor.exit();
