/**
 * SEO Strategy Recommendation Engine
 *
 * Provides dynamic recommendations for 7 core SEO strategy areas with
 * intelligent template substitution and ChatGPT fallback integration.
 */

// Recommendation Templates - 10 options per section
export const RECOMMENDATION_TEMPLATES = {
  "1_site_strength_vs_keyword_barrier": [
    "Drop all keyword targets with KD > {kd_threshold_high} for the next sprint.",
    "Research and add {n_new_kw} new keywords with KD between {kd_lower}–{kd_upper}.",
    "Secure {n_backlinks} DA {backlink_da}+ backlinks to lift Site Strength.",
    "Re-score strategy when Efficiency Ratio ≤ {eff_ratio_target}.",
    "Flag any new brief whose KD exceeds Site Strength + {kd_over_weight}.",
    "Shift budget from KD >{shift_kd_from} to KD <{shift_kd_to} clusters.",
    "Add a bi-weekly check that aborts briefs if Efficiency Ratio rises above 1.0.",
    "Create an internal wiki note explaining Weight-Class Principle to content writers.",
    "Run a quarterly 'weight class vs KD' audit and archive out-of-class topics.",
    "Publish a short 'why we skip hard keywords' explainer for stakeholders.",
  ],

  "2_equity_leaks": [
    'Merge overlapping posts on "{topic}" (estimated cannibal URLs {cannibal_urls}).',
    "Cluster cannibal pairs into a single pillar + redirects when cannibal URLs ≥ {cannibal_threshold}.",
    "Add contextual links from dilution-heavy pages (>{dilution_pct}% outbound) back to core hubs.",
    "Adjust internal-link ratio to <{max_outbound_pct}% outbound on BOFU pages.",
    "Set up a weekly alert if cannibalization rises above {cannibal_alert_pct}%.",
    "Auto-tag 'orphan' pages (zero in-links) for manual review each sprint.",
    "De-index thin duplicate pages (<{thin_wordcount} words) to conserve equity.",
    "Re-map navigation links to reduce link depth > {max_depth} clicks.",
    "Limit new blog tags to ≤ {max_tags} to prevent dilution.",
    "Run quarterly crawl to surface link dilution spikes > {dilution_spike}%.",
  ],

  "3_funnel_mix_health": [
    "Schedule {n_tofu_posts} new TOFU posts (KD <{kd_tofu_max}) to rebalance to {tofu_target}% mix.",
    "Pause new BOFU content until BOFU share falls below {bofu_target}%.",
    "Run a quick audit: hide MOFU posts with traffic <{mofu_min_traffic} sessions to declutter mix.",
    "Launch a TOFU content calendar seeded from top-{top_kw_count} low-KD questions.",
    "Spin up a bi-weekly report tracking TOFU / MOFU / BOFU drift from targets.",
    "Create a template brief for TOFU primers that auto-loads FAQs + glossary blocks.",
    "Add TOFU promo slot in newsletter 1×/month until mix meets targets.",
    "Gate BOFU production tickets behind a mix check (require BOFU ≤ {bofu_gate_pct}%).",
    "Hold a content retro when BOFU exceeds target by {bofu_over_pct}%.",
    "Produce a Loom explainer on 'Funnel Mix Health rules' for freelancers.",
  ],

  "4_hook_understand_trust_act_chain": [
    "Refresh top {headline_count} hero headlines with story-first phrasing.",
    "Inject icon + benefit bullets above the fold on pages missing clarity cues.",
    "Embed ≥ {reviews_needed} third-party reviews on pricing/offer pages.",
    "Replace generic CTAs with single vivid verbs on high-traffic BOFU URLs.",
    "Run an emotional-tone pass: flag pages scoring Hook < {hook_min}%.",
    "Set up a quarterly copy audit for Trust assets (badges, testimonials, studies).",
    "Add scroll-trigger micro-CTAs to boost Behavioural Momentum on long posts.",
    "A/B test two headline variants per month to nudge Hook score by +{hook_gain_target} pts.",
    "Create a swipe file of high-Trust sections for future copy sprints.",
    "Launch a mini-survey widget to harvest new social-proof snippets.",
  ],

  "5_matchup_analysis": [
    "Prioritise {n_priority_kw} keywords with KD <{kd_priority_max}.",
    "Pause ad spend on KD >{kd_ad_pause} terms until Efficiency Ratio ≤ 1.0.",
    "Re-cluster mid-KD terms into support articles under a pillar hub.",
    "Auto-flag briefs where KD / DA ratio exceeds {ratio_flag}.",
    "Run monthly Efficiency-Ratio roll-up and block briefs in amber/red zone.",
    "Shift content ops budget {budget_shift_pct}% toward low-KD clusters.",
    "Invite SEO to re-weight keyword list when Ratio stays > 1.0 for 2 sprints.",
    "Log hard keyword ideas into 'future' backlog for DA >{future_da}.",
    "Benchmark competitors' DA/KD fit once per quarter.",
    "Notify product marketing when Ratio drops below {green_ratio} (green).",
  ],

  "6_playbook_compliance": [
    "Insert one RACE 'Engage' email into MOFU drip to close framework gap.",
    "Add authority proof block (logos / stats) on BOFU pages lacking Cialdini 'Authority'.",
    "Launch loyalty-perk email to lift Retention (AARRR gap).",
    "Schedule Retention content sprint when coverage <{retention_target}%.",
    "Add advocacy callout (UGC prompt) on post-purchase thank-you page.",
    "Embed social share widget on blog templates to raise Advocacy.",
    "QA each new brief for at least one persuasion framework tag.",
    "Automate a dashboard alert when any stage coverage <{stage_alert}%.",
    "Publish internal cheat-sheet on mapping content to AIDA / RACE / AARRR.",
    "Review Retention journey quarterly with CS team to plug persuasion gaps.",
  ],

  "7_journey_coverage": [
    "Repurpose {repurpose_count} Consideration posts into Awareness guides.",
    "Deploy ROI calculator widget on Decision pages with > {decision_traffic} sessions.",
    "Replace low-performing Advocacy post with customer video testimonial.",
    "Spin up {new_awareness} net-new Awareness posts for journey balance.",
    "Gate MOFU whitepaper behind email to move users into Retention list.",
    "Add exit-intent quiz on Awareness pages to discover friction points.",
    "Push live chat nudge on Decision pages during office hours.",
    "Surface cross-sell CTA on Retention pages with scroll-depth > 75%.",
    "Tag journey stage in CMS and auto-report distribution weekly.",
    "Archive outdated Awareness articles older than {archive_age_months} months.",
  ],
};

