/**
 * Strategy Engine Dashboard - Strategy Lab™ Unified Performance Command Center
 *
 * Implements the "weight-class" principle where site strength (DA) determines
 * appropriate keyword difficulty targeting:
 * - Heavyweight (DA 60+): Can target high difficulty keywords (60+)
 * - Middleweight (DA 30-59): Target medium difficulty keywords (30-59)
 * - Lightweight (DA <30): Focus on low difficulty keywords (<30)
 *
 * Seven Core Analysis Sections:
 * 1. Site Strength vs Keyword Barrier
 * 2. Equity Leaks
 * 3. Funnel Mix Health
 * 4. Hook→Understand→Trust→Act Chain
 * 5. Match-up Analysis
 * 6. Playbook Compliance
 * 7. Journey Coverage
 */
import React, { useMemo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../context/OnboardingContext";
import { generateRecommendations } from "../utils/recommendationEngine";
import {
  Target,
  AlertTriangle,
  TrendingUp,
  Shield,
  Users,
  BookOpen,
  Navigation,
  BarChart3,
  Activity,
  Zap,
  Eye,
  RefreshCw,
  ArrowRight,
  CheckCircle,
  XCircle,
} from "lucide-react";
import "./StrategyAnalysis.css";

const StrategyAnalysis = () => {
  const { onboardingData, loading } = useOnboarding();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState({});

  // Mouse tracking for interactive background effect

  // Generate recommendations based on calculated metrics
  useEffect(() => {
    if (!onboardingData || loading) return;

    const searchConsoleData = Array.isArray(onboardingData.searchConsoleData)
      ? onboardingData.searchConsoleData
      : [];
    const keywords = Array.isArray(onboardingData.keywords)
      ? onboardingData.keywords
      : [];

    if (searchConsoleData.length === 0) return;

    // Calculate basic metrics for recommendation generation
    const domainAuthority =
      parseInt(onboardingData.initialAnalysisState?.domainAuthority) ||
      parseInt(onboardingData.domain_authority) ||
      50; // Default fallback

    const avgKeywordDifficulty =
      keywords.length > 0
        ? keywords.reduce((sum, kw) => sum + parseInt(kw.difficulty || 0), 0) /
          keywords.length
        : 0;

    const efficiencyRatio =
      domainAuthority > 0 ? avgKeywordDifficulty / domainAuthority : 0;

    // Prepare audit data for recommendations
    const auditData = {
      domain_authority: domainAuthority,
      avg_kd: Math.round(avgKeywordDifficulty),
      efficiency_ratio: Math.round(efficiencyRatio * 100) / 100,
      total_keywords: keywords.length,
      total_pages: searchConsoleData.length,
      kd_threshold_high: domainAuthority + 20,
      kd_lower: Math.max(10, domainAuthority - 25),
      kd_upper: Math.max(20, domainAuthority - 10),
      n_new_kw: 10,
      n_backlinks: Math.ceil((domainAuthority + 20 - domainAuthority) / 5),
      backlink_da: domainAuthority + 10,
      cannibal_urls: Math.floor(searchConsoleData.length * 0.1), // Estimated
      dilution_pct: Math.floor(Math.random() * 20) + 5, // Placeholder
      topic: "main topic", // Placeholder
      n_tofu_posts: Math.ceil(5 + Math.random() * 5),
      repurpose_count: Math.ceil(2 + Math.random() * 3),
      new_awareness: Math.ceil(3 + Math.random() * 4),
      headline_count: 5,
      n_priority_kw: Math.min(keywords.length, 10),
      kd_priority_max: domainAuthority - 5,
      kd_ad_pause: domainAuthority + 15,
      // Add other metrics as needed
      hook_score: 50 + Math.random() * 40, // Placeholder scores
      understand_score: 50 + Math.random() * 40,
      trust_score: 50 + Math.random() * 40,
      act_score: 50 + Math.random() * 40,
      retention_coverage: 30 + Math.random() * 40,
      advocacy_coverage: 10 + Math.random() * 30,
      tofu_pct: 45 + Math.random() * 20,
      bofu_pct: 10 + Math.random() * 20,
      mofu_pct: 25 + Math.random() * 15,
      awareness_pct: 15 + Math.random() * 15,
      decision_pct: 8 + Math.random() * 10,
      advocacy_pct: 1 + Math.random() * 3,
    };

    // Generate recommendations for all panels
    const newRecommendations = {};
    const panelKeys = [
      "1_site_strength_vs_keyword_barrier",
      "2_equity_leaks",
      "3_funnel_mix_health",
      "4_hook_understand_trust_act_chain",
      "5_matchup_analysis",
      "6_playbook_compliance",
      "7_journey_coverage",
    ];

    panelKeys.forEach((panelKey) => {
      newRecommendations[panelKey] = generateRecommendations(
        panelKey,
        auditData,
        3
      );
    });

    setRecommendations(newRecommendations);
  }, [onboardingData, loading]);

  // Calculate strategy engine metrics
  const strategyData = useMemo(() => {
    if (!onboardingData || loading) return { isBlind: true };

    const searchConsoleData = Array.isArray(onboardingData.searchConsoleData)
      ? onboardingData.searchConsoleData
      : [];
    const keywords = Array.isArray(onboardingData.keywords)
      ? onboardingData.keywords
      : [];

    if (searchConsoleData.length === 0) {
      return { isBlind: true };
    }

    // Enhanced domain authority calculation with multiple sources
    const domainAuthority =
      parseInt(onboardingData.initialAnalysisState?.domainAuthority) ||
      parseInt(onboardingData.domain_authority) ||
      Math.min(
        Math.max(
          Math.floor(
            (searchConsoleData.filter((page) => parseFloat(page.position) <= 10)
              .length /
              Math.max(searchConsoleData.length, 1)) *
              60 +
              (keywords.filter((kw) => parseInt(kw.difficulty) >= 50).length /
                Math.max(keywords.length, 1)) *
                40
          ),
          15
        ),
        85
      );

    // Enhanced authority metrics
    const pageAuthority =
      parseInt(onboardingData.initialAnalysisState?.pageAuthority) ||
      parseInt(onboardingData.page_authority) ||
      Math.floor(domainAuthority * 0.8);
    const trustFlow =
      parseInt(onboardingData.initialAnalysisState?.trustFlow) ||
      Math.floor(domainAuthority * 0.6);
    const citationFlow =
      parseInt(onboardingData.initialAnalysisState?.citationFlow) ||
      Math.floor(domainAuthority * 0.7);

    // Calculate keyword difficulty average with enhanced fallbacks
    const avgKeywordDifficulty =
      keywords.length > 0
        ? keywords.reduce((sum, kw) => {
            const difficulty =
              parseInt(kw.difficulty) ||
              parseInt(kw.kd) ||
              parseInt(kw.keywordDifficulty) ||
              Math.min(
                Math.max(
                  (parseInt(kw.searchVolume) || 100) / 100 +
                    (parseFloat(kw.competition) || 0.5) * 50,
                  10
                ),
                80
              );
            return sum + difficulty;
          }, 0) / keywords.length
        : 30;

    // Weight class determination with efficiency ratio
    let weightClass, targetDifficulty, classColor, efficiencyRatio;
    const deltaAboveClass = Math.max(0, avgKeywordDifficulty - domainAuthority);
    efficiencyRatio = domainAuthority / Math.max(avgKeywordDifficulty, 1);

    if (domainAuthority >= 60) {
      weightClass = "Heavyweight";
      targetDifficulty = "60+ Difficulty";
      classColor = "#10B981";
    } else if (domainAuthority >= 30) {
      weightClass = "Middleweight";
      targetDifficulty = "30-59 Difficulty";
      classColor = "#F59E0B";
    } else {
      weightClass = "Lightweight";
      targetDifficulty = "<30 Difficulty";
      classColor = "#EF4444";
    }

    // Calculate total metrics
    const totalImpressions = searchConsoleData.reduce(
      (sum, page) => sum + (parseInt(page.impressions) || 0),
      0
    );
    const totalClicks = searchConsoleData.reduce(
      (sum, page) => sum + (parseInt(page.clicks) || 0),
      0
    );
    const avgPosition =
      searchConsoleData.reduce(
        (sum, page) => sum + (parseFloat(page.position) || 0),
        0
      ) / searchConsoleData.length;
    const avgCTR =
      totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    // 1. Enhanced Site Strength vs Keyword Barrier Analysis
    const mismatchedKeywords = keywords.filter((kw) => {
      const difficulty =
        parseInt(kw.difficulty) ||
        parseInt(kw.kd) ||
        parseInt(kw.keywordDifficulty) ||
        Math.min(
          Math.max(
            (parseInt(kw.searchVolume) || 100) / 100 +
              (parseFloat(kw.competition) || 0.5) * 50,
            10
          ),
          80
        );

      if (domainAuthority >= 60) return difficulty < 30 || difficulty > 90;
      if (domainAuthority >= 30) return difficulty > 59 || difficulty < 15;
      return difficulty > 40;
    });

    const mismatchPercentage =
      keywords.length > 0
        ? (mismatchedKeywords.length / keywords.length) * 100
        : 0;

    const quickWinKeywords = keywords.filter((kw) => {
      const difficulty =
        parseInt(kw.difficulty) ||
        parseInt(kw.kd) ||
        parseInt(kw.keywordDifficulty) ||
        Math.min(
          Math.max(
            (parseInt(kw.searchVolume) || 100) / 100 +
              (parseFloat(kw.competition) || 0.5) * 50,
            10
          ),
          80
        );
      return (
        difficulty <= domainAuthority - 10 && difficulty >= domainAuthority - 25
      );
    });

    // 2. Enhanced Equity Leaks Analysis
    const cannibalizationPages = searchConsoleData.filter((page, index) => {
      const query = (page.query || "").toLowerCase();
      return searchConsoleData.some((otherPage, otherIndex) => {
        if (index >= otherIndex) return false;
        const otherQuery = (otherPage.query || "").toLowerCase();
        return (
          query.length > 3 &&
          otherQuery.length > 3 &&
          (query.includes(otherQuery) || otherQuery.includes(query))
        );
      });
    });

    const orphanPages = searchConsoleData.filter(
      (page) =>
        parseFloat(page.position) > 50 && parseInt(page.impressions) < 10
    );

    const cannibalizationPercentage =
      searchConsoleData.length > 0
        ? (cannibalizationPages.length / searchConsoleData.length) * 100
        : 0;

    const dilutionPercentage =
      searchConsoleData.length > 0
        ? (orphanPages.length / searchConsoleData.length) * 100
        : 0;

    // Estimate lost equity value
    const lostEquityValue = Math.floor(
      (cannibalizationPages.length * 1200 + orphanPages.length * 800) *
        (totalClicks / Math.max(searchConsoleData.length, 1))
    );

    // 3. Enhanced Funnel Mix Health
    const funnelData = onboardingData.funnelAnalysis?.funnelDistribution || {
      ToF: Math.floor(searchConsoleData.length * 0.38),
      MoF: Math.floor(searchConsoleData.length * 0.27),
      BoF: Math.floor(searchConsoleData.length * 0.35),
      Unknown: 0,
    };

    const totalFunnelPages =
      funnelData.ToF + funnelData.MoF + funnelData.BoF + funnelData.Unknown;
    const tofPercentage =
      totalFunnelPages > 0 ? (funnelData.ToF / totalFunnelPages) * 100 : 0;
    const mofPercentage =
      totalFunnelPages > 0 ? (funnelData.MoF / totalFunnelPages) * 100 : 0;
    const bofPercentage =
      totalFunnelPages > 0 ? (funnelData.BoF / totalFunnelPages) * 100 : 0;

    // Ideal distribution: 55% ToF, 30% MoF, 15% BoF
    const idealToF = 55,
      idealMoF = 30,
      idealBoF = 15;
    const funnelHealthScore =
      100 -
      Math.abs(tofPercentage - idealToF) -
      Math.abs(mofPercentage - idealMoF) -
      Math.abs(bofPercentage - idealBoF);

    const funnelImbalance = {
      tofGap: idealToF - tofPercentage,
      mofGap: idealMoF - mofPercentage,
      bofGap: idealBoF - bofPercentage,
    };

    // 4. Enhanced HUTA Chain Analysis
    const hookScore = Math.min(
      100,
      avgCTR * 15 +
        (searchConsoleData.filter((page) => parseFloat(page.ctr || 0) > 5)
          .length /
          Math.max(searchConsoleData.length, 1)) *
          40 +
        (keywords.filter(
          (kw) =>
            (kw.query || kw.keyword || "").toLowerCase().includes("how") ||
            (kw.query || kw.keyword || "").toLowerCase().includes("best")
        ).length /
          Math.max(keywords.length, 1)) *
          20
    );

    const understandScore = Math.min(
      100,
      Math.max(0, 100 - avgPosition * 3) * 0.7 +
        (searchConsoleData.filter((page) => parseFloat(page.position) <= 5)
          .length /
          Math.max(searchConsoleData.length, 1)) *
          30
    );

    const trustScore = Math.min(
      100,
      domainAuthority * 0.35 +
        pageAuthority * 0.25 +
        trustFlow * 0.2 +
        citationFlow * 0.2 +
        (searchConsoleData.filter(
          (page) =>
            (page.page || "").includes("about") ||
            (page.page || "").includes("testimonial") ||
            (page.page || "").includes("review")
        ).length /
          Math.max(searchConsoleData.length, 1)) *
          20
    );

    const actScore = Math.min(
      100,
      (funnelData.BoF / Math.max(totalFunnelPages, 1)) * 60 +
        (searchConsoleData.filter((page) => {
          const query = (page.query || "").toLowerCase();
          const pageUrl = (page.page || "").toLowerCase();
          return (
            query.includes("buy") ||
            query.includes("price") ||
            query.includes("cost") ||
            pageUrl.includes("pricing") ||
            pageUrl.includes("buy") ||
            pageUrl.includes("checkout")
          );
        }).length /
          Math.max(searchConsoleData.length, 1)) *
          40
    );

    const hutaScore = (hookScore + understandScore + trustScore + actScore) / 4;

    // 5. Enhanced Match-up Analysis with detailed breakdown
    const wellTargetedKeywords = keywords.filter((kw) => {
      const difficulty =
        parseInt(kw.difficulty) ||
        parseInt(kw.kd) ||
        parseInt(kw.keywordDifficulty) ||
        Math.min(
          Math.max(
            (parseInt(kw.searchVolume) || 100) / 100 +
              (parseFloat(kw.competition) || 0.5) * 50,
            10
          ),
          80
        );

      if (domainAuthority >= 60) return difficulty >= 40 && difficulty <= 85;
      if (domainAuthority >= 30) return difficulty >= 20 && difficulty <= 55;
      return difficulty <= 35;
    });

    const matchupScore =
      keywords.length > 0
        ? (wellTargetedKeywords.length / keywords.length) * 100
        : 0;

    // 6. Enhanced Playbook Compliance with framework coverage
    const contentStrategies =
      onboardingData.suggestionsFromAi?.content_strategies || [];
    const topicClusters =
      onboardingData.suggestionsFromAi?.topic_clusters || [];

    // Framework coverage analysis
    const frameworkCoverage = {
      awareness: {
        coverage: Math.min(
          167,
          (funnelData.ToF / Math.max(totalFunnelPages * 0.55, 1)) * 100
        ),
        frameworks: ["AIDA", "RACE", "AARRR", "Cialdini"],
        met: ["AIDA", "RACE", "AARRR", "Cialdini"],
      },
      consideration: {
        coverage: Math.min(
          140,
          (funnelData.MoF / Math.max(totalFunnelPages * 0.3, 1)) * 100
        ),
        frameworks: ["AIDA", "RACE", "Cialdini"],
        met: ["AIDA", "RACE", "Cialdini"],
      },
      decision: {
        coverage: Math.min(
          100,
          (funnelData.BoF / Math.max(totalFunnelPages * 0.15, 1)) * 100
        ),
        frameworks: ["AARRR", "ADA", "RACE", "Cialdini"],
        met:
          funnelData.BoF > 0
            ? ["AARRR", "ADA", "RACE", "Cialdini"]
            : ["AARRR", "RACE"],
      },
      retention: {
        coverage: Math.min(
          100,
          (searchConsoleData.filter(
            (page) =>
              (page.page || "").includes("account") ||
              (page.page || "").includes("dashboard") ||
              (page.page || "").includes("support")
          ).length /
            Math.max(searchConsoleData.length * 0.1, 1)) *
            100
        ),
        frameworks: ["AARRR"],
        met: [],
      },
      advocacy: {
        coverage: Math.min(
          100,
          (searchConsoleData.filter(
            (page) =>
              (page.page || "").includes("referral") ||
              (page.page || "").includes("testimonial") ||
              (page.page || "").includes("case-study")
          ).length /
            Math.max(searchConsoleData.length * 0.05, 1)) *
            100
        ),
        frameworks: ["Cialdini"],
        met: [],
      },
    };

    const overallComplianceScore =
      Object.values(frameworkCoverage).reduce(
        (sum, stage) => sum + Math.min(stage.coverage, 100),
        0
      ) / 5;

    // 7. Enhanced Journey Coverage with detailed distribution
    const journeyStages = {
      awareness: {
        pages: searchConsoleData.filter((page) => {
          const query = (page.query || "").toLowerCase();
          const pageUrl = (page.page || "").toLowerCase();
          return (
            query.includes("what") ||
            query.includes("how") ||
            query.includes("guide") ||
            pageUrl.includes("blog") ||
            pageUrl.includes("guide") ||
            pageUrl.includes("what")
          );
        }),
        ideal: 0.218,
        color: "#3B82F6",
      },
      consideration: {
        pages: searchConsoleData.filter((page) => {
          const query = (page.query || "").toLowerCase();
          const pageUrl = (page.page || "").toLowerCase();
          return (
            query.includes("vs") ||
            query.includes("compare") ||
            query.includes("best") ||
            query.includes("review") ||
            pageUrl.includes("compare") ||
            pageUrl.includes("vs")
          );
        }),
        ideal: 0.455,
        color: "#8B5CF6",
      },
      decision: {
        pages: searchConsoleData.filter((page) => {
          const query = (page.query || "").toLowerCase();
          const pageUrl = (page.page || "").toLowerCase();
          return (
            query.includes("price") ||
            query.includes("cost") ||
            query.includes("buy") ||
            pageUrl.includes("pricing") ||
            pageUrl.includes("plans") ||
            pageUrl.includes("buy")
          );
        }),
        ideal: 0.127,
        color: "#10B981",
      },
      retention: {
        pages: searchConsoleData.filter((page) => {
          const pageUrl = (page.page || "").toLowerCase();
          return (
            pageUrl.includes("help") ||
            pageUrl.includes("support") ||
            pageUrl.includes("faq") ||
            pageUrl.includes("tutorial") ||
            pageUrl.includes("docs") ||
            pageUrl.includes("account")
          );
        }),
        ideal: 0.182,
        color: "#F59E0B",
      },
      advocacy: {
        pages: searchConsoleData.filter((page) => {
          const pageUrl = (page.page || "").toLowerCase();
          return (
            pageUrl.includes("testimonial") ||
            pageUrl.includes("case") ||
            pageUrl.includes("success") ||
            pageUrl.includes("referral")
          );
        }),
        ideal: 0.018,
        color: "#EF4444",
      },
    };

    // Calculate actual percentages
    Object.keys(journeyStages).forEach((stage) => {
      journeyStages[stage].actual =
        journeyStages[stage].pages.length / searchConsoleData.length;
      journeyStages[stage].percentage = journeyStages[stage].actual * 100;
    });

    const journeyCoverage = Math.min(
      100,
      Object.values(journeyStages).reduce(
        (sum, stage) => sum + Math.min(stage.actual / stage.ideal, 1) * 20,
        0
      )
    );
    return {
      isBlind: false,
      domainAuthority,
      pageAuthority,
      trustFlow,
      citationFlow,
      weightClass,
      targetDifficulty,
      classColor,
      avgKeywordDifficulty: Math.round(avgKeywordDifficulty),
      efficiencyRatio: Math.round(efficiencyRatio * 100) / 100,
      deltaAboveClass: Math.round(deltaAboveClass),
      totalImpressions,
      totalClicks,
      avgPosition,
      avgCTR,
      // Enhanced metrics
      cannibalizationPercentage: Math.round(cannibalizationPercentage),
      dilutionPercentage: Math.round(dilutionPercentage),
      lostEquityValue,
      funnelImbalance,
      overallComplianceScore: Math.round(overallComplianceScore),
      quickWinKeywords: quickWinKeywords.slice(0, 10), // Top 10 quick wins
      frameworkCoverage,
      journeyStages,
      topPerformingPages: searchConsoleData.filter(
        (page) => parseFloat(page.position) <= 5
      ).length,
      underperformingPages: searchConsoleData.filter(
        (page) => parseFloat(page.position) > 30
      ).length,
      commercialQueryCoverage: searchConsoleData.filter((page) => {
        const query = (page.query || "").toLowerCase();
        return (
          query.includes("buy") ||
          query.includes("price") ||
          query.includes("review") ||
          query.includes("vs") ||
          query.includes("best")
        );
      }).length,
      sections: {
        siteStrength: {
          mismatchPercentage: Math.round(mismatchPercentage),
          wellTargeted: wellTargetedKeywords.length,
          totalKeywords: keywords.length,
          mismatchedCount: mismatchedKeywords.length,
          quickWinCount: quickWinKeywords.length,
          recommendation:
            mismatchPercentage > 50
              ? `Critical: Realign keyword targeting (${mismatchedKeywords.length} mismatched)`
              : mismatchPercentage > 25
              ? `Warning: Review keyword strategy (${mismatchedKeywords.length} mismatched)`
              : "Good: Keywords match site strength",
          quickWins: recommendations["1_site_strength_vs_keyword_barrier"] || [
            `Drop KD > ${domainAuthority + 20} targets for next sprint`,
            `Secure ${Math.ceil(deltaAboveClass / 5)} DA ${
              domainAuthority + 10
            }+ backlinks`,
            `Prioritize ${quickWinKeywords.length} quick-win keywords (KD ${
              domainAuthority - 25
            }-${domainAuthority - 10})`,
          ],
        },
        equityLeaks: {
          cannibalizationPercentage: Math.round(cannibalizationPercentage),
          dilutionPercentage: Math.round(dilutionPercentage),
          cannibalizationPages: cannibalizationPages.length,
          orphanPages: orphanPages.length,
          totalPages: searchConsoleData.length,
          lostEquityValue,
          recommendation:
            cannibalizationPercentage > 15 || dilutionPercentage > 20
              ? `Critical: Major equity leaks detected ($${lostEquityValue.toLocaleString()} lost)`
              : cannibalizationPercentage > 8 || dilutionPercentage > 12
              ? `Warning: Moderate equity leaks ($${lostEquityValue.toLocaleString()} lost)`
              : "Good: Minimal equity leaks",
          quickWins: recommendations["2_equity_leaks"] || [
            `Merge ${Math.min(
              cannibalizationPages.length,
              5
            )} overlapping posts`,
            `Redirect ${Math.min(
              orphanPages.length,
              8
            )} orphan pages into core hubs`,
            `Standardize internal-link anchor text on BOFU pages`,
          ],
        },
        funnelHealth: {
          tofPercentage: Math.round(tofPercentage),
          mofPercentage: Math.round(mofPercentage),
          bofPercentage: Math.round(bofPercentage),
          healthScore: Math.round(funnelHealthScore),
          tofGap: Math.round(funnelImbalance.tofGap),
          mofGap: Math.round(funnelImbalance.mofGap),
          bofGap: Math.round(funnelImbalance.bofGap),
          isBalanced:
            Math.abs(funnelImbalance.tofGap) < 10 &&
            Math.abs(funnelImbalance.mofGap) < 10 &&
            Math.abs(funnelImbalance.bofGap) < 10,
          recommendation:
            funnelHealthScore < 50
              ? `Critical: Funnel distribution imbalanced (ToF ${
                  funnelImbalance.tofGap > 0 ? "+" : ""
                }${Math.round(funnelImbalance.tofGap)}%, BoF ${
                  funnelImbalance.bofGap > 0 ? "+" : ""
                }${Math.round(funnelImbalance.bofGap)}%)`
              : funnelHealthScore < 75
              ? "Warning: Funnel needs optimization"
              : "Good: Healthy funnel distribution",
          quickWins:
            recommendations["3_funnel_mix_health"] ||
            [
              funnelImbalance.tofGap > 5
                ? `Publish ${Math.ceil(
                    funnelImbalance.tofGap / 5
                  )} TOFU primers targeting KD < 40`
                : "",
              funnelImbalance.bofGap < -10
                ? `Convert ${Math.ceil(
                    Math.abs(funnelImbalance.bofGap) / 5
                  )} BOFU guides into MOFU comparisons`
                : "",
              `Add 3 trust-signals onto high-traffic BOFU pages`,
            ].filter(Boolean),
        },
        hutaChain: {
          score: Math.round(hutaScore),
          hookScore: Math.round(hookScore),
          understandScore: Math.round(understandScore),
          trustScore: Math.round(trustScore),
          actScore: Math.round(actScore),
          weakestLink:
            Math.min(hookScore, understandScore, trustScore, actScore) ===
            hookScore
              ? "Hook"
              : Math.min(hookScore, understandScore, trustScore, actScore) ===
                understandScore
              ? "Understand"
              : Math.min(hookScore, understandScore, trustScore, actScore) ===
                trustScore
              ? "Trust"
              : "Act",
          recommendation:
            hutaScore < 40
              ? "Critical: HUTA chain broken"
              : hutaScore < 65
              ? "Warning: HUTA chain needs work"
              : "Good: Strong HUTA performance",
          quickWins:
            recommendations["4_hook_understand_trust_act_chain"] ||
            [
              hookScore < 60
                ? `Rewrite ${Math.ceil(
                    (60 - hookScore) / 8
                  )} hero headlines with story-led phrasing (Hook +8 pts)`
                : "",
              understandScore < 60
                ? `Add icon + benefit bullets above folds (Clarity +6 pts)`
                : "",
              trustScore < 60
                ? `Insert ${Math.ceil(
                    (60 - trustScore) / 5
                  )} third-party reviews on pricing page (Trust +5 pts)`
                : "",
              actScore < 60 ? `Single, vivid CTA on /pricing (Act +8 pts)` : "",
            ].filter(Boolean),
        },
        matchup: {
          score: Math.round(matchupScore),
          wellTargeted: wellTargetedKeywords.length,
          totalKeywords: keywords.length,
          efficiencyRatio: Math.round(efficiencyRatio * 100) / 100,
          ratioStatus:
            efficiencyRatio >= 1.0
              ? "Green"
              : efficiencyRatio >= 0.75
              ? "Amber"
              : "Red",
          recommendation:
            matchupScore < 40
              ? `Critical: Poor keyword match-up (Efficiency Ratio ${efficiencyRatio})`
              : matchupScore < 70
              ? `Warning: Improve keyword targeting (Efficiency Ratio ${efficiencyRatio})`
              : "Good: Strong keyword alignment",
          quickWins: recommendations["5_matchup_analysis"] || [
            `Prioritize ${Math.min(
              wellTargetedKeywords.length,
              10
            )} keywords KD < ${domainAuthority - 5}`,
            `Pause ads on KD > ${domainAuthority + 15} terms`,
            `Re-cluster mid-KD terms into supporting content`,
          ],
        },
        playbook: {
          score: Math.round(overallComplianceScore),
          strategies: contentStrategies.length,
          clusters: topicClusters.length,
          frameworkCoverage,
          recommendation:
            overallComplianceScore < 40
              ? "Critical: Develop content playbook"
              : overallComplianceScore < 70
              ? "Warning: Expand content strategy"
              : "Good: Strong playbook compliance",
          quickWins:
            recommendations["6_playbook_compliance"] ||
            [
              frameworkCoverage.retention.coverage < 50
                ? `Add "Engage" emails to MOFU (RACE gap)`
                : "",
              frameworkCoverage.decision.met.length < 3
                ? `Embed authority proof on BOFU pages (Cialdini gap)`
                : "",
              frameworkCoverage.advocacy.coverage < 30
                ? `Launch loyalty perks email (Retention, AARRR)`
                : "",
            ].filter(Boolean),
        },
        journey: {
          score: Math.round(journeyCoverage),
          pageCount: searchConsoleData.length,
          engagement: Math.round(avgCTR),
          visibility: Math.round(Math.max(0, 100 - avgPosition * 3)),
          stages: journeyStages,
          recommendation:
            journeyCoverage < 40
              ? "Critical: Poor journey coverage"
              : journeyCoverage < 65
              ? "Warning: Expand journey mapping"
              : "Good: Comprehensive journey coverage",
          quickWins:
            recommendations["7_journey_coverage"] ||
            [
              journeyStages.awareness.percentage < 20
                ? `Repurpose ${Math.ceil(
                    (22 - journeyStages.awareness.percentage) / 2
                  )} Consideration posts into Awareness guides`
                : "",
              journeyStages.decision.percentage < 12
                ? `Deploy Decision-phase ROI calculator widget`
                : "",
              journeyStages.advocacy.percentage < 2
                ? `Replace low-performing Advocacy post with customer video testimonial`
                : "",
            ].filter(Boolean),
        },
      },
    };
  }, [onboardingData, loading, recommendations]);

  if (loading) {
    return (
      <div className="strategy-dashboard loading">
        <div className="loading-spinner">
          <RefreshCw className="animate-spin" size={32} />
          <p>Loading Strategy Engine...</p>
        </div>
      </div>
    );
  }

  if (strategyData.isBlind) {
    return (
      <div className="strategy-dashboard no-data">
        <div className="no-data-content">
          <AlertTriangle size={48} color="#F59E0B" />
          <h2>Insufficient Data for Strategy Analysis</h2>
          <p>
            Connect your search data and add keywords to unlock the Strategy
            Lab™ dashboard.
          </p>
          <button
            onClick={() => navigate("/onboarding/step-keywords")}
            className="cta-button"
          >
            Set Up Keywords <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  const { sections } = strategyData;

  return (
    <div className="strategy-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-title">
            <Target size={28} />
            <div>
              <h1>Strategy Lab™</h1>
              <p>Unified Performance Command Center</p>
            </div>
          </div>
          <div className="weight-class-badge">
            <div
              className="weight-indicator"
              style={{ backgroundColor: strategyData.classColor }}
            >
              <Shield size={16} />
              <span>
                {strategyData.weightClass} (DA {strategyData.domainAuthority})
              </span>
            </div>
            <div className="target-difficulty">
              Target: {strategyData.targetDifficulty}
            </div>
          </div>
        </div>
      </div>

      {/* Core Metrics Overview */}
      <div className="metrics-overview">
        <div className="metric-card">
          <Eye size={20} />
          <div className="metric-value">
            {strategyData.totalImpressions.toLocaleString()}
          </div>
          <div className="metric-label">Total Impressions</div>
        </div>
        <div className="metric-card">
          <Activity size={20} />
          <div className="metric-value">
            {strategyData.totalClicks.toLocaleString()}
          </div>
          <div className="metric-label">Total Clicks</div>
        </div>
        <div className="metric-card">
          <TrendingUp size={20} />
          <div className="metric-value">
            {strategyData.avgPosition.toFixed(1)}
          </div>
          <div className="metric-label">Avg Position</div>
        </div>
        <div className="metric-card">
          <Zap size={20} />
          <div className="metric-value">{strategyData.avgCTR.toFixed(2)}%</div>
          <div className="metric-label">Avg CTR</div>
        </div>
      </div>

      {/* Strategy Analysis Sections */}
      <div className="strategy-sections">
        {/* 1. Site Strength vs Keyword Barrier */}
        <div className="section-card">
          <div className="section-header">
            <div className="section-title">
              <Target size={20} />
              <h3>Site Strength vs Keyword Barrier</h3>
            </div>
            <div
              className={`status-indicator ${
                sections.siteStrength.mismatchPercentage <= 25
                  ? "good"
                  : sections.siteStrength.mismatchPercentage <= 50
                  ? "warning"
                  : "critical"
              }`}
            >
              {sections.siteStrength.mismatchPercentage <= 25 ? (
                <CheckCircle size={16} />
              ) : (
                <XCircle size={16} />
              )}
              {100 - sections.siteStrength.mismatchPercentage}% Match
            </div>
          </div>
          <div className="section-content">
            <div className="progress-bar">
              <div
                className="progress-fill good"
                style={{
                  width: `${100 - sections.siteStrength.mismatchPercentage}%`,
                }}
              ></div>
            </div>
            <div className="section-stats">
              <div className="stat">
                <span>Well Targeted:</span>
                <strong>
                  {sections.siteStrength.wellTargeted}/
                  {sections.siteStrength.totalKeywords}
                </strong>
              </div>
              <div className="stat">
                <span>Mismatch:</span>
                <strong>{sections.siteStrength.mismatchPercentage}%</strong>
              </div>
            </div>
            <div className="recommendation">
              {sections.siteStrength.recommendation}
            </div>
          </div>
        </div>

        {/* 2. Equity Leaks */}
        <div className="section-card">
          <div className="section-header">
            <div className="section-title">
              <AlertTriangle size={20} />
              <h3>Equity Leaks</h3>
            </div>
            <div
              className={`status-indicator ${
                sections.equityLeaks.leakPercentage <= 30
                  ? "good"
                  : sections.equityLeaks.leakPercentage <= 60
                  ? "warning"
                  : "critical"
              }`}
            >
              {sections.equityLeaks.leakPercentage <= 30 ? (
                <CheckCircle size={16} />
              ) : (
                <AlertTriangle size={16} />
              )}
              {100 - sections.equityLeaks.leakPercentage}% Sealed
            </div>
          </div>
          <div className="section-content">
            <div className="progress-bar">
              <div
                className="progress-fill critical"
                style={{ width: `${sections.equityLeaks.leakPercentage}%` }}
              ></div>
            </div>
            <div className="section-stats">
              <div className="stat">
                <span>Leaking Pages:</span>
                <strong>
                  {sections.equityLeaks.leakingPages}/
                  {sections.equityLeaks.totalPages}
                </strong>
              </div>
              <div className="stat">
                <span>Leak Rate:</span>
                <strong>{sections.equityLeaks.leakPercentage}%</strong>
              </div>
            </div>
            <div className="recommendation">
              {sections.equityLeaks.recommendation}
            </div>
          </div>
        </div>

        {/* 3. Funnel Mix Health */}
        <div className="section-card">
          <div className="section-header">
            <div className="section-title">
              <BarChart3 size={20} />
              <h3>Funnel Mix Health</h3>
            </div>
            <div
              className={`status-indicator ${
                sections.funnelHealth.healthScore >= 75
                  ? "good"
                  : sections.funnelHealth.healthScore >= 50
                  ? "warning"
                  : "critical"
              }`}
            >
              {sections.funnelHealth.healthScore >= 75 ? (
                <CheckCircle size={16} />
              ) : sections.funnelHealth.healthScore >= 50 ? (
                <AlertTriangle size={16} />
              ) : (
                <XCircle size={16} />
              )}
              {sections.funnelHealth.healthScore}% Healthy
            </div>
          </div>
          <div className="section-content">
            <div className="funnel-distribution">
              <div className="funnel-stage">
                <div className="stage-label">ToF</div>
                <div className="stage-bar">
                  <div
                    className="stage-fill tof"
                    style={{ width: `${sections.funnelHealth.tofPercentage}%` }}
                  ></div>
                </div>
                <div className="stage-value">
                  {sections.funnelHealth.tofPercentage}%
                </div>
              </div>
              <div className="funnel-stage">
                <div className="stage-label">MoF</div>
                <div className="stage-bar">
                  <div
                    className="stage-fill mof"
                    style={{ width: `${sections.funnelHealth.mofPercentage}%` }}
                  ></div>
                </div>
                <div className="stage-value">
                  {sections.funnelHealth.mofPercentage}%
                </div>
              </div>
              <div className="funnel-stage">
                <div className="stage-label">BoF</div>
                <div className="stage-bar">
                  <div
                    className="stage-fill bof"
                    style={{ width: `${sections.funnelHealth.bofPercentage}%` }}
                  ></div>
                </div>
                <div className="stage-value">
                  {sections.funnelHealth.bofPercentage}%
                </div>
              </div>
            </div>
            <div className="recommendation">
              {sections.funnelHealth.recommendation}
            </div>
          </div>
        </div>

        {/* 4. HUTA Chain */}
        <div className="section-card">
          <div className="section-header">
            <div className="section-title">
              <ArrowRight size={20} />
              <h3>Hook→Understand→Trust→Act Chain</h3>
            </div>
            <div
              className={`status-indicator ${
                sections.hutaChain.score >= 65
                  ? "good"
                  : sections.hutaChain.score >= 40
                  ? "warning"
                  : "critical"
              }`}
            >
              {sections.hutaChain.score >= 65 ? (
                <CheckCircle size={16} />
              ) : sections.hutaChain.score >= 40 ? (
                <AlertTriangle size={16} />
              ) : (
                <XCircle size={16} />
              )}
              {sections.hutaChain.score}% Strong
            </div>
          </div>
          <div className="section-content">
            <div className="huta-chain">
              <div className="huta-link">
                <div className="link-label">Hook</div>
                <div className="link-score">
                  {sections.hutaChain.hookScore}%
                </div>
              </div>
              <ArrowRight size={16} className="chain-arrow" />
              <div className="huta-link">
                <div className="link-label">Understand</div>
                <div className="link-score">
                  {sections.hutaChain.understandScore}%
                </div>
              </div>
              <ArrowRight size={16} className="chain-arrow" />
              <div className="huta-link">
                <div className="link-label">Trust</div>
                <div className="link-score">
                  {sections.hutaChain.trustScore}%
                </div>
              </div>
              <ArrowRight size={16} className="chain-arrow" />
              <div className="huta-link">
                <div className="link-label">Act</div>
                <div className="link-score">{sections.hutaChain.actScore}%</div>
              </div>
            </div>
            <div className="recommendation">
              {sections.hutaChain.recommendation}
            </div>
          </div>
        </div>

        {/* 5. Match-up Analysis */}
        <div className="section-card">
          <div className="section-header">
            <div className="section-title">
              <Users size={20} />
              <h3>Match-up Analysis</h3>
            </div>
            <div
              className={`status-indicator ${
                sections.matchup.score >= 70
                  ? "good"
                  : sections.matchup.score >= 40
                  ? "warning"
                  : "critical"
              }`}
            >
              {sections.matchup.score >= 70 ? (
                <CheckCircle size={16} />
              ) : sections.matchup.score >= 40 ? (
                <AlertTriangle size={16} />
              ) : (
                <XCircle size={16} />
              )}
              {sections.matchup.score}% Aligned
            </div>
          </div>
          <div className="section-content">
            <div className="progress-bar">
              <div
                className="progress-fill good"
                style={{ width: `${sections.matchup.score}%` }}
              ></div>
            </div>
            <div className="section-stats">
              <div className="stat">
                <span>Well Matched:</span>
                <strong>
                  {sections.matchup.wellTargeted}/
                  {sections.matchup.totalKeywords}
                </strong>
              </div>
              <div className="stat">
                <span>Success Rate:</span>
                <strong>{sections.matchup.score}%</strong>
              </div>
            </div>
            <div className="recommendation">
              {sections.matchup.recommendation}
            </div>
          </div>
        </div>

        {/* 6. Playbook Compliance */}
        <div className="section-card">
          <div className="section-header">
            <div className="section-title">
              <BookOpen size={20} />
              <h3>Playbook Compliance</h3>
            </div>
            <div
              className={`status-indicator ${
                sections.playbook.score >= 70
                  ? "good"
                  : sections.playbook.score >= 40
                  ? "warning"
                  : "critical"
              }`}
            >
              {sections.playbook.score >= 70 ? (
                <CheckCircle size={16} />
              ) : sections.playbook.score >= 40 ? (
                <AlertTriangle size={16} />
              ) : (
                <XCircle size={16} />
              )}
              {sections.playbook.score}% Complete
            </div>
          </div>
          <div className="section-content">
            <div className="progress-bar">
              <div
                className="progress-fill good"
                style={{ width: `${sections.playbook.score}%` }}
              ></div>
            </div>
            <div className="section-stats">
              <div className="stat">
                <span>Strategies:</span>
                <strong>{sections.playbook.strategies}</strong>
              </div>
              <div className="stat">
                <span>Topic Clusters:</span>
                <strong>{sections.playbook.clusters}</strong>
              </div>
            </div>
            <div className="recommendation">
              {sections.playbook.recommendation}
            </div>
          </div>
        </div>

        {/* 7. Journey Coverage */}
        <div className="section-card">
          <div className="section-header">
            <div className="section-title">
              <Navigation size={20} />
              <h3>Journey Coverage</h3>
            </div>
            <div
              className={`status-indicator ${
                sections.journey.score >= 65
                  ? "good"
                  : sections.journey.score >= 40
                  ? "warning"
                  : "critical"
              }`}
            >
              {sections.journey.score >= 65 ? (
                <CheckCircle size={16} />
              ) : sections.journey.score >= 40 ? (
                <AlertTriangle size={16} />
              ) : (
                <XCircle size={16} />
              )}
              {sections.journey.score}% Covered
            </div>
          </div>
          <div className="section-content">
            <div className="progress-bar">
              <div
                className="progress-fill good"
                style={{ width: `${sections.journey.score}%` }}
              ></div>
            </div>
            <div className="section-stats">
              <div className="stat">
                <span>Pages:</span>
                <strong>{sections.journey.pageCount}</strong>
              </div>
              <div className="stat">
                <span>Engagement:</span>
                <strong>{sections.journey.engagement}%</strong>
              </div>
              <div className="stat">
                <span>Visibility:</span>
                <strong>{sections.journey.visibility}%</strong>
              </div>
            </div>
            <div className="recommendation">
              {sections.journey.recommendation}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyAnalysis;
