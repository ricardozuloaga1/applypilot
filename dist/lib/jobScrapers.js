"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeIndeedJobs = scrapeIndeedJobs;
exports.scrapeWithPlaywright = scrapeWithPlaywright;
exports.scrapeMultipleSites = scrapeMultipleSites;
var utils_1 = require("./utils");
// Custom Indeed scraper using fetch (no browser automation needed)
function scrapeIndeedJobs(jobTitle_1) {
    return __awaiter(this, arguments, void 0, function (jobTitle, location, maxJobs) {
        var searchParams, indeedUrl, response, html, jobs, error_1;
        if (location === void 0) { location = 'Remote'; }
        if (maxJobs === void 0) { maxJobs = 25; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    console.log("Scraping Indeed for: ".concat(jobTitle, " in ").concat(location));
                    searchParams = new URLSearchParams({
                        q: jobTitle,
                        l: location,
                        start: '0',
                        limit: maxJobs.toString()
                    });
                    indeedUrl = "https://www.indeed.com/jobs?".concat(searchParams);
                    console.log('Indeed URL:', indeedUrl);
                    return [4 /*yield*/, fetch(indeedUrl, {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                                'Accept-Language': 'en-US,en;q=0.5',
                                'Accept-Encoding': 'gzip, deflate, br',
                                'Connection': 'keep-alive',
                                'Upgrade-Insecure-Requests': '1',
                            }
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        console.log("Indeed responded with status: ".concat(response.status));
                        return [2 /*return*/, []];
                    }
                    return [4 /*yield*/, response.text()];
                case 2:
                    html = _a.sent();
                    jobs = parseIndeedHTML(html, jobTitle, location);
                    console.log("Successfully scraped ".concat(jobs.length, " jobs from Indeed"));
                    return [2 /*return*/, jobs];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error scraping Indeed:', error_1);
                    return [2 /*return*/, []];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Parse Indeed HTML to extract job data
function parseIndeedHTML(html, jobTitle, location) {
    var jobs = [];
    try {
        // Indeed uses various selectors, we'll try to extract what we can
        // This is a simplified parser - in production you'd want more robust parsing
        // Look for job card patterns in the HTML
        var jobCardRegex = /<div[^>]*data-jk="([^"]*)"[^>]*>.*?<h2[^>]*>.*?<a[^>]*href="([^"]*)"[^>]*>.*?<span[^>]*title="([^"]*)"[^>]*>.*?<\/h2>.*?<span[^>]*data-testid="company-name"[^>]*>([^<]*)<\/span>.*?<div[^>]*data-testid="job-location"[^>]*>([^<]*)<\/div>/gs;
        var match = void 0;
        var count = 0;
        while ((match = jobCardRegex.exec(html)) !== null && count < 25) {
            var jobKey = match[1], relativeUrl = match[2], title = match[3], company = match[4], jobLocation = match[5];
            if (title && company) {
                var job = {
                    id: (0, utils_1.generateId)(),
                    title: title.trim(),
                    company: company.trim(),
                    location: (jobLocation === null || jobLocation === void 0 ? void 0 : jobLocation.trim()) || location,
                    url: relativeUrl.startsWith('http') ? relativeUrl : "https://www.indeed.com".concat(relativeUrl),
                    description: "".concat(title, " position at ").concat(company, ". View full details on Indeed."),
                    dateScraped: new Date().toISOString(),
                    source: 'indeed-custom',
                    jobType: 'Full-time', // Default, could be extracted with more parsing
                };
                jobs.push(job);
                count++;
            }
        }
        // If the regex approach doesn't work well, try a simpler text-based extraction
        if (jobs.length === 0) {
            console.log('Regex parsing failed, trying alternative extraction...');
            return extractJobsFromText(html, jobTitle, location);
        }
        return jobs;
    }
    catch (error) {
        console.error('Error parsing Indeed HTML:', error);
        return extractJobsFromText(html, jobTitle, location);
    }
}
// Fallback text-based extraction
function extractJobsFromText(html, jobTitle, location) {
    var jobs = [];
    try {
        // Look for common patterns in Indeed's HTML structure
        var titleRegex = /<span[^>]*title="([^"]*)"[^>]*>/g;
        var companyRegex = /data-testid="company-name"[^>]*>([^<]*)</g;
        var linkRegex = /href="(\/viewjob\?jk=[^"]*)"[^>]*>/g;
        var titles = [];
        var companies = [];
        var links = [];
        var titleMatch = void 0;
        while ((titleMatch = titleRegex.exec(html)) !== null) {
            if (titleMatch[1] && titleMatch[1].length > 5) { // Filter out short/irrelevant titles
                titles.push(titleMatch[1]);
            }
        }
        var companyMatch = void 0;
        while ((companyMatch = companyRegex.exec(html)) !== null) {
            if (companyMatch[1] && companyMatch[1].trim()) {
                companies.push(companyMatch[1].trim());
            }
        }
        var linkMatch = void 0;
        while ((linkMatch = linkRegex.exec(html)) !== null) {
            links.push("https://www.indeed.com".concat(linkMatch[1]));
        }
        // Combine the extracted data
        var maxItems = Math.min(titles.length, companies.length, 10);
        for (var i = 0; i < maxItems; i++) {
            if (titles[i] && companies[i]) {
                var job = {
                    id: (0, utils_1.generateId)(),
                    title: titles[i],
                    company: companies[i],
                    location: location,
                    url: links[i] || '#',
                    description: "".concat(titles[i], " position at ").concat(companies[i], ". View full details on Indeed."),
                    dateScraped: new Date().toISOString(),
                    source: 'indeed-custom',
                    jobType: 'Full-time',
                };
                jobs.push(job);
            }
        }
        console.log("Extracted ".concat(jobs.length, " jobs using text parsing"));
        return jobs;
    }
    catch (error) {
        console.error('Error in text extraction:', error);
        return [];
    }
}
// Advanced scraper using Playwright (browser automation)
function scrapeWithPlaywright(jobTitle_1) {
    return __awaiter(this, arguments, void 0, function (jobTitle, location, maxJobs, proxy) {
        var chromium, browser, context, page, randomDelay, allJobs, simplyHiredJobs, zipRecruiterJobs;
        if (location === void 0) { location = 'Remote'; }
        if (maxJobs === void 0) { maxJobs = 25; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    chromium = require('playwright').chromium;
                    console.log("Starting Playwright scraper for: ".concat(jobTitle, " in ").concat(location));
                    return [4 /*yield*/, chromium.launch({
                            headless: true,
                            args: __spreadArray([
                                '--no-sandbox',
                                '--disable-setuid-sandbox',
                                '--disable-dev-shm-usage',
                                '--disable-accelerated-2d-canvas',
                                '--no-first-run',
                                '--no-zygote',
                                '--disable-gpu',
                                '--disable-web-security',
                                '--disable-features=VizDisplayCompositor',
                                '--disable-blink-features=AutomationControlled',
                                '--disable-extensions',
                                '--disable-plugins',
                                '--disable-images',
                                '--disable-javascript-harmony-shipping',
                                '--disable-background-timer-throttling',
                                '--disable-backgrounding-occluded-windows',
                                '--disable-renderer-backgrounding'
                            ], (proxy ? ["--proxy-server=".concat(proxy)] : []), true)
                        })];
                case 1:
                    browser = _a.sent();
                    return [4 /*yield*/, browser.newContext({
                            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            viewport: { width: 1366, height: 768 },
                            locale: 'en-US',
                            extraHTTPHeaders: {
                                'Accept-Language': 'en-US,en;q=0.9',
                                'Accept-Encoding': 'gzip, deflate, br',
                                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                                'Connection': 'keep-alive',
                                'Upgrade-Insecure-Requests': '1',
                            }
                        })];
                case 2:
                    context = _a.sent();
                    return [4 /*yield*/, context.newPage()];
                case 3:
                    page = _a.sent();
                    randomDelay = function () { return new Promise(function (resolve) { return setTimeout(resolve, Math.random() * 2000 + 1000); }); };
                    allJobs = [];
                    // Focus on accessible sites only (Indeed and Glassdoor are blocked by Cloudflare)
                    console.log('🎯 Focusing on accessible job sites: SimplyHired');
                    return [4 /*yield*/, scrapeSimplyHiredWithPlaywright(page, jobTitle, location, maxJobs, randomDelay)];
                case 4:
                    simplyHiredJobs = _a.sent();
                    allJobs.push.apply(allJobs, simplyHiredJobs);
                    return [4 /*yield*/, scrapeZipRecruiterWithPlaywright(page, jobTitle, location, maxJobs, randomDelay)];
                case 5:
                    zipRecruiterJobs = _a.sent();
                    allJobs.push.apply(allJobs, zipRecruiterJobs);
                    return [4 /*yield*/, browser.close()];
                case 6:
                    _a.sent();
                    console.log("Playwright scraper found ".concat(allJobs.length, " total jobs"));
                    return [2 /*return*/, allJobs];
            }
        });
    });
}
// SimplyHired scraper with Playwright (confirmed accessible)
function scrapeSimplyHiredWithPlaywright(page, jobTitle, location, maxJobs, randomDelay) {
    return __awaiter(this, void 0, void 0, function () {
        var searchUrl, jobCardSelectors, jobCards, _i, jobCardSelectors_1, selector, jobs, jobListings, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 8, , 9]);
                    console.log('Scraping SimplyHired with Playwright...');
                    searchUrl = "https://www.simplyhired.com/search?q=".concat(encodeURIComponent(jobTitle), "&l=").concat(encodeURIComponent(location));
                    return [4 /*yield*/, page.goto(searchUrl, {
                            waitUntil: 'networkidle',
                            timeout: 30000
                        })];
                case 1:
                    _a.sent();
                    // Add random delay to avoid detection
                    return [4 /*yield*/, randomDelay()];
                case 2:
                    // Add random delay to avoid detection
                    _a.sent();
                    jobCardSelectors = [
                        '[data-testid="searchSerpJob"]',
                        '.SerpJob-container',
                        '.job-listing',
                        'article[data-job-id]',
                        '.jobposting'
                    ];
                    jobCards = [];
                    _i = 0, jobCardSelectors_1 = jobCardSelectors;
                    _a.label = 3;
                case 3:
                    if (!(_i < jobCardSelectors_1.length)) return [3 /*break*/, 6];
                    selector = jobCardSelectors_1[_i];
                    return [4 /*yield*/, page.$$(selector)];
                case 4:
                    jobCards = _a.sent();
                    if (jobCards.length > 0) {
                        console.log("Found ".concat(jobCards.length, " job cards with selector: ").concat(selector));
                        return [3 /*break*/, 6];
                    }
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6:
                    if (jobCards.length === 0) {
                        console.log('No job cards found on SimplyHired');
                        return [2 /*return*/, []];
                    }
                    return [4 /*yield*/, page.evaluate(function (_a) {
                            var jobTitle = _a.jobTitle, location = _a.location;
                            var extractedJobs = [];
                            var cardSelectors = [
                                '[data-testid="searchSerpJob"]',
                                '.SerpJob-container',
                                '.job-listing',
                                'article[data-job-id]',
                                '.jobposting'
                            ];
                            var jobCards = null;
                            for (var _i = 0, cardSelectors_1 = cardSelectors; _i < cardSelectors_1.length; _i++) {
                                var selector = cardSelectors_1[_i];
                                jobCards = document.querySelectorAll(selector);
                                if (jobCards.length > 0)
                                    break;
                            }
                            if (!jobCards)
                                return extractedJobs;
                            jobCards.forEach(function (card, index) {
                                var _a, _b, _c, _d;
                                if (index >= 25)
                                    return;
                                try {
                                    var titleSelectors = [
                                        'h3 a', '[data-testid="jobTitle"] a', '.jobTitle a', 'h2 a', '.job-title a', 'a[data-testid="job-title"]'
                                    ];
                                    var companySelectors = [
                                        '[data-testid="companyName"]', '.company-name', '.companyName', '.hiring-company', '.company'
                                    ];
                                    var locationSelectors = [
                                        '[data-testid="searchSerpJobLocation"]', '.job-location', '.location', '.jobLocation', '[data-testid="location"]'
                                    ];
                                    var salarySelectors = [
                                        '[data-testid="searchSerpJobSalaryEst"]', '.salary', '.pay', '.compensation', '.wage'
                                    ];
                                    var title = void 0, company = void 0, jobLocation = void 0, link = void 0, salary = void 0;
                                    for (var _i = 0, titleSelectors_1 = titleSelectors; _i < titleSelectors_1.length; _i++) {
                                        var selector = titleSelectors_1[_i];
                                        var element = card.querySelector(selector);
                                        if (element) {
                                            title = (_a = element.textContent) === null || _a === void 0 ? void 0 : _a.trim();
                                            if (!link)
                                                link = element.getAttribute('href');
                                            if (title && title.length > 3)
                                                break;
                                        }
                                    }
                                    for (var _e = 0, companySelectors_1 = companySelectors; _e < companySelectors_1.length; _e++) {
                                        var selector = companySelectors_1[_e];
                                        var element = card.querySelector(selector);
                                        if (element) {
                                            company = (_b = element.textContent) === null || _b === void 0 ? void 0 : _b.trim();
                                            if (company && company.length > 1)
                                                break;
                                        }
                                    }
                                    for (var _f = 0, locationSelectors_1 = locationSelectors; _f < locationSelectors_1.length; _f++) {
                                        var selector = locationSelectors_1[_f];
                                        var element = card.querySelector(selector);
                                        if (element) {
                                            jobLocation = (_c = element.textContent) === null || _c === void 0 ? void 0 : _c.trim();
                                            if (jobLocation && jobLocation.length > 1)
                                                break;
                                        }
                                    }
                                    for (var _g = 0, salarySelectors_1 = salarySelectors; _g < salarySelectors_1.length; _g++) {
                                        var selector = salarySelectors_1[_g];
                                        var element = card.querySelector(selector);
                                        if (element) {
                                            salary = (_d = element.textContent) === null || _d === void 0 ? void 0 : _d.trim();
                                            if (salary && salary.includes('$'))
                                                break;
                                        }
                                    }
                                    if (title && company && !title.includes('placeholder') && !company.includes('placeholder') && title.length > 3 && company.length > 1) {
                                        extractedJobs.push({
                                            title: title,
                                            company: company,
                                            location: jobLocation || location,
                                            url: link ? (link.startsWith('http') ? link : "https://www.simplyhired.com".concat(link)) : '#',
                                            salary: salary || undefined,
                                            source: 'simplyhired-playwright'
                                        });
                                    }
                                }
                                catch (e) {
                                    // Ignore extraction errors for individual cards
                                }
                            });
                            return extractedJobs;
                        }, { jobTitle: jobTitle, location: location })];
                case 7:
                    jobs = _a.sent();
                    jobListings = jobs.map(function (job) { return ({
                        id: (0, utils_1.generateId)(),
                        title: job.title,
                        company: job.company,
                        location: job.location,
                        url: job.url,
                        description: "".concat(job.title, " position at ").concat(job.company, ". Apply directly through SimplyHired for best results."),
                        dateScraped: new Date().toISOString(),
                        source: job.source,
                        salaryRange: job.salary,
                        jobType: 'Full-time'
                    }); });
                    console.log("Found ".concat(jobListings.length, " quality jobs from SimplyHired (Playwright)"));
                    return [2 /*return*/, jobListings];
                case 8:
                    error_2 = _a.sent();
                    console.error('Error scraping SimplyHired with Playwright:', error_2);
                    return [2 /*return*/, []];
                case 9: return [2 /*return*/];
            }
        });
    });
}
// ZipRecruiter scraper with Playwright (confirmed accessible)
function scrapeZipRecruiterWithPlaywright(page, jobTitle, location, maxJobs, randomDelay) {
    return __awaiter(this, void 0, void 0, function () {
        var searchUrl, pageContent, jobCardSelectors, jobCards, _i, jobCardSelectors_2, selector, jobs, jobListings, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 13, , 14]);
                    console.log('Scraping ZipRecruiter with Playwright...');
                    searchUrl = "https://www.ziprecruiter.com/jobs-search?search=".concat(encodeURIComponent(jobTitle), "&location=").concat(encodeURIComponent(location));
                    // Add a longer random delay before navigation
                    return [4 /*yield*/, randomDelay()];
                case 1:
                    // Add a longer random delay before navigation
                    _a.sent();
                    return [4 /*yield*/, randomDelay()];
                case 2:
                    _a.sent();
                    // Set up extra stealth headers
                    return [4 /*yield*/, page.setExtraHTTPHeaders({
                            'Accept-Language': 'en-US,en;q=0.9',
                            'Accept-Encoding': 'gzip, deflate, br',
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                            'Connection': 'keep-alive',
                            'Upgrade-Insecure-Requests': '1',
                            'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", ";Not A Brand";v="99"',
                            'sec-ch-ua-mobile': '?0',
                            'sec-ch-ua-platform': '"macOS"',
                            'sec-fetch-dest': 'document',
                            'sec-fetch-mode': 'navigate',
                            'sec-fetch-site': 'none',
                            'sec-fetch-user': '?1',
                        })];
                case 3:
                    // Set up extra stealth headers
                    _a.sent();
                    // User agent and viewport are set in the context, not on the page (Playwright best practice)
                    // await page.setUserAgent(...); // <-- Do not use
                    // await page.setViewportSize(...); // <-- Do not use
                    // Try to set navigator.webdriver to false
                    return [4 /*yield*/, page.addInitScript(function () {
                            Object.defineProperty(navigator, 'webdriver', { get: function () { return false; } });
                        })];
                case 4:
                    // User agent and viewport are set in the context, not on the page (Playwright best practice)
                    // await page.setUserAgent(...); // <-- Do not use
                    // await page.setViewportSize(...); // <-- Do not use
                    // Try to set navigator.webdriver to false
                    _a.sent();
                    return [4 /*yield*/, page.goto(searchUrl, {
                            waitUntil: 'domcontentloaded',
                            timeout: 60000
                        })];
                case 5:
                    _a.sent();
                    // Add a short delay after navigation
                    return [4 /*yield*/, randomDelay()];
                case 6:
                    // Add a short delay after navigation
                    _a.sent();
                    return [4 /*yield*/, page.content()];
                case 7:
                    pageContent = _a.sent();
                    console.log('ZipRecruiter page HTML preview:', pageContent.slice(0, 500));
                    jobCardSelectors = [
                        '[data-testid="job-card"]',
                        '.job_content',
                        '.jobList-item',
                        '.job-card-container',
                        'article[data-job-id]'
                    ];
                    jobCards = [];
                    _i = 0, jobCardSelectors_2 = jobCardSelectors;
                    _a.label = 8;
                case 8:
                    if (!(_i < jobCardSelectors_2.length)) return [3 /*break*/, 11];
                    selector = jobCardSelectors_2[_i];
                    return [4 /*yield*/, page.$$(selector)];
                case 9:
                    jobCards = _a.sent();
                    if (jobCards.length > 0) {
                        console.log("Found ".concat(jobCards.length, " job cards with selector: ").concat(selector));
                        return [3 /*break*/, 11];
                    }
                    _a.label = 10;
                case 10:
                    _i++;
                    return [3 /*break*/, 8];
                case 11:
                    if (jobCards.length === 0) {
                        console.log('No job cards found on ZipRecruiter');
                        return [2 /*return*/, []];
                    }
                    return [4 /*yield*/, page.evaluate(function (_a) {
                            var jobTitle = _a.jobTitle, location = _a.location;
                            var extractedJobs = [];
                            var cardSelectors = [
                                '[data-testid="job-card"]',
                                '.job_content',
                                '.jobList-item',
                                '.job-card-container',
                                'article[data-job-id]'
                            ];
                            var jobCards = null;
                            for (var _i = 0, cardSelectors_2 = cardSelectors; _i < cardSelectors_2.length; _i++) {
                                var selector = cardSelectors_2[_i];
                                jobCards = document.querySelectorAll(selector);
                                if (jobCards.length > 0)
                                    break;
                            }
                            if (!jobCards)
                                return extractedJobs;
                            jobCards.forEach(function (card, index) {
                                var _a, _b, _c, _d;
                                if (index >= 25)
                                    return;
                                try {
                                    var titleSelectors = ['h2 a', '.job-title a', '[data-testid="job-title"]', '.jobTitle a'];
                                    var companySelectors = ['.company-name', '.hiring-company', '[data-testid="company-name"]', '.companyName'];
                                    var locationSelectors = ['.job-location', '.location', '[data-testid="job-location"]', '.jobLocation'];
                                    var salarySelectors = ['.salary', '.compensation', '[data-testid="salary"]', '.pay'];
                                    var title = void 0, company = void 0, jobLocation = void 0, link = void 0, salary = void 0;
                                    for (var _i = 0, titleSelectors_2 = titleSelectors; _i < titleSelectors_2.length; _i++) {
                                        var selector = titleSelectors_2[_i];
                                        var element = card.querySelector(selector);
                                        if (element) {
                                            title = (_a = element.textContent) === null || _a === void 0 ? void 0 : _a.trim();
                                            link = element.getAttribute('href');
                                            if (title)
                                                break;
                                        }
                                    }
                                    for (var _e = 0, companySelectors_2 = companySelectors; _e < companySelectors_2.length; _e++) {
                                        var selector = companySelectors_2[_e];
                                        var element = card.querySelector(selector);
                                        if (element) {
                                            company = (_b = element.textContent) === null || _b === void 0 ? void 0 : _b.trim();
                                            if (company)
                                                break;
                                        }
                                    }
                                    for (var _f = 0, locationSelectors_2 = locationSelectors; _f < locationSelectors_2.length; _f++) {
                                        var selector = locationSelectors_2[_f];
                                        var element = card.querySelector(selector);
                                        if (element) {
                                            jobLocation = (_c = element.textContent) === null || _c === void 0 ? void 0 : _c.trim();
                                            if (jobLocation)
                                                break;
                                        }
                                    }
                                    for (var _g = 0, salarySelectors_2 = salarySelectors; _g < salarySelectors_2.length; _g++) {
                                        var selector = salarySelectors_2[_g];
                                        var element = card.querySelector(selector);
                                        if (element) {
                                            salary = (_d = element.textContent) === null || _d === void 0 ? void 0 : _d.trim();
                                            if (salary)
                                                break;
                                        }
                                    }
                                    if (title && company) {
                                        extractedJobs.push({
                                            title: title,
                                            company: company,
                                            location: jobLocation || location,
                                            url: link ? (link.startsWith('http') ? link : "https://www.ziprecruiter.com".concat(link)) : '#',
                                            salary: salary || undefined,
                                            source: 'ziprecruiter-playwright'
                                        });
                                    }
                                }
                                catch (e) {
                                    // Ignore extraction errors for individual cards
                                }
                            });
                            return extractedJobs;
                        }, { jobTitle: jobTitle, location: location })];
                case 12:
                    jobs = _a.sent();
                    jobListings = jobs.map(function (job) { return ({
                        id: (0, utils_1.generateId)(),
                        title: job.title,
                        company: job.company,
                        location: job.location,
                        url: job.url,
                        description: "".concat(job.title, " position at ").concat(job.company, ". View full details on ZipRecruiter."),
                        dateScraped: new Date().toISOString(),
                        source: job.source,
                        salaryRange: job.salary,
                        jobType: 'Full-time'
                    }); });
                    console.log("Found ".concat(jobListings.length, " jobs from ZipRecruiter (Playwright)"));
                    return [2 /*return*/, jobListings];
                case 13:
                    error_3 = _a.sent();
                    console.error('Error scraping ZipRecruiter with Playwright:', error_3);
                    return [2 /*return*/, []];
                case 14: return [2 /*return*/];
            }
        });
    });
}
// Scrape multiple job sites
function scrapeMultipleSites(jobTitle_1) {
    return __awaiter(this, arguments, void 0, function (jobTitle, location, sites) {
        var allJobs, _i, sites_1, site, _a, indeedJobs, error_4, uniqueJobs;
        if (location === void 0) { location = 'Remote'; }
        if (sites === void 0) { sites = ['indeed']; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    allJobs = [];
                    _i = 0, sites_1 = sites;
                    _b.label = 1;
                case 1:
                    if (!(_i < sites_1.length)) return [3 /*break*/, 9];
                    site = sites_1[_i];
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 7, , 8]);
                    _a = site.toLowerCase();
                    switch (_a) {
                        case 'indeed': return [3 /*break*/, 3];
                    }
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, scrapeIndeedJobs(jobTitle, location)];
                case 4:
                    indeedJobs = _b.sent();
                    allJobs.push.apply(allJobs, indeedJobs);
                    return [3 /*break*/, 6];
                case 5:
                    console.log("Scraper for ".concat(site, " not implemented yet"));
                    _b.label = 6;
                case 6: return [3 /*break*/, 8];
                case 7:
                    error_4 = _b.sent();
                    console.error("Error scraping ".concat(site, ":"), error_4);
                    return [3 /*break*/, 8];
                case 8:
                    _i++;
                    return [3 /*break*/, 1];
                case 9:
                    uniqueJobs = allJobs.reduce(function (acc, current) {
                        var duplicate = acc.find(function (job) {
                            return job.title.toLowerCase() === current.title.toLowerCase() &&
                                job.company.toLowerCase() === current.company.toLowerCase();
                        });
                        if (!duplicate) {
                            acc.push(current);
                        }
                        return acc;
                    }, []);
                    return [2 /*return*/, uniqueJobs];
            }
        });
    });
}
