# Scraper Refactor PRD – AutoApply AI

## 1 Document Info

* **Author:** Product / Data Eng Team
* **Version:** 1.0
* **Created:** 2025‑06‑22
* **Status:** Draft – ready for engineering kick‑off

---

## 2 Purpose

Our current job‑ingestion layer relies almost exclusively on the Adzuna API, yielding <10 results per query and truncated descriptions (\~500 chars). This PRD defines the requirements to *replace or supplement* that path with a multi‑source, scalable, and legally compliant scraper‑platform.

> **Why a PRD for “one issue”?** The scraper is mission‑critical; refactoring touches multiple systems (proxy billing, DB schema, ML, legal). A lightweight PRD clarifies scope, success metrics, and owner responsibility—even for a targeted fix.

---

## 3 Problem Statement

| Pain‑point                           | Impact                                                |
| ------------------------------------ | ----------------------------------------------------- |
| Truncated job descriptions           | Incomplete data → poor résumé/cover‑letter generation |
| Low job volume                       | Sparse UI → low user engagement                       |
| Single API dependency                | Downtime or quota limits = zero inventory             |
| No unified pagination or aggregation | Duplicate listings, missed jobs                       |
| Field inconsistencies                | ML scoring & matching errors                          |
| Proxy / rate‑limit fragility         | Scraper crashes, rising costs                         |
| Missing niche boards                 | Users in specialized fields can’t find matches        |

---

## 4 Goals & Success Metrics

| Goal                         | Metric                      | Target                  |
| ---------------------------- | --------------------------- | ----------------------- |
| Increase listings per search | Avg. results/query          | **≥ 150** (10× current) |
| Full descriptions captured   | % listings ≥ 1 500 chars    | **95 %+**               |
| Source diversification       | Boards actively scraped     | **10+**                 |
| Scrape cost efficiency       | Proxy \$ / 1 k listings     | **≤ \$0.07**            |
| Data quality                 | Duplicate rate after dedupe | **< 1 %**               |

---

## 5 Proposed Solution (High‑level)

### 5.1 Job‑board & Feed Prioritization

| Tier                 | Boards                                                                                   | Rationale           | Feasibility                                                  |
| -------------------- | ---------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------ |
| **Core**             | Indeed, LinkedIn, Glassdoor, ZipRecruiter                                                | Largest volume      | Aggressive anti‑bot → use residential proxies or partner API |
| **Supplemental**     | Dice, AngelList, StackOverflow, RemoteOK, We Work Remotely, EU‑Startups, Wellfound, Otta | Tech/start‑up focus | Mostly static or Cloudflare; Playwright + rotating proxies   |
| **Niche / Regional** | US state portals, NHS (UK), EURES (EU), CryptoJobs, Dribbble, Behance                    | Unique inventory    | RSS / HTML feeds; minimal anti‑bot                           |

> **Guideline:** Prefer partner APIs for Indeed/LinkedIn/ZipRecruiter; scrape only missing fields (e.g., full description).

### 5.2 Technology Stack

| Layer              | Component(s)                                        | Reason                                                     |
| ------------------ | --------------------------------------------------- | ---------------------------------------------------------- |
| Browser automation | **Playwright (Node)** + `@playwright/test`          | Faster than Puppeteer; built‑in stealth; solves truncation |
| Static fetcher     | Axios + Cheerio                                     | Lightweight for list pages & RSS                           |
| Anti-detection     | `playwright‑stealth`, dynamic fingerprints          | Reduce CAPTCHAs                                            |
| Proxy pool         | Datacenter + residential + mobile tiers             | Cost vs stealth tuning                                     |
| Queue              | **BullMQ (Node)** or RabbitMQ + Celery              | Parallelism & retries                                      |
| Storage            | PostgreSQL + JSONB, Redis cache, MinIO/S3 snapshots | Flexible schema & dedupe                                   |
| Monitoring         | Prometheus + Grafana                                | Alert on error spikes                                      |

### 5.3 Data Processing & Quality

* **Full‑text capture:** `page.content()` after `networkidle`. Block images/fonts to cut load 40 %.
* **NLP standardisation:** SpaCy + JobBERT for skills, salary normalisation.
* **Fuzzy dedupe:** (title + company + geoBucket) → Jaro‑Winkler & Levenshtein thresholds.
* **Schema enforcement:** JSONSchema + QA flags; invalid rows rejected.

