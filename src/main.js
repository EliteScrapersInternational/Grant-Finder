import { Actor } from 'apify';

await Actor.init();

const input = await Actor.getInput() || {};
const niche = input.grantNiche || 'Small Business';
const maxResults = input.maxResults || 10;

console.log(`🔎 Searching for ${niche} grants...`);

// Using Google Search Scraper to find the latest opportunities
const searchRun = await Actor.call('apify/google-search-scraper', {
    "queries": [`${niche} grants 2026`, `apply for ${niche} funding 2026`],
    "maxPagesPerQuery": 1,
    "resultsPerPage": maxResults
});

const { defaultDatasetId } = searchRun;
const dataset = await Actor.openDataset(defaultDatasetId);
const { items } = await dataset.getData();

// Process the search results into "Audit Records"
const grantLeads = items[0].organicResults.map((result) => {
    const text = result.description.toLowerCase();
    
    // Check if it's a real grant or just an article
    let status = "Potential Lead";
    if (text.includes("apply now") || text.includes("deadline")) {
        status = "🔥 ACTIVE OPPORTUNITY";
    }

    return {
        grantTitle: result.title,
        link: result.url,
        summary: result.description,
        status: status,
        audit_note: `Check this site for a ${niche} grant application.`,
        next_step: "Review eligibility requirements on the website."
    };
});

await Actor.pushData(grantLeads);
await Actor.exit();
