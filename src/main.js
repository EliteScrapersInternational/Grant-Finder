import { Actor } from 'apify';

await Actor.init();

const input = await Actor.getInput() || {};
const { grantNiche, maxResults = 15 } = input;

console.log(`📡 EXECUTING ELITE ABSOLUTE AUDIT: ${grantNiche}`);

// Search for high-intent grant terms
const searchRun = await Actor.call('apify/google-search-scraper', {
    "queries": [
        `"${grantNiche}" grant eligibility 2026`,
        `how to apply for ${grantNiche} funding 2026`,
        `site:.org "${grantNiche}" foundation grants`
    ],
    "maxPagesPerQuery": 1,
    "resultsPerPage": maxResults
});

const { defaultDatasetId } = searchRun;
const dataset = await Actor.openDataset(defaultDatasetId);
const { items } = await dataset.getData();
const rawLeads = items.flatMap(page => page.organicResults);

const eliteResults = rawLeads.map(lead => {
    const content = (lead.title + " " + lead.description).toLowerCase();
    
    // 🔍 ELIGIBILITY AUDIT
    let eligibility = "General Business";
    if (content.includes("minority") || content.includes("diverse")) eligibility = "Minority-Owned";
    if (content.includes("woman") || content.includes("female")) eligibility = "Women-Owned";
    if (content.includes("non-profit") || content.includes("501c3")) eligibility = "Non-Profit Only";
    if (content.includes("veteran")) eligibility = "Veteran-Owned";

    // 💰 FUNDING MAGNITUDE
    let tier = "Tier 3 (Small/Unknown)";
    if (content.includes("million") || content.includes("1,000,000")) tier = "Tier 1 (High Funding)";
    else if (content.includes("thousand") || content.includes("50,000")) tier = "Tier 2 (Mid Funding)";

    // ⚠️ RISK AUDIT
    let riskLevel = "Low";
    if (content.includes("closed") || content.includes("expired")) riskLevel = "CRITICAL: EXPIRED";
    if (content.includes("contest") || content.includes("luck")) riskLevel = "Medium (Contest-style)";

    // 📝 COMPLEXITY CHECK
    const complexity = content.includes("proposal") || content.includes("narrative") || content.includes("writing") ? "High (Full Proposal Required)" : "Medium (Form-based)";

    return {
        grantName: lead.title,
        eligibilityFocus: eligibility,
        fundingTier: tier,
        complexity: complexity,
        riskAudit: riskLevel,
        directLink: lead.url,
        professionalPitch: `I analyzed the ${lead.title}. This ${tier} opportunity is ${complexity