### 5.4 Scalability & Performance

* Dockerise each Playwright worker (`--shm‑size=2g`).
* Start concurrency = CPU×4 (Playwright) / CPU×20 (Axios).
* Store ETag / `Last‑Modified` in Redis; 304 = skip body.

### 5.5 Resilience

| Signal        | Auto‑reaction                                     |
| ------------- | ------------------------------------------------- |
| HTTP 429/403  | Circuit breaker + back‑off 15 min                 |
| CAPTCHA       | Redirect via Bright Data “unlocker” API           |
| Selector miss | Raise alert; ML visual anchor fallback            |
| Worker crash  | Queue retry ×3 exponential; dead‑letter posts URL |

### 5.6 Legal & Compliance

* Respect `robots.txt`; partner‑API first.
* Strip PII (emails, phones) before DB insert.
* Purge raw HTML after 30 days (GDPR).
* Log ToS hash per domain; quarterly review.

---

## 6 Scope & Non‑Goals

### In‑Scope

1. Replace Puppeteer with Playwright in existing container.
2. Implement list/detail queue split and Redis URL‑hash cache.
3. Add at least **4** new high‑volume sources (Indeed, ZipRecruiter, Glassdoor, LinkedIn via partner or scrape).
4. Build proxy‑tier logic (datacenter vs residential).
5. Provide Prometheus metrics & basic Grafana dashboard.

### Out‑of‑Scope (phase‑2/3)

* ML skill‑matching API.
* Full K8s autoscaling; current Docker‑Compose acceptable.
* Partner‑API contract negotiations (tracked separately).

---

## 7 Milestones & Timeline

> **Fast patch path (today)** already being executed; below is the structured follow‑up.

| # | Deliverable                        | Owner  | ETA         |
| - | ---------------------------------- | ------ | ----------- |
| 1 | Playwright refactor & Docker image | Eng    | **+1 day**  |
| 2 | Redis cache + conditional GET      | Eng    | **+1 day**  |
| 3 | List vs Detail queues (BullMQ)     | Eng    | **+2 days** |
| 4 | Add Indeed + RemoteOK full scrape  | Eng    | **+3 days** |
| 5 | Proxy tiering + cost metric        | DevOps | **+5 days** |
| 6 | Grafana dashboard & alerts         | DevOps | **+6 days** |

> Stretch: LinkedIn/ZipRecruiter partner API integration (**Week 2‑3**, external dependency).

---

## 8 Budget Impact (Post‑refactor)

| Cost center               | Old         | New (est.)           |
| ------------------------- | ----------- | -------------------- |
| Proxy credits             | \$450       | \$300                |
| Compute (Playwright pods) | \$300       | \$130 (pre‑emptible) |
| Other infra               | \$330       | \$330                |
| **Total**                 | **\$1 180** | **≈ \$760 / month**  |

---

## 9 Success Criteria (Go/No‑Go)

* ≥ 150 listings/query across target job titles.
* ≥ 95 % listings contain ≥ 1 500 chars description.
* Proxy spend ≤ \$0.07 per 1 k listings for 7‑day rolling window.
* Scraper uptime ≥ 99 % (excluding partner API downtime).

---

## 10 Risks & Mitigations

| Risk                      | Likelihood | Impact | Mitigation                                      |
| ------------------------- | ---------- | ------ | ----------------------------------------------- |
| Boards upgrade anti‑bot   | Med        | High   | Maintain Bright Data unlocker; monitor 403 rate |
| Partner API pricing rises | Low        | Med    | Keep scraper fall‑back path alive               |
| Proxy costs spike         | Med        | Med    | PID‑based concurrency throttle, credit alerts   |

---

## 11 Stakeholders

* **Product:** Ricardo Zuloaga (PM)
* **Engineering Lead:** <name>
* **Data Science/NLP:** <name>
* **Legal:** <name>

---

## 12 Open Questions

1. Which partner API quotas are confirmed?
2. Do we host Redis in‑house or managed?
3. Need final decision on Node vs Python queue stack (BullMQ vs Celery).

---

*End of document*