// Configuration constants for template substitution
export const RECOMMENDATION_CONFIG = {
  // Site Strength thresholds
  kd_threshold_high: 65,
  kd_lower: 20,
  kd_upper: 40,
  n_new_kw: 10,
  n_backlinks: 5,
  backlink_da: 50,
  eff_ratio_target: 0.75,
  kd_over_weight: 15,
  shift_kd_from: 60,
  shift_kd_to: 40,

  // Equity Leaks thresholds
  cannibal_threshold: 5,
  max_outbound_pct: 60,
  cannibal_alert_pct: 15,
  thin_wordcount: 300,
  max_depth: 3,
  max_tags: 10,
  dilution_spike: 25,

  // Funnel Mix thresholds
  kd_tofu_max: 30,
  tofu_target: 55,
  bofu_target: 15,
  mofu_min_traffic: 50,
  top_kw_count: 20,
  bofu_gate_pct: 20,
  bofu_over_pct: 10,

  // HUTA Chain thresholds
  headline_count: 5,
  reviews_needed: 3,
  hook_min: 50,
  hook_gain_target: 8,

  // Matchup Analysis thresholds
  ratio_flag: 1.5,
  budget_shift_pct: 30,
  future_da: 70,
  green_ratio: 0.8,

  // Playbook Compliance thresholds
  retention_target: 50,
  stage_alert: 30,

  // Journey Coverage thresholds
  decision_traffic: 100,
  archive_age_months: 18,
};

