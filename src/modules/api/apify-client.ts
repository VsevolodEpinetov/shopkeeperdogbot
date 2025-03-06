import dotenv from 'dotenv';
import { ApifyClient } from 'apify-client';

dotenv.config();

// Ensure APIFY_TOKEN exists
const APIFY_TOKEN = process.env.APIFY_TOKEN;
if (!APIFY_TOKEN) {
  throw new Error("❌ Missing APIFY_TOKEN in .env file.");
}

// Initialize ApifyClient with TypeScript types
export const apifyClient = new ApifyClient({ token: APIFY_TOKEN });

// Define type for Kickstarter Actor Configuration
interface KickstarterActorConfig {
  runMode: string;
  startUrls: { url: string }[];
  keepUrlFragments: boolean;
  linkSelector: string;
  globs: string[];
  pseudoUrls: string[];
  excludes: { glob: string }[];
  pageFunction: string;
  injectJQuery: boolean;
  proxyConfiguration: {
    useApifyProxy: boolean;
    apifyProxyGroups: string[];
  };
  proxyRotation: string;
  initialCookies: any[];
  useChrome: boolean;
  headless: boolean;
  ignoreSslErrors: boolean;
  ignoreCorsAndCsp: boolean;
  downloadMedia: boolean;
  downloadCss: boolean;
  maxRequestRetries: number;
  maxPagesPerCrawl: number;
  maxResultsPerCrawl: number;
  maxCrawlingDepth: number;
  maxConcurrency: number;
  pageLoadTimeoutSecs: number;
  pageFunctionTimeoutSecs: number;
  waitUntil: string[];
  preNavigationHooks: string;
  postNavigationHooks: string;
  breakpointLocation: string;
  closeCookieModals: boolean;
  maxScrollHeightPixels: number;
  debugLog: boolean;
  browserLog: boolean;
  customData: object;
}

// Type for extracted project details
interface KickstarterProject {
  url: string;
  projectName: string;
  creatorName: string;
  rewards: { name: string; price: string[] | null }[];
}

// Define the Apify page function as a string
const pageFunctionString: string = `
async function pageFunction(context) {
    const { jQuery: $, page, request, log } = context;

    if (!$) {
        log.error("jQuery is not injected!");
        return {};
    }

    const projectName = $('.project-name').first().text() || 'Unknown';
    log.info(\`Project Name: \${projectName}\`);

    const descriptionMeta = $('meta[name="description"]').attr('content') || '';
    log.info(\`Description Meta: \${descriptionMeta}\`);

    const creatorName = descriptionMeta.includes(' is raising funds') 
        ? descriptionMeta.split(' is raising funds')[0] 
        : 'Unknown';
    log.info(\`Creator Name: \${creatorName}\`);

    const rewardsBlock = $('.sticky-rewards').first();
    const rewardsElements = rewardsBlock.find('li');

    log.info(\`Found \${rewardsElements.length} rewards elements\`);

    const rewards = [];

    rewardsElements.each(function () {
        const rewardName = $(this).find('h3').first().text();
        const rewardPrice = $(this).find('p').first().text().match(/[0-9]+$/g);
        const reward = {
            name: rewardName,
            price: rewardPrice
        }
        rewards.push(reward);
    });

    log.info(\`Extracted Rewards: \${JSON.stringify(rewards)}\`);

    return {
        url: request.url,
        projectName,
        creatorName,
        rewards
    };
}
`.trim();

// Define the default Kickstarter Actor configuration with types
export const defaultKickstarterActor: KickstarterActorConfig = {
  runMode: "PRODUCTION",
  startUrls: [{ url: "" }], // <- Must be declared manually
  keepUrlFragments: false,
  linkSelector: "",
  globs: [],
  pseudoUrls: [],
  excludes: [{ glob: "/**/*.{png,jpg,jpeg,pdf,avif,webp,mp4,gif}" }],
  pageFunction: pageFunctionString,
  injectJQuery: true,
  proxyConfiguration: {
    useApifyProxy: true,
    apifyProxyGroups: ["RESIDENTIAL"],
  },
  proxyRotation: "RECOMMENDED",
  initialCookies: [],
  useChrome: true,
  headless: false,
  ignoreSslErrors: false,
  ignoreCorsAndCsp: false,
  downloadMedia: false,
  downloadCss: true,
  maxRequestRetries: 3,
  maxPagesPerCrawl: 0,
  maxResultsPerCrawl: 0,
  maxCrawlingDepth: 0,
  maxConcurrency: 50,
  pageLoadTimeoutSecs: 60,
  pageFunctionTimeoutSecs: 60,
  waitUntil: ["networkidle2"],
  preNavigationHooks: "",
  postNavigationHooks: "",
  breakpointLocation: "NONE",
  closeCookieModals: false,
  maxScrollHeightPixels: 5000,
  debugLog: false,
  browserLog: false,
  customData: {},
};

