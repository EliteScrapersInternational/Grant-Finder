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
const rawLeads = items.flatMap(page => page.organicResults || []);

const eliteResults = rawLeads.map(lead => {
    const content = ((lead.title || "") + " " + (lead.description || "")).toLowerCase();
    
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
        2026-04-13T08:30:35.633Z ACTOR: Pulling container image of build QjHeGCDnendBScgCN from registry.
2026-04-13T08:30:36.688Z ACTOR: Creating container.
2026-04-13T08:30:36.790Z ACTOR: Starting container.
2026-04-13T08:30:36.791Z ACTOR: Running under "LIMITED_PERMISSIONS" permission level.
2026-04-13T08:30:37.341Z
2026-04-13T08:30:37.341Z > grant-finder-bot@1.2.0 start
2026-04-13T08:30:37.342Z > node src/main.js
2026-04-13T08:30:37.342Z
2026-04-13T08:30:37.408Z file:///usr/src/app/src/main.js:56
2026-04-13T08:30:37.409Z         professionalPitch: `I analyzed the ${lead.title}. This ${tier} opportunity is ${complexity
2026-04-13T08:30:37.410Z
2026-04-13T08:30:37.410Z SyntaxError: Missing } in template expression
2026-04-13T08:30:37.410Z     at compileSourceTextModule (node:internal/modules/esm/utils:346:16)
2026-04-13T08:30:37.431Z     at ModuleLoader.moduleStrategy (node:internal/modules/esm/translators:146:18)
2026-04-13T08:30:37.442Z     at #translate (node:internal/modules/esm/loader:497:12)
2026-04-13T08:30:37.452Z     at ModuleLoader.loadAndTranslate (node:internal/modules/esm/loader:544:27)
2026-04-13T08:30:37.454Z     at async ModuleJob._link (node:internal/modules/esm/module_job:148:19)
2026-04-13T08:30:37.455Z
2026-04-13T08:30:37.455Z Node.js v20.20.1
`
    };
});

await Actor.pushData(eliteResults);
await Actor.exit();
