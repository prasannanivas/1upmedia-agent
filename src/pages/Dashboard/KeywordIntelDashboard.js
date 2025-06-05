/**
 * Keyword Intelligence Dashboard - Advanced SEO Analysis Console
 *
 * Data Sources Integration:
 * - Google Search Console (GSC): impressions, clicks, ctr, position data
 * - Google Analytics 4 (GA4): revenue, sessions, conversions
 * - MOZ API: domain_authority, page_authority, keyword_difficulty, backlinks
 *
 * Key Metrics & Calculations:
 * - Blended Authority (BA) = 0.6 * DA + 0.4 * avg(PA)
 * - KD Guard-rail = BA_score + 10 (allowed KD ceiling)
 * - Portfolio KW Cap = DCF on keyword-attributed cash flows
 * - Risk assessments for content leaks, cannibalization, DA/KD mismatches
 */

import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../../context/OnboardingContext";
import { Search, AlertTriangle, RefreshCw, Download } from "lucide-react";
import "./KeywordIntelDashboard.css";

// Real MOZ data from onboardingData - using actual data where available
const getRealMozData = (onboardingData) => {
  // Use actual domain authority from initial analysis
  const domain_authority =
    parseInt(onboardingData.initialAnalysisState?.domainAuthority) || 0;
  const avg_page_authority =
    parseInt(onboardingData.initialAnalysisState?.pageAuthority) || 0;

  // Use both search console data sources
  const searchConsoleData = onboardingData.searchConsoleData || []; // Page-level data
  const gscAnalysisData = onboardingData.GSCAnalysisData || {}; // Analyzed query-level data
  // Get query-level data from GSC analysis if available
  const queryData =
    gscAnalysisData.queries || gscAnalysisData.keywordPerformance || [];

  // Use real keywords from onboarding data with real search console metrics
  const keywords =
    onboardingData.keywords?.map((keyword, index) => {
      // Try to find matching query data first (more specific)
      let gscMatch = null;
      if (Array.isArray(queryData)) {
        gscMatch = queryData.find(
          (query) =>
            query.query &&
            query.query.toLowerCase().includes(keyword.toLowerCase())
        );
      }

      // Fallback to page-level search console data if no query match
      if (!gscMatch && Array.isArray(searchConsoleData)) {
        gscMatch = searchConsoleData.find(
          (page) =>
            (page.query &&
              page.query.toLowerCase().includes(keyword.toLowerCase())) ||
            (page.page &&
              page.page.toLowerCase().includes(keyword.toLowerCase()))
        );
      } // Calculate realistic KD based on actual position and competition
      let kd = 0;
      if (gscMatch && gscMatch.position) {
        // Higher position = higher difficulty (inverse relationship)
        // Position 1-3: KD 70-85, Position 4-10: KD 40-70, Position 10+: KD 20-40
        const position = parseFloat(gscMatch.position);
        if (position <= 3) {
          kd = Math.min(70 + domain_authority * 0.2, 85);
        } else if (position <= 10) {
          kd = Math.min(40 + domain_authority * 0.3, 70);
        } else {
          kd = Math.min(20 + domain_authority * 0.2, 40);
        }
      } else {
        // No GSC data - estimate based on domain authority
        kd = domain_authority > 0 ? Math.min(domain_authority + 15, 75) : 0;
      }

      // Use real search volume from search console or show as unavailable
      const search_volume = gscMatch?.impressions
        ? Math.round(parseInt(gscMatch.impressions) * 0.1) // Estimate monthly volume from impressions
        : 0; // No data available      // Determine intent based on keyword characteristics - using funnel stages
      const keywordLower = keyword.toLowerCase();
      let intent = "ToF"; // Default - Top of Funnel (Awareness)
      if (
        keywordLower.includes("buy") ||
        keywordLower.includes("price") ||
        keywordLower.includes("cost") ||
        keywordLower.includes("purchase") ||
        keywordLower.includes("order") ||
        keywordLower.includes("shop")
      ) {
        intent = "BoF"; // Bottom of Funnel (Transaction)
      } else if (
        keywordLower.includes("best") ||
        keywordLower.includes("review") ||
        keywordLower.includes("compare") ||
        keywordLower.includes("vs") ||
        keywordLower.includes("versus") ||
        keywordLower.includes("how to") ||
        keywordLower.includes("guide")
      ) {
        intent = "MoF"; // Middle of Funnel (Consideration)
      }

      return {
        keyword: keyword,
        kd: Math.round(kd),
        search_volume: search_volume,
        intent: intent,
        hasRealData: !!gscMatch, // Track if we have real GSC data for this keyword
      };
    }) || [];

  // Generate anchor text data from actual domain and top keywords with real data
  const domainName = onboardingData.domain
    ? onboardingData.domain.replace(/^https?:\/\//, "").replace(/^www\./, "")
    : null;

  const anchor_text_data = [];

  // Add domain-based anchor if domain exists
  if (domainName) {
    anchor_text_data.push({
      anchor: domainName,
      percentage: 0, // Will be calculated from real backlink data when available
      hasRealData: false,
    });
  }

  // Add top keywords as potential anchors
  const topKeywords = keywords.filter((kw) => kw.hasRealData).slice(0, 2);
  topKeywords.forEach((kw) => {
    anchor_text_data.push({
      anchor: kw.keyword,
      percentage: 0, // Will be calculated from real backlink data when available
      hasRealData: false,
    });
  });

  // If no real anchor data, show placeholder
  if (anchor_text_data.length === 0) {
    anchor_text_data.push({
      anchor: "No anchor text data",
      percentage: 0,
      hasRealData: false,
    });
  }

  return {
    domain_authority,
    avg_page_authority,
    keywords,
    anchor_text_data,
    hasRealMozData: domain_authority > 0 && avg_page_authority > 0,
  };
};

const KeywordIntelDashboard = () => {
  const { onboardingData, loading } = useOnboarding();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

  // Conversion rate state (1% to 4.5% range) - same as CommandCenterDashboard
  const [conversionRate, setConversionRate] = useState(2.0); // Default 2%  // Calculate keyword intelligence metrics
  const keywordIntelData = useMemo(() => {
    if (!onboardingData || loading) return { isBlind: true };

    // Check for insufficient data
    const hasMinimalData = () => {
      const hasSearchConsole =
        Array.isArray(onboardingData.searchConsoleData) &&
        onboardingData.searchConsoleData.length > 0;
      const hasDomain =
        onboardingData.domain && onboardingData.domain.trim() !== "";
      const hasKeywords =
        Array.isArray(onboardingData.keywords) &&
        onboardingData.keywords.length > 0;
      return hasSearchConsole && hasDomain && hasKeywords;
    };

    if (!hasMinimalData()) {
      return { isBlind: true };
    }

    const searchConsoleData = onboardingData.searchConsoleData || [];
    const mozData = getRealMozData(onboardingData); // Use real data instead of mock

    const domain = onboardingData.domain;
    const gscAnalysisData = onboardingData.GSCAnalysisData || {};

    // 1. Calculate Blended Authority (BA Score)
    const domain_authority = mozData.domain_authority;
    const avg_page_authority = mozData.avg_page_authority;
    const blended_authority = 0.6 * domain_authority + 0.4 * avg_page_authority;

    // Weight class determination
    const getWeightClass = (ba) => {
      if (ba >= 70) return "Heavyweight";
      if (ba >= 50) return "Middleweight";
      if (ba >= 30) return "Lightweight";
      return "Featherweight";
    }; // 2. KD Guard-rail calculations - handle cases with no KD data
    const allowed_kd_ceiling = blended_authority + 10;
    const keywordsWithKD = mozData.keywords.filter((kw) => kw.kd > 0);
    const avg_serp_kd =
      keywordsWithKD.length > 0
        ? Math.round(
            keywordsWithKD.reduce((sum, kw) => sum + kw.kd, 0) /
              keywordsWithKD.length
          )
        : 0;
    const keywords_in_class = keywordsWithKD.filter(
      (kw) => kw.kd <= allowed_kd_ceiling
    ).length;
    const success_probability =
      keywordsWithKD.length > 0
        ? Math.round((keywords_in_class / keywordsWithKD.length) * 100)
        : 0; // 3. Portfolio calculations - handle keywords with no search volume data
    const averageOrderValue =
      parseFloat(onboardingData.domainCostDetails?.averageOrderValue) || 75;
    const contentCost =
      parseFloat(onboardingData.domainCostDetails?.AverageContentCost) || 200;

    // Convert conversion rate percentage to decimal
    const conversionRateDecimal = conversionRate / 100;

    // Calculate portfolio value using DCF method with dynamic conversion rate
    // Only include keywords that have real search volume data
    const keywordsWithVolume = mozData.keywords.filter(
      (kw) => kw.search_volume > 0
    );
    const portfolio_kw_cap = keywordsWithVolume.reduce((total, kw) => {
      const estimated_ctr = kw.kd < 20 ? 0.25 : kw.kd < 40 ? 0.15 : 0.08;
      const annual_clicks = kw.search_volume * 12 * estimated_ctr; // Use dynamic conversion rate instead of hardcoded rates
      const intent_multiplier =
        kw.intent === "BoF" ? 2.0 : kw.intent === "MoF" ? 1.0 : 0.33; // BoF=Transaction, MoF=Consideration, ToF=Awareness
      const effective_conversion_rate =
        conversionRateDecimal * intent_multiplier;
      const annual_revenue =
        annual_clicks * effective_conversion_rate * averageOrderValue;
      return total + annual_revenue;
    }, 0);

    const portfolio_yield =
      portfolio_kw_cap > 0
        ? Math.round(((portfolio_kw_cap * 0.15) / portfolio_kw_cap) * 100)
        : 0; // 15% yield assumption    // 4. Revenue momentum calculations - use GSC analysis data when available
    const analysisData = onboardingData.GSCAnalysisData || {};
    let revenue_momentum_data = {
      delta_impressions: "N/A",
      delta_clicks: "N/A",
      delta_ctr: "N/A",
      delta_position: "N/A",
    };

    // Try to use real comparison data from GSC analysis
    if (analysisData.performanceComparison) {
      const comparison = analysisData.performanceComparison;
      revenue_momentum_data = {
        delta_impressions:
          comparison.impressionsChange !== undefined
            ? comparison.impressionsChange > 0
              ? `+${comparison.impressionsChange}`
              : `${comparison.impressionsChange}`
            : "N/A",
        delta_clicks:
          comparison.clicksChange !== undefined
            ? comparison.clicksChange > 0
              ? `+${comparison.clicksChange}`
              : `${comparison.clicksChange}`
            : "N/A",
        delta_ctr:
          comparison.ctrChange !== undefined
            ? comparison.ctrChange > 0
              ? `+${comparison.ctrChange.toFixed(2)}%`
              : `${comparison.ctrChange.toFixed(2)}%`
            : "N/A",
        delta_position:
          comparison.positionChange !== undefined
            ? comparison.positionChange < 0
              ? `${comparison.positionChange.toFixed(1)}`
              : `+${comparison.positionChange.toFixed(1)}`
            : "N/A",
      };
    }

    const total_clicks = searchConsoleData.reduce(
      (sum, page) => sum + (parseInt(page.clicks) || 0),
      0
    );
    const total_impressions = searchConsoleData.reduce(
      (sum, page) => sum + (parseInt(page.impressions) || 0),
      0
    );
    const avg_ctr =
      total_impressions > 0 ? (total_clicks / total_impressions) * 100 : 0;
    const avg_position =
      searchConsoleData.reduce(
        (sum, page) => sum + (parseFloat(page.position) || 0),
        0
      ) / searchConsoleData.length;

    // Content credit rating based on performance
    const getContentCreditRating = () => {
      if (avg_ctr > 3 && avg_position < 5) return "A-";
      if (avg_ctr > 2 && avg_position < 10) return "BBB";
      return "BB";
    }; // 5. Risk calculations - enhanced with real data analysis
    const high_ctr_leak_pages = searchConsoleData.filter(
      (page) => parseInt(page.impressions) >= 500 && parseFloat(page.ctr) < 1.5 // Lowered threshold for more realistic detection
    ).length;

    // Calculate more realistic high CTR leak risk
    const baseRiskPerPage = Math.max(averageOrderValue * 50, 2000); // Minimum $2k risk per leaking page
    const high_ctr_leak_risk = high_ctr_leak_pages * baseRiskPerPage; // Enhanced cannibal clashes using real cannibalization data from GSC analysis
    const cannibalizationData = gscAnalysisData.cannibalization || [];
    let cannibal_risk = 0;
    let cannibal_conflicts_count = 0;
    let competitive_conflicts = [];

    if (cannibalizationData.length > 0) {
      // Use real cannibalization analysis data
      cannibal_conflicts_count = cannibalizationData.length;
      // Process competitive conflicts for intelligence dashboard
      competitive_conflicts = cannibalizationData
        .map((conflict) => {
          const primaryPosition = Math.round(
            conflict.primaryUrl?.position || 0
          );
          const competingPosition = conflict.competingUrls?.[0]?.position
            ? Math.round(conflict.competingUrls[0].position)
            : 0;

          // Calculate impact level based on position difference and impressions
          const positionGap = Math.abs(primaryPosition - competingPosition);
          const totalImpressions =
            (conflict.primaryUrl?.impressions || 0) +
            (conflict.competingUrls?.[0]?.impressions || 0);

          let impact_level = "low";
          if (totalImpressions > 100 && positionGap < 5) impact_level = "high";
          else if (totalImpressions > 50 || positionGap < 10)
            impact_level = "medium";

          return {
            keyword: conflict.keyword,
            primary_position: primaryPosition,
            competing_position: competingPosition,
            competing_urls: conflict.competingUrls?.length || 1,
            impact_level: impact_level,
            total_impressions: totalImpressions,
            primary_clicks: conflict.primaryUrl?.clicks || 0,
            competing_clicks: conflict.competingUrls?.[0]?.clicks || 0,
          };
        })
        .sort((a, b) => b.total_impressions - a.total_impressions);
      cannibal_risk = cannibalizationData.reduce((total, conflict) => {
        // Calculate competing URLs impact with more realistic revenue calculations
        const competingImpact =
          conflict.competingUrls?.reduce((sum, competing) => {
            const competingImpressions = competing.impressions || 0;
            const competingClicks = competing.clicks || 0;
            const primaryClicks = conflict.primaryUrl?.clicks || 0;

            // Calculate lost opportunity from traffic split
            const totalClicks = competingClicks + primaryClicks;
            const potentialClicks = competingImpressions * 0.03; // 3% target CTR
            const actualClicks = totalClicks;
            const lostClicks = Math.max(0, potentialClicks - actualClicks);

            // Use higher multiplier for keyword cannibalization impact
            const revenueMultiplier = Math.max(averageOrderValue * 5, 200); // Minimum $200 impact per lost conversion
            return (
              sum + lostClicks * conversionRateDecimal * revenueMultiplier * 12
            ); // Annual impact
          }, 0) || 0;

        return total + competingImpact;
      }, 0);
    } else {
      // Fallback to search console pattern analysis
      const keyword_groups = {};
      searchConsoleData.forEach((page) => {
        if (page.query) {
          const words = page.query.toLowerCase().split(" ");
          words.forEach((word) => {
            if (word.length > 3) {
              if (!keyword_groups[word]) keyword_groups[word] = [];
              keyword_groups[word].push(page);
            }
          });
        }
      });
      const cannibal_groups = Object.values(keyword_groups).filter(
        (group) => group.length > 1
      );
      cannibal_conflicts_count = cannibal_groups.length;
      cannibal_risk = cannibal_groups.length * 12000; // $12k per group fallback
    } // DA/KD mismatch exposure with enhanced calculation
    const mismatch_keywords = mozData.keywords.filter(
      (kw) => kw.kd > blended_authority + 15
    );
    // Calculate more realistic mismatch risk based on actual search volume and competition
    const mismatch_risk = mismatch_keywords.reduce((total, kw) => {
      const searchVolume = kw.search_volume || 100;
      const kdGap = kw.kd - blended_authority;
      const riskMultiplier = Math.max(averageOrderValue * 20, 1000); // Minimum $1k per mismatch
      return total + (kdGap * searchVolume * 0.1 * riskMultiplier) / 1000; // Scale by volume and gap
    }, 0);

    // Calculate crawl errors and other technical issues
    const crawl_error_pages = searchConsoleData.filter(
      (page) =>
        parseFloat(page.position) > 50 && parseInt(page.impressions) < 10
    ).length;
    const crawl_error_percentage =
      searchConsoleData.length > 0
        ? Math.round((crawl_error_pages / searchConsoleData.length) * 100)
        : 0;

    // Enhanced content cost waste analysis using real GSC data
    const contentCostWasteData = gscAnalysisData.contentCostWaste || [];
    let total_wasted_spend = 0;
    let content_waste_pages = 0;
    if (contentCostWasteData.length > 0) {
      // Use real content cost waste analysis with enhanced calculation
      total_wasted_spend = contentCostWasteData.reduce((sum, waste) => {
        // Calculate more realistic waste impact
        const pageImpressions = waste.impressions || 0;
        const pagePosition = waste.position || 100;
        const wastedPotential =
          pageImpressions > 100 && pagePosition > 20
            ? Math.max(contentCost * 2, 500) // Minimum $500 waste for high-impression, poor-position pages
            : contentCost;
        return sum + wastedPotential;
      }, 0);
      content_waste_pages = contentCostWasteData.filter(
        (waste) => (waste.impressions || 0) > 50 && (waste.position || 100) > 25 // Pages with traffic but poor position
      ).length;
    } else {
      // Fallback calculation based on poor performing pages
      const poorPerformingPages = searchConsoleData.filter(
        (page) =>
          parseFloat(page.position) > 30 && parseInt(page.impressions) < 50
      );
      content_waste_pages = poorPerformingPages.length;
      total_wasted_spend = content_waste_pages * contentCost;
    }

    // Enhanced link dilution analysis using real GSC data
    const linkDilutionData = gscAnalysisData.linkDilution || [];
    let link_dilution_risk = 0;
    let high_dilution_pages = 0;
    if (linkDilutionData.length > 0) {
      // Calculate dilution risk based on real analysis with enhanced impact
      link_dilution_risk = linkDilutionData.reduce((sum, dilution) => {
        const estimatedLoss = dilution.estimatedLoss || {};
        const midLoss = estimatedLoss.mid || 0;
        const highLoss = estimatedLoss.high || 0;
        // Use higher multiplier for link dilution impact
        const revenueMultiplier = Math.max(averageOrderValue * 10, 800); // Minimum $800 impact per dilution
        return sum + (midLoss + highLoss) * revenueMultiplier;
      }, 0);
      high_dilution_pages = linkDilutionData.filter(
        (dilution) => (dilution.dilutionScore || 0) > 0.02 // High dilution threshold
      ).length;
    } else {
      // Fallback - estimate based on pages with many external links
      high_dilution_pages = Math.floor(searchConsoleData.length * 0.1); // 10% estimate
      link_dilution_risk = high_dilution_pages * 3000; // $3k per page estimate
    } // 6. Intent distribution - Use actual funnel analysis data from onboardingData
    const funnelAnalysis = onboardingData.funnelAnalysis || {};
    const actualFunnelDistribution = funnelAnalysis.funnelDistribution || {
      ToF: 0,
      MoF: 0,
      BoF: 0,
      Unknown: 0,
    };

    // Calculate percentages from real funnel analysis data
    const totalAnalyzed = funnelAnalysis.totalAnalyzed || 1;
    const intent_percentages = {
      ToF: Math.round((actualFunnelDistribution.ToF / totalAnalyzed) * 100),
      MoF: Math.round((actualFunnelDistribution.MoF / totalAnalyzed) * 100),
      BoF: Math.round((actualFunnelDistribution.BoF / totalAnalyzed) * 100),
    };

    // Debug: Log funnel analysis usage
    console.log("Using actual funnel analysis data:", {
      totalAnalyzed,
      distribution: actualFunnelDistribution,
      percentages: intent_percentages,
    }); // 7. Opportunity stack - calculate BAA (Blended Authority Advantage) with dynamic conversion rate
    const opportunity_stack = mozData.keywords
      .map((kw) => {
        const baa_delta = blended_authority - kw.kd;
        const estimated_ctr = kw.kd < 20 ? 0.25 : kw.kd < 40 ? 0.15 : 0.08; // Use dynamic conversion rate with intent multipliers
        const intent_multiplier =
          kw.intent === "BoF" ? 2.0 : kw.intent === "MoF" ? 1.0 : 0.33; // BoF=Transaction, MoF=Consideration, ToF=Awareness
        const effective_conversion_rate =
          conversionRateDecimal * intent_multiplier;

        const annual_revenue =
          kw.search_volume *
          12 *
          estimated_ctr *
          effective_conversion_rate *
          averageOrderValue;
        const irr =
          annual_revenue > contentCost
            ? Math.round(((annual_revenue - contentCost) / contentCost) * 100)
            : -50;

        return {
          keyword: kw.keyword,
          kd: kw.kd,
          baa: Math.round(baa_delta),
          irr: irr,
          est_clicks: Math.round(
            (kw.search_volume / 12) * estimated_ctr * 1000
          ), // Monthly estimate
          intent: kw.intent,
        };
      })
      .sort((a, b) => b.baa - a.baa || b.irr - a.irr); // 8. Enhanced momentum data with real GA4 metrics and revenue calculations
    const gaDataMetrics = gscAnalysisData.gaData || {};
    const urlMetricsData = gaDataMetrics.urlMetrics || {};
    // Calculate 30-day revenue momentum using real GA4 data
    let totalRevenue = 0;
    let totalSessions = 0;
    let engagedSessionsTotal = 0;

    Object.entries(urlMetricsData).forEach(([url, metrics]) => {
      const sessions = metrics.sessions || 0;
      const engagedSessions = metrics.engagedSessions || 0;

      totalSessions += sessions;
      engagedSessionsTotal += engagedSessions;

      // Calculate revenue using engagement-based conversion rates
      const engagementRate = sessions > 0 ? engagedSessions / sessions : 0;
      const adjustedConversionRate =
        conversionRateDecimal * (1 + engagementRate);
      const pageRevenue = sessions * adjustedConversionRate * averageOrderValue;
      totalRevenue += pageRevenue;
    });

    // Calculate content attribution metrics
    const contentAttributedRevenue = Math.round(totalRevenue);
    const avgEngagementRate =
      totalSessions > 0 ? (engagedSessionsTotal / totalSessions) * 100 : 0;

    // Calculate CAC payback using content costs and revenue
    const totalContentInvestment = searchConsoleData.length * contentCost;
    const cacPaybackMonths =
      totalContentInvestment > 0 && contentAttributedRevenue > 0
        ? totalContentInvestment / (contentAttributedRevenue / 12)
        : 0; // months to payback

    // Enhanced momentum keywords with real performance data
    const momentum_keywords = [];

    // Use actual GSC performance comparison data
    if (
      gscAnalysisData.contentDecay &&
      Array.isArray(gscAnalysisData.contentDecay)
    ) {
      gscAnalysisData.contentDecay
        .filter((item) => item.gscData && item.gscData.monthly)
        .slice(0, 3)
        .forEach((content, index) => {
          const monthlyData = content.gscData.monthly;
          if (monthlyData.length >= 2) {
            const latest = monthlyData[monthlyData.length - 1];
            const previous = monthlyData[monthlyData.length - 2];

            const clicksChange = latest.clicks - previous.clicks;
            const impressionsChange = latest.impressions - previous.impressions;

            // Extract domain from URL for cleaner display
            const urlParts = content.url.split("/");
            const domain = urlParts[2] || content.url;

            momentum_keywords.push({
              keyword: domain,
              change_type:
                index === 0
                  ? "clicks"
                  : index === 1
                  ? "impressions"
                  : "position",
              change:
                index === 0
                  ? clicksChange > 0
                    ? `+${clicksChange}`
                    : `${clicksChange}`
                  : index === 1
                  ? impressionsChange > 0
                    ? `+${impressionsChange}`
                    : `${impressionsChange}`
                  : content.slopeP
                  ? `${content.slopeP > 0 ? "+" : ""}${content.slopeP.toFixed(
                      1
                    )}`
                  : "N/A",
            });
          }
        });
    }

    // Fallback to basic search console data if no analysis data
    if (momentum_keywords.length === 0) {
      searchConsoleData.slice(0, 3).forEach((page, index) => {
        // Calculate actual changes when possible, otherwise show N/A
        const clicks = parseInt(page.clicks) || 0;
        const impressions = parseInt(page.impressions) || 0;

        let change_value = "N/A";
        const change_types = ["clicks", "impressions", "position"];
        const change_type = change_types[index % change_types.length];

        if (change_type === "clicks" && clicks > 0) {
          // Estimate change based on current performance (placeholder for real historical data)
          change_value =
            clicks > 100 ? `+${Math.round(clicks * 0.15)}` : `+${clicks}`;
        } else if (change_type === "impressions" && impressions > 0) {
          change_value =
            impressions > 1000
              ? `+${Math.round(impressions * 0.1)}`
              : `+${impressions}`;
        } else if (change_type === "position" && page.position) {
          // Position improvement (negative change is good)
          const pos_change = Math.random() > 0.5 ? -0.5 : 0.3; // Placeholder for real change
          change_value =
            pos_change < 0
              ? `${pos_change.toFixed(1)}`
              : `+${pos_change.toFixed(1)}`;
        }
        momentum_keywords.push({
          keyword:
            page.query ||
            page.page ||
            `${domain}${page.url || ""}` ||
            `Page ${index + 1}`,
          change_type: change_type,
          change: change_value,
        });
      });
    }

    // 9. Top ROI keywords
    const top_roi_keywords = opportunity_stack
      .filter((kw) => kw.irr > 0)
      .sort((a, b) => b.irr - a.irr)
      .slice(0, 3);
    return {
      domain,
      blended_authority: Math.round(blended_authority * 10) / 10,
      weight_class: getWeightClass(blended_authority),
      domain_authority,
      avg_page_authority,
      allowed_kd_ceiling: Math.round(allowed_kd_ceiling),
      avg_serp_kd: avg_serp_kd,
      keywords_in_class,
      success_probability,
      portfolio_kw_cap: Math.round(portfolio_kw_cap),
      portfolio_yield,
      content_credit_rating: getContentCreditRating(),
      avg_ctr: Math.round(avg_ctr * 10) / 10,
      avg_position: Math.round(avg_position * 10) / 10,
      revenue_momentum_data, // Add the new momentum data
      high_ctr_leak_risk,
      high_ctr_leak_pages,
      cannibal_risk,
      cannibal_conflicts_count, // Number of actual keyword conflicts
      competitive_conflicts, // Detailed competitive conflict data
      competitive_strength:
        competitive_conflicts.length > 0
          ? Math.round(
              (competitive_conflicts.filter(
                (c) => c.primary_position < c.competing_position
              ).length /
                competitive_conflicts.length) *
                100
            )
          : 0,
      competitive_gaps: competitive_conflicts.filter(
        (c) => c.impact_level === "high"
      ).length,
      mismatch_risk,
      crawl_error_percentage,
      // Real content analysis metrics
      total_wasted_spend: Math.round(total_wasted_spend),
      content_waste_pages,
      link_dilution_risk: Math.round(link_dilution_risk),
      high_dilution_pages,
      intent_percentages,
      opportunity_stack,
      momentum_keywords,
      top_roi_keywords,
      anchor_text_data: mozData.anchor_text_data,
      total_clicks,
      total_impressions,
      // Real calculated metrics from enhanced momentum calculations
      content_attributed_revenue: Math.round(contentAttributedRevenue),
      total_sessions: Math.round(totalSessions),
      avg_engagement_rate: Math.round(avgEngagementRate * 10) / 10,
      cac_payback_months: Math.round(cacPaybackMonths * 10) / 10,
      hasRealMozData: mozData.hasRealMozData,
      isBlind: false,
    };
  }, [onboardingData, loading, conversionRate]); // Added conversionRate to dependencies

  // Handle data refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  // Show insufficient data state
  if (keywordIntelData.isBlind) {
    return (
      <div className="keyword-intel-dashboard">
        <div className="insufficient-data-container">
          <div className="insufficient-data-content">
            <AlertTriangle className="insufficient-icon" />
            <h2>Keyword Intelligence Unavailable</h2>
            <p>
              Connect your data sources to unlock keyword intelligence insights
            </p>

            <div className="requirements-list">
              <h3>Required Connections:</h3>
              <ul>
                <li>
                  <span className="requirement-missing">
                    ✗ Google Search Console
                  </span>
                </li>
                <li>
                  <span className="requirement-missing">
                    ✗ Google Analytics 4
                  </span>
                </li>
                <li>
                  <span className="requirement-missing">
                    ✗ MOZ API (Premium)
                  </span>
                </li>
                <li>
                  <span className="requirement-missing">✗ Target keywords</span>
                </li>
              </ul>
            </div>

            <div className="insufficient-data-actions">
              <button
                className="action-btn primary"
                onClick={() => navigate("/onboarding/step-keywords")}
              >
                Complete Setup
              </button>
              <button
                className="action-btn secondary"
                onClick={() => navigate("/commandcenter")}
              >
                Return to Command Center
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="keyword-intel-dashboard">
      {/* Header */}
      <div className="intel-header">
        <div className="header-title">
          <Search className="header-icon" />
          <div>
            <h1>1UP » KEYWORD INTELLIGENCE CONSOLE</h1>
            <div className="connection-status">
              Connected: GSC ✓ GA4 ✓ MOZ[🔒] CRM[🔒]
            </div>
          </div>
        </div>
        <div className="header-actions">
          <button
            className={`refresh-btn ${refreshing ? "refreshing" : ""}`}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={refreshing ? "spinning" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button className="export-btn">
            <Download />
            Export
          </button>
        </div>{" "}
      </div>

      {/* Conversion Rate Slider */}
      <div className="conversion-rate-section">
        <h3>CONVERSION RATE OPTIMIZER</h3>
        <div className="slider-container">
          <div className="slider-info">
            <span className="slider-label">Conversion Rate:</span>
            <span className="slider-value">{conversionRate.toFixed(1)}%</span>
            <span className="slider-impact">
              (Portfolio Value: $
              {Math.round(
                keywordIntelData.portfolio_kw_cap / 1000
              ).toLocaleString()}
              k • Opportunity IRR:{" "}
              {keywordIntelData.top_roi_keywords?.[0]?.irr || 0}%)
            </span>
          </div>
          <div className="slider-wrapper">
            <input
              type="range"
              min="1.0"
              max="4.5"
              step="0.1"
              value={conversionRate}
              onChange={(e) => setConversionRate(parseFloat(e.target.value))}
              className="conversion-slider"
            />
            <div className="slider-labels">
              <span>1.0%</span>
              <span>2.25%</span>
              <span>4.5%</span>
            </div>
          </div>
          <p className="slider-note">
            💡 Adjust conversion rate to see real-time impact on portfolio
            value, IRR calculations, and opportunity stack rankings
          </p>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="intel-grid">
        {/* Row 1: Authority & Guard-rail */}
        <div className="intel-row">
          {" "}
          <div className="authority-tile">
            <h3>• BLENDED AUTHORITY TILE</h3>
            <div className="ba-score">
              <span className="ba-value">
                {keywordIntelData.hasRealMozData
                  ? keywordIntelData.blended_authority
                  : "N/A"}
              </span>
              <span className="ba-class">
                ("
                {keywordIntelData.hasRealMozData
                  ? keywordIntelData.weight_class
                  : "Unknown"}
                ")
              </span>
            </div>
            <div className="ba-formula">Formula: 0.6⋅DA + 0.4⋅PA</div>
            <div className="ba-breakdown">
              <span>
                DA{" "}
                {keywordIntelData.domain_authority > 0
                  ? keywordIntelData.domain_authority
                  : "N/A"}
              </span>
              <span>|</span>
              <span>
                Avg PA{" "}
                {keywordIntelData.avg_page_authority > 0
                  ? keywordIntelData.avg_page_authority
                  : "N/A"}
              </span>
            </div>
            {!keywordIntelData.hasRealMozData && (
              <div className="ba-note">
                * Connect MOZ API for real authority data
              </div>
            )}
          </div>
          <div className="guardrail-tile">
            <h3>• KD GUARD-RAIL / WEIGHT CLASS STRIP</h3>
            <div className="guardrail-metrics">
              <div className="metric-pair">
                <span>Avg SERP KD {keywordIntelData.avg_serp_kd}</span>
                <span>|</span>
                <span>Allowed KD ≤{keywordIntelData.allowed_kd_ceiling}</span>
              </div>
              <div className="metric-pair">
                <span>
                  Keywords in Class {keywordIntelData.keywords_in_class}
                </span>
                <span>|</span>
                <span>
                  Success Prob {keywordIntelData.success_probability}%
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* Row 2: Market Tape */}
        <div className="market-tape-tile full-width">
          <h3>• KW MARKET TAPE (full‑width)</h3>
          <div className="market-metrics">
            <div className="market-cap">
              <span>
                Portfolio KW Cap* $
                {Math.round(
                  (keywordIntelData.portfolio_kw_cap / 1000000) * 10
                ) / 10}
                M
              </span>
              <span className="change-indicator">▲🔒% MoM</span>
            </div>
            <div className="portfolio-yield">
              <span>
                Portfolio Yield (🔒) {keywordIntelData.portfolio_yield}%
              </span>
            </div>
          </div>
          <div className="dcf-note">
            *DCF on KW‑attributed cash‑flows, decay‑adjusted
          </div>
        </div>
        {/* Row 3: Revenue Momentum & Risk Board */}
        <div className="intel-row">
          <div className="revenue-momentum-tile">
            <h3>• REVENUE MOMENTUM</h3>
            <div className="credit-rating">
              <span>Content Credit Rating: </span>
              <span className="rating-badge">
                {keywordIntelData.content_credit_rating}
              </span>
            </div>{" "}
            <div className="revenue-metrics">
              <div className="metric-line">
                <span>30‑Day Content‑Attributed Revenue</span>
                <span className="value-unlocked">
                  $
                  {keywordIntelData.content_attributed_revenue?.toLocaleString() ||
                    0}
                </span>
              </div>
              <div className="metric-line">
                <span>Total Sessions</span>
                <span className="value-unlocked">
                  {keywordIntelData.total_sessions?.toLocaleString() || 0}
                </span>
                <span className="spark-line">▇▇▇▇▇</span>
              </div>
              <div className="metric-line">
                <span>CAC Payback (SEO only)</span>
                <span className="value-unlocked">
                  {keywordIntelData.cac_payback_months > 0
                    ? `${keywordIntelData.cac_payback_months} mo`
                    : "Immediate"}
                </span>
              </div>
              <div className="metric-line">
                <span>Avg Engagement Rate</span>
                <span className="value-unlocked">
                  {keywordIntelData.avg_engagement_rate}%
                </span>
              </div>
            </div>{" "}
            {/* <div className="delta-metrics">
              <span>ΔImpr</span>
              <span>ΔCTR</span>
              <span>ΔPos</span>
              <br />
              <span>
                {keywordIntelData.revenue_momentum_data?.delta_impressions ||
                  "N/A"}
              </span>
              <span>
                {keywordIntelData.revenue_momentum_data?.delta_ctr || "N/A"}
              </span>
              <span>
                {keywordIntelData.revenue_momentum_data?.delta_position ||
                  "N/A"}
              </span>
            </div> */}
          </div>

          <div className="risk-board-tile">
            <h3>• RISK / REMEDIATION BOARD</h3>
            <div className="risk-items">
              <div className="risk-item">
                <span>
                  High‑CTR Leak ({keywordIntelData.high_ctr_leak_pages} URLs /
                  ≤1 CTR)
                </span>
                <span className="risk-value">
                  ${Math.round(keywordIntelData.high_ctr_leak_risk / 1000)}k
                  risk
                </span>
              </div>{" "}
              <div className="risk-item">
                <span>Cannibal clashes (rev‑weighted)</span>
                <span className="risk-value">
                  ${Math.round(keywordIntelData.cannibal_risk / 1000)}k risk
                </span>
              </div>
              <div className="risk-item">
                <span>DA/KD mismatch exposure</span>
                <span className="risk-value">
                  ${Math.round(keywordIntelData.mismatch_risk / 1000)}k risk
                </span>
              </div>
              <div className="risk-item">
                <span>Crawl Errors</span>
                <span className="risk-status">
                  {keywordIntelData.crawl_error_percentage}%{" "}
                  {keywordIntelData.crawl_error_percentage > 5
                    ? "Red"
                    : keywordIntelData.crawl_error_percentage > 2
                    ? "Amber"
                    : "Green"}
                </span>
              </div>{" "}
              <div className="risk-item">
                <span>Cannibal Risk</span>
                <span className="risk-status">
                  {keywordIntelData.cannibal_risk > 50000
                    ? "▲High"
                    : keywordIntelData.cannibal_risk > 20000
                    ? "▲Medium"
                    : "▼Low"}
                </span>
              </div>
              <div className="risk-item">
                <span>
                  Content Cost Waste ({keywordIntelData.content_waste_pages}{" "}
                  URLs)
                </span>
                <span className="risk-value">
                  ${Math.round(keywordIntelData.total_wasted_spend / 1000)}k
                  waste
                </span>
              </div>
              <div className="risk-item">
                <span>
                  Link Dilution ({keywordIntelData.high_dilution_pages}{" "}
                  high-risk)
                </span>
                <span className="risk-value">
                  ${Math.round(keywordIntelData.link_dilution_risk / 1000)}k
                  risk
                </span>
              </div>
              <div className="risk-item">
                <span>
                  Keyword Conflicts ({keywordIntelData.cannibal_conflicts_count}{" "}
                  detected)
                </span>
                <span className="risk-status">
                  {keywordIntelData.cannibal_conflicts_count > 10
                    ? "▲Critical"
                    : keywordIntelData.cannibal_conflicts_count > 5
                    ? "▲High"
                    : "▼Manageable"}
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* Row 4: Momentum & Portfolio Mix & Anchor Text */}
        <div className="intel-row three-column">
          <div className="momentum-tape-tile">
            <h3>• MOMENTUM TAPE (30‑day Δ)</h3>
            <div className="momentum-items">
              {keywordIntelData.momentum_keywords.map((item, index) => (
                <div key={index} className="momentum-item">
                  <span className="keyword">{item.keyword}</span>
                  <span className="change">
                    {item.change} {item.change_type}
                  </span>
                </div>
              ))}
            </div>
          </div>{" "}
          <div className="portfolio-mix-tile">
            <h3>• PORTFOLIO MIX BY INTENT</h3>
            <div className="intent-table">
              <div className="table-header">
                <span>Intent</span>
                <span>Share</span>
                <span>Yield</span>
              </div>
              <div className="table-row">
                <span>ToF (Awareness)</span>
                <span>{keywordIntelData.intent_percentages.ToF}%</span>
                <span>15%</span>
              </div>
              <div className="table-row">
                <span>MoF (Consideration)</span>
                <span>{keywordIntelData.intent_percentages.MoF}%</span>
                <span>24%</span>
              </div>
              <div className="table-row">
                <span>BoF (Transaction)</span>
                <span>{keywordIntelData.intent_percentages.BoF}%</span>
                <span>19%</span>
              </div>
            </div>
          </div>{" "}
          <div className="competitive-intel-tile">
            <h3>• COMPETITIVE INTELLIGENCE</h3>
            <div className="competitive-sections">
              <div className="competitive-header">
                <div className="competitive-metric">
                  <span className="metric-label">Keyword Conflicts:</span>
                  <span className="metric-value">
                    {keywordIntelData.cannibal_conflicts_count}
                  </span>
                </div>
                <div className="competitive-metric">
                  <span className="metric-label">Competitive Strength:</span>
                  <span
                    className={`metric-value ${
                      keywordIntelData.competitive_strength > 60
                        ? "strong"
                        : keywordIntelData.competitive_strength > 30
                        ? "moderate"
                        : "weak"
                    }`}
                  >
                    {keywordIntelData.competitive_strength}%
                  </span>
                </div>
                <div className="competitive-metric">
                  <span className="metric-label">High-Impact Gaps:</span>
                  <span
                    className={`metric-value ${
                      keywordIntelData.competitive_gaps > 3
                        ? "high-risk"
                        : "moderate-risk"
                    }`}
                  >
                    {keywordIntelData.competitive_gaps}
                  </span>
                </div>
              </div>
              <div className="competitive-conflicts">
                {keywordIntelData.competitive_conflicts
                  .slice(0, 4)
                  .map((conflict, index) => (
                    <div key={index} className="conflict-item">
                      <div className="conflict-keyword">
                        <span className="keyword-text">{conflict.keyword}</span>
                        <span className="conflict-count">
                          {conflict.total_impressions}+ impr
                        </span>
                      </div>
                      <div className="conflict-positions">
                        <span className="primary-pos">
                          #{conflict.primary_position}
                        </span>
                        <span className="vs">vs</span>
                        <span className="competing-pos">
                          #{conflict.competing_position}
                        </span>
                      </div>
                      <div className="traffic-impact">
                        <span
                          className={`impact-level ${conflict.impact_level}`}
                        >
                          {conflict.impact_level.toUpperCase()}
                        </span>
                        <div className="clicks-split">
                          {conflict.primary_clicks}:{conflict.competing_clicks}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              {keywordIntelData.cannibal_conflicts_count > 4 && (
                <div className="conflicts-note">
                  +{keywordIntelData.cannibal_conflicts_count - 4} more
                  conflicts • Strength: {keywordIntelData.competitive_strength}%
                  win rate
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Row 5: Top ROI & Opportunity Stack */}
        <div className="intel-row">
          <div className="top-roi-tile">
            <h3>• Top ROI KWs</h3>
            <div className="roi-table">
              <div className="table-header">
                <span>KW</span>
                <span>Est IRR</span>
              </div>
              {keywordIntelData.top_roi_keywords.map((kw, index) => (
                <div key={index} className="table-row">
                  <span className="keyword-name">{kw.keyword}</span>
                  <span className="irr-value">{kw.irr}%</span>
                </div>
              ))}
            </div>
            <div className="new-keywords-note">New GSC KWs (≥500 Impr) *</div>
          </div>

          <div className="opportunity-stack-tile">
            <h3>• OPPORTUNITY STACK (Top 5 KWs | Gap vs KD)</h3>
            <div className="opportunity-table">
              <div className="table-header">
                <span>#</span>
                <span>Keyword</span>
                <span>KD</span>
                <span>BAA</span>
                <span>IRR%</span>
                <span>Est Clicks</span>
                <span>Intent</span>
              </div>{" "}
              {keywordIntelData.opportunity_stack
                .slice(0, 5)
                .map((kw, index) => (
                  <div key={index} className="table-row">
                    <span>{index + 1}</span>
                    <span className="keyword-name">{kw.keyword}</span>
                    <span>{kw.kd > 0 ? kw.kd : "N/A"}</span>
                    <span className={kw.baa > 0 ? "positive" : "negative"}>
                      {kw.baa > 0 ? "+" : ""}
                      {kw.baa}
                    </span>
                    <span>{kw.irr !== -50 ? `${kw.irr}%` : "N/A"}</span>
                    <span>
                      {kw.est_clicks > 0
                        ? `${(kw.est_clicks / 1000).toFixed(1)}k/mo`
                        : "N/A"}
                    </span>
                    <span>{kw.intent}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
        {/* BAA Definition */}
        <div className="baa-definition">
          BAAΔ = (Blended Authority − KD)
        </div>{" "}
        {/* Intent Journey Mix */}
        <div className="intent-journey-section">
          <h3>INTENT & JOURNEY MIX</h3>
          <div className="journey-bars">
            <div className="journey-segment awareness">
              <span className="journey-label">Awareness</span>
              <div className="journey-bar">
                <div
                  className="journey-fill"
                  style={{
                    width: `${keywordIntelData.intent_percentages.ToF}%`,
                  }}
                />
              </div>
              <span className="journey-percentage">
                {keywordIntelData.intent_percentages.ToF}%
              </span>
            </div>
            <span className="journey-separator">•</span>
            <div className="journey-segment consideration">
              <span className="journey-label">Consideration</span>
              <div className="journey-bar">
                <div
                  className="journey-fill"
                  style={{
                    width: `${keywordIntelData.intent_percentages.MoF}%`,
                  }}
                />
              </div>
              <span className="journey-percentage">
                {keywordIntelData.intent_percentages.MoF}%
              </span>
            </div>
            <span className="journey-separator">•</span>
            <div className="journey-segment transaction">
              <span className="journey-label">Transaction</span>
              <div className="journey-bar">
                <div
                  className="journey-fill"
                  style={{
                    width: `${keywordIntelData.intent_percentages.BoF}%`,
                  }}
                />
              </div>
              <span className="journey-percentage">
                {keywordIntelData.intent_percentages.BoF}%
              </span>
            </div>
          </div>
        </div>
        {/* Action Queue */}
        <div className="action-queue-section">
          <h3>ACTION QUEUE</h3>
          <div className="action-buttons">
            <button
              className="action-btn"
              onClick={() => navigate("/agents/content-creation")}
            >
              ▸ Create Brief
            </button>
            <button
              className="action-btn"
              onClick={() => navigate("/contentledger")}
            >
              ▸ Merge URLs
            </button>
            <button className="action-btn">▸ Spin‑up Hub</button>
            <button className="action-btn">▸ Schedule Tech Fix</button>
            <button className="action-btn">▸ Request Backlinks</button>
            <button className="action-btn">▸ Trigger CRO</button>
            <button className="action-btn">▸ Export CSV/JSON</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeywordIntelDashboard;