/**
 * Fill template placeholders with actual values
 */
export function fillTemplate(template, data) {
  return template.replace(/\{([^}]+)\}/g, (match, key) => {
    return data[key] !== undefined ? String(data[key]) : match;
  });
}

/**
 * Eligibility rules for each section
 */
export function isEligible(panelKey, template, audit) {
  const rules = {
    "2_equity_leaks": () =>
      audit.cannibal_urls > 0 ||
      audit.dilution_pct > 0 ||
      template.includes("weekly alert") ||
      template.includes("quarterly crawl"),

    "3_funnel_mix_health": () =>
      audit.tofu_pct < 55 ||
      audit.bofu_pct > 15 ||
      audit.mofu_pct < 25 ||
      template.includes("bi-weekly report") ||
      template.includes("template brief"),

    "4_hook_understand_trust_act_chain": () =>
      audit.hook_score < 60 ||
      audit.understand_score < 60 ||
      audit.trust_score < 60 ||
      audit.act_score < 60 ||
      template.includes("quarterly copy") ||
      template.includes("swipe file"),

    "6_playbook_compliance": () =>
      audit.retention_coverage < 50 ||
      audit.advocacy_coverage < 30 ||
      template.includes("cheat-sheet") ||
      template.includes("quarterly"),

    "7_journey_coverage": () =>
      audit.awareness_pct < 20 ||
      audit.decision_pct < 12 ||
      audit.advocacy_pct < 2 ||
      template.includes("exit-intent") ||
      template.includes("archive"),
  };

  const rule = rules[panelKey];
  return rule ? rule() : true; // Default to eligible if no specific rule
}

/**
 * Generate recommendations for a specific panel
 */
export function generateRecommendations(
  panelKey,
  auditData,
  maxRecommendations = 3
) {
  const templates = RECOMMENDATION_TEMPLATES[panelKey] || [];
  if (templates.length === 0) return [];

  // Combine audit data with config constants
  const data = { ...RECOMMENDATION_CONFIG, ...auditData };

  // Fill templates and filter eligible ones
  const eligibleRecommendations = templates
    .map((template) => fillTemplate(template, data))
    .filter((recommendation) =>
      isEligible(panelKey, recommendation, auditData)
    );

  // If no eligible recommendations, return random fallback
  if (eligibleRecommendations.length === 0) {
    return getRandomFallbackRecommendations(panelKey, maxRecommendations).map(
      (template) => fillTemplate(template, data)
    );
  }

  // Shuffle and return up to maxRecommendations
  const shuffled = eligibleRecommendations.sort(() => 0.5 - Math.random());
  return shuffled.slice(
    0,
    Math.max(1, Math.min(maxRecommendations, shuffled.length))
  );
}

/**
 * Generate random fallback recommendations when no eligible templates match
 */
export function getRandomFallbackRecommendations(
  panelKey,
  maxRecommendations = 3
) {
  const templates = RECOMMENDATION_TEMPLATES[panelKey] || [];
  if (templates.length === 0) {
    return ["Review current strategy and identify improvement opportunities"];
  }

  // Shuffle templates and pick random ones
  const shuffled = [...templates].sort(() => 0.5 - Math.random());
  return shuffled.slice(
    0,
    Math.max(1, Math.min(maxRecommendations, shuffled.length))
  );
}

/**
 * Main function to get recommendations for all panels
 */
export function getAllRecommendations(auditData) {
  const panelKeys = Object.keys(RECOMMENDATION_TEMPLATES);
  const recommendations = {};

  for (const panelKey of panelKeys) {
    recommendations[panelKey] = generateRecommendations(panelKey, auditData);
  }

  return recommendations;
}

const recommendationEngine = {
  generateRecommendations,
  getRandomFallbackRecommendations,
  getAllRecommendations,
  RECOMMENDATION_TEMPLATES,
  RECOMMENDATION_CONFIG,
};

export default recommendationEngine;
