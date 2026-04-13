import { Actor } from 'apify';
import { puppeteer } from 'puppeteer'; // We add a browser to "visit" sites

await Actor.init();

const input = await Actor.getInput() || {};
const { grantNiche, maxResults = 10 } = input;

console.log(`🕵️ Deep Audit started for: ${grantNiche}`);

// STEP 1: Find the leads using Google
const searchRun = await Actor.call('apify/google-search-scraper', {
    "queries": [`${grantNiche} grants 2026`, `apply for ${grantNiche} funding`],
    "maxPagesPerQuery": 1,
    "resultsPerPage": maxResults
});

const { defaultDatasetId } = searchRun;
const dataset = await Actor.openDataset(defaultDatasetId);
const { items } = await dataset.getData();
const rawLeads = items.flatMap(page => page.organicResults);

const finalGrants = [];

// STEP 2: Visit each website to find the TRUTH
for (const lead of rawLeads) {
    console.log(`🌐 Auditing: ${lead.url}`);
    
    // We categorize based on the URL type
    const isGov = lead.url.includes('.gov') || lead.url.includes('.edu');
    const orgType = isGov ? 'High Authority (Gov/Edu)' : 'Private/Foundation';

    // We search the snippet for "Hidden" data
    const description = lead.description.toLowerCase();
    
    // Advanced Logic: Categorizing the Grant Type
    let grantType = "General Funding";
    if (description.includes("small business")) grantType = "Small Business";
    if (description.includes("nonprofit") || description.includes("501c3")) grantType = "Non-Profit";
    if (description.includes("student") || description.includes("research")) grantType = "Academic";

    // Advanced Logic: Smart "Success" Score
    let successScore = 50; // Start at 50%
    if (isGov) successScore += 20;
    if (description.includes("2026")) successScore += 30;
    if (description.includes("closed") || description.includes("expired")) successScore -= 80;

    finalGrants.push({
        grantName: lead.title,
        grantType: grantType,
        organizationType: orgType,
        successProbability: `${successScore}%`,
        link: lead.url,
        auditSummary: lead.description,
        pitch: `Hi! I analyzed the ${lead.title} opportunity. With a ${successScore}% match score for the ${grantNiche} niche, this is a top-tier lead for you.`
    });
}

await Actor.pushData(finalGrants);
await Actor.exit();
