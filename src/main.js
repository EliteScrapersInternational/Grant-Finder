import { Actor } from 'apify';

await Actor.init();

const input = await Actor.getInput() || {};
const { grantNiche, maxResults = 20 } = input;

console.log(`🚀 Comprehensive search started for: ${grantNiche}`);

// We use more specific search terms to find high-quality PDF or .gov/ .org results
const searchRun = await Actor.call('apify/google-search-scraper', {
    "queries": [
        `${grantNiche} grants 2026 apply`,
        `${grantNiche} foundation funding opportunities`,
        `site:.gov "${grantNiche}" grants`
    ],
    "maxPagesPerQuery": 1,
    "resultsPerPage": maxResults
});

const { defaultDatasetId } = searchRun;
const dataset = await Actor.openDataset(defaultDatasetId);
const { items } = await dataset.getData();

// This part cleans the data to make it look professional
const processedGrants = items.flatMap(page => page.organicResults).map(item => {
    const text = (item.description + " " + item.title).toLowerCase();
    
    // Smart Detection: Try to find dollar amounts like $5,000 or $1M
    const moneyMatch = item.description.match(/\$[\d,]+[KkMm]?/);
    const amount = moneyMatch ? moneyMatch[0] : "Check Website";

    // Smart Detection: Check for specific deadlines
    let status = "Verification Needed";
    if (text.includes("deadline") || text.includes("due date")) status = "⌛ DEADLINE LISTED";
    if (text.includes("apply now") || text.includes("open now")) status = "✅ OPEN";

    return {
        grantName: item.title,
        fundingAmount: amount,
        status: status,
        source: item.url,
        summary: item.description,
        isGovernment: item.url.includes('.gov') ? 'Yes' : 'Private/Foundation',
        outreachPitch: `Hello! I found the ${item.title} grant which offers ${amount}. Based on your work in ${grantNiche}, this looks like a perfect match.`
    };
});

await Actor.pushData(processedGrants);
await Actor.exit();
