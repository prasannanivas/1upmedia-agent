import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../../context/OnboardingContext";
import { useFinancialCalculations } from "../../context/FinancialCalculations";
import { Search, AlertTriangle, RefreshCw, Download } from "lucide-react";
import { executeCalculationsForDashboard } from "../../utils/calculationMapping";
import FinancialTooltip from "../../components/FinancialTooltip";
import { getTooltipContent } from "../../utils/tooltipContent";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tooltip,
  TextField,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ButtonGroup,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  LinearProgress,
  Grid,
  CircularProgress,
} from "@mui/material";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
} from "recharts";
import { Info as InfoIcon, Close as CloseIcon } from "@mui/icons-material";
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
  const navigate = useNavigate(); // Import individual risk metric functions from FinancialCalculations
  const {
    getMismatchRisk,
    getLinkDilutionRisk,
    getCannibalRisk,
    getCrawlErrorPercentage,
    getTotalWastedSpend,
    getContentWastePages,
    getMoodyCreditScore,
    getHighCTRLeak,
    getKeywordMetrics,
    getRevenueLeak,
  } = useFinancialCalculations();

  const [keywordData, setKeywordData] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    riskLevel: "all",
    minOppScore: 60,
    pathSearch: "",
  });
  const [visibleColumns, setVisibleColumns] = useState({
    url: true,
    KD_enh: true,
    BA: true,
    EfficiencyRatio: true,
    OpportunityScore: true,
    RiskLevel: true,
    SKV: true,
    TopLineValue: true,
    estLossMid: true,
    sessions: true,
    CTR: true,
    engagementRate: true,
    dilutionScore: true,
  });

  useEffect(() => {
    const billaData = getKeywordMetrics();
    console.log("Billa:", billaData);
    setKeywordData(billaData);
  }, [getKeywordMetrics]);

  const [refreshing, setRefreshing] = useState(false);
  const [portfolioExpanded, setPortfolioExpanded] = useState(false); // State to control portfolio expansion

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

    // Get centralized calculations for Keyword Intel
    const centralizedMetrics = executeCalculationsForDashboard(
      "keywordIntel",
      onboardingData
    );

    // 1. Calculate Blended Authority (BA Score) using centralized calculation
    const domain_authority = mozData.domain_authority;
    const avg_page_authority = mozData.avg_page_authority;
    const blended_authority = centralizedMetrics.blendedAuthority
      ? centralizedMetrics.blendedAuthority.calculate
        ? centralizedMetrics.blendedAuthority.calculate(
            domain_authority,
            avg_page_authority
          )
        : 0.6 * domain_authority + 0.4 * avg_page_authority
      : 0.6 * domain_authority + 0.4 * avg_page_authority; // Weight class determination
    const getWeightClass = (ba) => {
      if (ba >= 70) return "Heavyweight";
      if (ba >= 50) return "Middleweight";
      if (ba >= 30) return "Lightweight";
      return "Featherweight";
    };

    // Calculate average keyword difficulty from mozData keywords
    const avgKD =
      mozData.keywords.length > 0
        ? mozData.keywords.reduce((sum, kw) => sum + kw.kd, 0) /
          mozData.keywords.length
        : 30; // Default fallback

    // 2. Calculate Efficiency Ratio using centralized calculation
    const efficiency_ratio = centralizedMetrics.efficiencyRatio
      ? centralizedMetrics.efficiencyRatio.calculate
        ? centralizedMetrics.efficiencyRatio.calculate(domain_authority, avgKD)
        : domain_authority / Math.max(avgKD, 1)
      : domain_authority / Math.max(avgKD, 1); // 2. KD Guard-rail calculations - handle cases with no KD data
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

    // Get total website investment for percentage calculations (same as other dashboards)
    const totalInvestment =
      onboardingData?.domainCostDetails?.totalInvested || 10000;

    // Apply conversion rate multiplier to dollar calculations (lower conversion = higher losses)
    const conversionMultiplier = 4.5 / conversionRate; // Inverse: 2% = 2.25x, 4.5% = 1x, 1% = 4.5x

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
      ) / searchConsoleData.length; // Content credit rating using FinancialCalculations function
    const getContentCreditRating = () => {
      console.log(
        "🎯 KeywordIntel: Getting Moody's Credit Score from FinancialCalculations"
      );
      const creditScore = getMoodyCreditScore();

      return creditScore?.summary?.creditRating || "N/A";
    };

    // ===============================================
    // INDIVIDUAL RISK CALCULATIONS FROM FINANCIAL FUNCTIONS
    // ===============================================
    console.log(
      "🎯 KeywordIntel: Starting individual risk function calculations..."
    );

    // High CTR Leak using FinancialCalculations
    let high_ctr_leak_risk = 0;
    let high_ctr_leak_pages = 0;
    try {
      console.log(
        "🎯 KeywordIntel: Getting High CTR Leak from FinancialCalculations"
      );
      const ctrLeakResult = getHighCTRLeak();
      console.log("✅ KeywordIntel: High CTR Leak result:", ctrLeakResult);
      high_ctr_leak_risk = ctrLeakResult?.estimatedRevenueLoss || 0;
      high_ctr_leak_pages = ctrLeakResult?.urlsBelowThreshold || 0;
    } catch (error) {
      console.error("❌ KeywordIntel: Error getting High CTR Leak:", error);
      // Fallback calculation
      high_ctr_leak_pages = searchConsoleData.filter(
        (page) =>
          parseInt(page.impressions) >= 500 && parseFloat(page.ctr) < 1.5
      ).length;
      const highCtrLeakPercentage =
        searchConsoleData.length > 0
          ? (high_ctr_leak_pages / searchConsoleData.length) * 0.15
          : 0;
      high_ctr_leak_risk =
        totalInvestment * highCtrLeakPercentage * conversionMultiplier;
      high_ctr_leak_risk = Math.min(high_ctr_leak_risk, totalInvestment * 0.2);
    }

    // DA/KD mismatch exposure using FinancialCalculations
    let mismatch_risk = 0;
    try {
      console.log(
        "🎯 KeywordIntel: Getting Mismatch Risk from FinancialCalculations"
      );
      const mismatchResult = getMismatchRisk();
      console.log("✅ KeywordIntel: Mismatch Risk result:", mismatchResult);
      mismatch_risk = mismatchResult?.summary?.totalRevenueLoss || 0;
    } catch (error) {
      console.error("❌ KeywordIntel: Error getting Mismatch Risk:", error);
      // Fallback calculation
      const mismatch_keywords = mozData.keywords.filter(
        (kw) => kw.kd > blended_authority + 15
      );
      mismatch_risk = mismatch_keywords.reduce((total, kw) => {
        const mismatchPercentage = 0.02;
        return (
          total + totalInvestment * mismatchPercentage * conversionMultiplier
        );
      }, 0);
      mismatch_risk = Math.min(mismatch_risk, totalInvestment * 0.25);
    }

    // Crawl error percentage using FinancialCalculations
    let crawl_error_percentage = 0;
    try {
      console.log(
        "🎯 KeywordIntel: Getting Crawl Error Percentage from FinancialCalculations"
      );
      const crawlErrorResult = getCrawlErrorPercentage();
      console.log(
        "✅ KeywordIntel: Crawl Error Percentage result:",
        crawlErrorResult
      );
      crawl_error_percentage = crawlErrorResult?.summary?.errorPercentage || 0;
    } catch (error) {
      console.error(
        "❌ KeywordIntel: Error getting Crawl Error Percentage:",
        error
      );
      // Fallback calculation
      const crawl_error_pages = searchConsoleData.filter(
        (page) =>
          parseFloat(page.position) > 50 && parseInt(page.impressions) < 10
      ).length;
      crawl_error_percentage =
        searchConsoleData.length > 0
          ? Math.round((crawl_error_pages / searchConsoleData.length) * 100)
          : 0;
    } // Content cost waste using getRevenueLeak function
    let total_wasted_spend = 0;
    let content_waste_pages = 0;
    try {
      console.log(
        "🎯 KeywordIntel: Getting Revenue Leak (Content Cost Waste) from FinancialCalculations"
      );
      const revenueLeakResult = getRevenueLeak({});
      console.log("✅ KeywordIntel: Revenue Leak result:", revenueLeakResult);
      total_wasted_spend = Math.abs(
        revenueLeakResult?.estimatedRevenueLoss || 0
      );
      content_waste_pages = revenueLeakResult?.urlsBelowThreshold || 0;
    } catch (error) {
      console.error(
        "❌ KeywordIntel: Error getting Content Waste metrics:",
        error
      );
      // Fallback calculation
      const contentCostWasteData = gscAnalysisData.contentCostWaste || [];
      if (contentCostWasteData.length > 0) {
        const wastePercentage =
          contentCostWasteData.length > 0
            ? (contentCostWasteData.filter(
                (waste) =>
                  (waste.impressions || 0) > 50 && (waste.position || 100) > 25
              ).length /
                contentCostWasteData.length) *
              0.25
            : 0;
        total_wasted_spend =
          totalInvestment * wastePercentage * conversionMultiplier;
        content_waste_pages = contentCostWasteData.filter(
          (waste) =>
            (waste.impressions || 0) > 50 && (waste.position || 100) > 25
        ).length;
      } else {
        const poorPerformingPages = searchConsoleData.filter(
          (page) =>
            parseFloat(page.position) > 30 && parseInt(page.impressions) < 50
        );
        content_waste_pages = poorPerformingPages.length;
        const wastePercentage =
          searchConsoleData.length > 0
            ? (poorPerformingPages.length / searchConsoleData.length) * 0.25
            : 0;
        total_wasted_spend =
          totalInvestment * wastePercentage * conversionMultiplier;
      }
      total_wasted_spend = Math.min(total_wasted_spend, totalInvestment * 0.3);
    }

    // Link dilution risk using FinancialCalculations
    let link_dilution_risk = 0;
    let high_dilution_pages = 0;
    try {
      console.log(
        "🎯 KeywordIntel: Getting Link Dilution Risk from FinancialCalculations"
      );
      const linkDilutionResult = getLinkDilutionRisk();
      console.log(
        "✅ KeywordIntel: Link Dilution Risk result:",
        linkDilutionResult
      );
      link_dilution_risk = linkDilutionResult?.summary?.totalRevenueLoss || 0;
      high_dilution_pages = linkDilutionResult?.summary?.urlsWithDilution || 0;
    } catch (error) {
      console.error(
        "❌ KeywordIntel: Error getting Link Dilution Risk:",
        error
      );
      // Fallback calculation
      const linkDilutionData = gscAnalysisData.linkDilution || [];
      if (linkDilutionData.length > 0) {
        high_dilution_pages = linkDilutionData.filter(
          (dilution) => (dilution.dilutionScore || 0) > 0.02
        ).length;
        const linkDilutionPercentage =
          linkDilutionData.length > 0
            ? (high_dilution_pages / linkDilutionData.length) * 0.12
            : 0;
        link_dilution_risk =
          totalInvestment * linkDilutionPercentage * conversionMultiplier;
      } else {
        high_dilution_pages = Math.floor(searchConsoleData.length * 0.1);
        const linkDilutionPercentage =
          searchConsoleData.length > 0
            ? (high_dilution_pages / searchConsoleData.length) * 0.12
            : 0;
        link_dilution_risk =
          totalInvestment * linkDilutionPercentage * conversionMultiplier;
      }
      link_dilution_risk = Math.min(link_dilution_risk, totalInvestment * 0.18);
    }

    // Cannibal risk using FinancialCalculations
    let cannibal_risk = 0;
    let cannibal_conflicts_count = 0;
    let competitive_conflicts = [];
    try {
      console.log(
        "🎯 KeywordIntel: Getting Cannibal Risk from FinancialCalculations"
      );
      const cannibalResult = getCannibalRisk();
      console.log("✅ KeywordIntel: Cannibal Risk result:", cannibalResult);
      cannibal_risk = cannibalResult?.summary?.totalRevenueLoss || 0;
      cannibal_conflicts_count =
        cannibalResult?.summary?.cannibalConflicts || 0;

      // Extract competitive conflicts for display using correct structure
      competitive_conflicts =
        cannibalResult?.conflictDetails?.slice(0, 10)?.map((conflict) => {
          // Determine impact level based on impressions and competing count
          let impact_level = "low";
          const totalImpressions =
            conflict.primaryImpressions +
            (conflict.totalCompetingImpressions || 0);
          if (totalImpressions > 500 && conflict.competingCount > 2) {
            impact_level = "high";
          } else if (totalImpressions > 100 || conflict.competingCount > 1) {
            impact_level = "medium";
          }

          return {
            keyword: conflict.keyword || "Unknown",
            primary_position: 0, // Not available in current structure
            competing_position: 0, // Not available in current structure
            competing_urls: conflict.competingCount || 1,
            impact_level: impact_level,
            total_impressions: totalImpressions,
            primary_clicks: conflict.currentClicks || 0,
            competing_clicks: 0, // Included in currentClicks
            revenue_loss: conflict.estimatedRevenueLoss || 0,
          };
        }) || [];

      // If we have very few conflicts detected, supplement with keyword analysis
      if (competitive_conflicts.length < 3) {
        console.log(
          "🔍 KeywordIntel: Supplementing with keyword overlap analysis..."
        );

        // Analyze search console data for potential keyword conflicts
        const keywordGroups = {};
        searchConsoleData.forEach((page) => {
          if (page.query && page.query.length > 3) {
            const query = page.query.toLowerCase().trim();
            const words = query.split(" ").filter((word) => word.length > 3);

            words.forEach((word) => {
              if (!keywordGroups[word]) keywordGroups[word] = [];
              keywordGroups[word].push({
                query: page.query,
                url: page.page || page.url || "Unknown",
                impressions: parseInt(page.impressions) || 0,
                clicks: parseInt(page.clicks) || 0,
                position: parseFloat(page.position) || 100,
              });
            });
          }
        }); // Find keyword groups with multiple competing pages (more conservative)
        Object.entries(keywordGroups).forEach(([keyword, pages]) => {
          if (
            pages.length > 2 &&
            competitive_conflicts.length < 8 &&
            keyword.length > 4
          ) {
            const totalImpressions = pages.reduce(
              (sum, p) => sum + p.impressions,
              0
            );
            const totalClicks = pages.reduce((sum, p) => sum + p.clicks, 0);

            // Much more conservative thresholds - only include significant conflicts
            if (totalImpressions > 500 && pages.length > 2) {
              let impact_level = "low";
              if (totalImpressions > 5000 && pages.length > 4) {
                impact_level = "high";
              } else if (totalImpressions > 2000 && pages.length > 3) {
                impact_level = "medium";
              } // Get best and worst positions for this keyword group
              const positions = pages
                .map((p) => p.position)
                .filter((p) => p && p < 100);
              const bestPosition =
                positions.length > 0 ? Math.min(...positions) : 0;
              const worstPosition =
                positions.length > 0 ? Math.max(...positions) : 0;

              competitive_conflicts.push({
                keyword: keyword,
                primary_position: Math.round(bestPosition),
                competing_position: Math.round(worstPosition),
                competing_urls: pages.length,
                impact_level: impact_level,
                total_impressions: totalImpressions,
                primary_clicks: totalClicks,
                competing_clicks: 0,
                revenue_loss: Math.round(totalImpressions * 0.005 * 75 * 0.02), // More conservative estimate
              });
            }
          }
        });

        // Sort by impact
        competitive_conflicts.sort((a, b) => {
          const impactOrder = { high: 3, medium: 2, low: 1 };
          return (
            (impactOrder[b.impact_level] || 0) -
              (impactOrder[a.impact_level] || 0) ||
            b.total_impressions - a.total_impressions
          );
        });
        console.log(
          `✅ KeywordIntel: Added ${competitive_conflicts.length} competitive conflicts from GSC keyword overlap analysis (not real cannibalization data)`
        );
      }

      // Update conflicts count to include supplemented data
      cannibal_conflicts_count = Math.max(
        cannibal_conflicts_count,
        competitive_conflicts.length
      );
    } catch (error) {
      console.error("❌ KeywordIntel: Error getting Cannibal Risk:", error);
      // Fallback calculation - same as before
      const cannibalizationData = gscAnalysisData.cannibalization || [];
      if (cannibalizationData.length > 0) {
        cannibal_conflicts_count = cannibalizationData.length;
        competitive_conflicts = cannibalizationData
          .map((conflict) => {
            const primaryPosition = Math.round(
              conflict.primaryUrl?.position || 0
            );
            const competingPosition = conflict.competingUrls?.[0]?.position
              ? Math.round(conflict.competingUrls[0].position)
              : 0;
            const positionGap = Math.abs(primaryPosition - competingPosition);
            const totalImpressions =
              (conflict.primaryUrl?.impressions || 0) +
              (conflict.competingUrls?.[0]?.impressions || 0);
            let impact_level = "low";
            if (totalImpressions > 100 && positionGap < 5)
              impact_level = "high";
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
          const competingCount = conflict.competingUrls?.length || 0;
          const cannibalizationPercentage =
            competingCount > 1 ? 0.00005 : 0.00002;
          return total + totalInvestment * cannibalizationPercentage;
        }, 0);
        cannibal_risk = Math.min(cannibal_risk, totalInvestment * 0.15);
      } else {
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
        cannibal_risk = cannibal_groups.length * (totalInvestment * 0.00005);
        cannibal_risk = Math.min(cannibal_risk, totalInvestment * 0.1);
      }
    }

    console.log(
      "✅ KeywordIntel: All individual risk calculations completed:",
      {
        mismatch_risk,
        crawl_error_percentage,
        total_wasted_spend,
        content_waste_pages,
        link_dilution_risk,
        high_dilution_pages,
        cannibal_risk,
        cannibal_conflicts_count,
      }
    );

    // ===============================================
    // CONTINUE WITH EXISTING CALCULATIONS
    // ===============================================// 6. Intent distribution - Use actual funnel analysis data from onboardingData
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
      .sort((a, b) => b.baa - a.baa || b.irr - a.irr);

    // 8. Enhanced momentum data with real GA4 metrics and revenue calculations
    console.log(
      "🎯 KeywordIntel: Processing GA data for momentum calculations"
    );
    const gaDataMetrics = gscAnalysisData.gaData || {};
    console.log("✅ KeywordIntel: GA data structure:", gaDataMetrics);

    // Use correct GA data structure from sample data
    const gaSummary = gaDataMetrics.insights?.summary || {};
    const gaUrlAnalysis = gaDataMetrics.insights?.urlAnalysis || [];

    console.log("✅ KeywordIntel: GA Summary:", gaSummary);
    console.log(
      "✅ KeywordIntel: GA URL Analysis count:",
      gaUrlAnalysis.length
    );

    // Calculate 30-day revenue momentum using real GA4 data
    let totalRevenue = gaSummary.estimatedTotalRevenue || 0;
    let totalSessions = gaSummary.totalSessions || 0;
    let avgEngagementRate = gaSummary.overallEngagementRate || 0;
    let engagedSessionsTotal = totalSessions * avgEngagementRate;

    // If no summary data, calculate from URL analysis
    if (!totalSessions && gaUrlAnalysis.length > 0) {
      totalSessions = gaUrlAnalysis.reduce(
        (sum, urlData) => sum + (urlData.sessions || 0),
        0
      );
      engagedSessionsTotal = gaUrlAnalysis.reduce(
        (sum, urlData) =>
          sum + (urlData.sessions || 0) * (urlData.engagementRate || 0),
        0
      );
      avgEngagementRate =
        totalSessions > 0 ? engagedSessionsTotal / totalSessions : 0;

      // Calculate revenue from URL data if not in summary
      if (!totalRevenue) {
        totalRevenue = gaUrlAnalysis.reduce((sum, urlData) => {
          const sessions = urlData.sessions || 0;
          const engagementRate = urlData.engagementRate || 0;
          const adjustedConversionRate =
            conversionRateDecimal * (1 + engagementRate);
          return sum + sessions * adjustedConversionRate * averageOrderValue;
        }, 0);
      }
    }
    console.log("✅ KeywordIntel: Final GA metrics:", {
      totalRevenue,
      totalSessions,
      avgEngagementRate,
      engagedSessionsTotal,
    }); // Calculate conservative content-attributed revenue using clicks-based approach
    // This follows the same methodology as risk calculations to avoid unrealistic values

    // Ultra-conservative revenue attribution based on actual clicks and realistic conversion rates
    // Use actual clicks from GSC data with conservative conversion rate
    const actualTotalClicks = total_clicks; // Already calculated above
    const conservativeConversionRate = conversionRateDecimal; // Use the user's conversion rate setting

    // Calculate conservative attributed revenue: clicks * conversion rate * AOV
    const clicksBasedRevenue =
      actualTotalClicks * conservativeConversionRate * averageOrderValue;

    // Cap at maximum of 30% of total investment to prevent unrealistic values
    const maxReasonableRevenue = totalInvestment * 0.3; // Max 30% of investment

    const conservativeAttributedRevenue = Math.min(
      clicksBasedRevenue,
      maxReasonableRevenue,
      totalRevenue * 0.05 // Or 5% of calculated GA revenue, whichever is lowest
    );

    const contentAttributedRevenue = Math.round(conservativeAttributedRevenue);
    console.log("🎯 KeywordIntel: Conservative revenue attribution:", {
      originalGARevenue: Math.round(totalRevenue).toLocaleString(),
      totalInvestment: totalInvestment.toLocaleString(),
      actualTotalClicks: actualTotalClicks.toLocaleString(),
      clicksBasedRevenue: Math.round(clicksBasedRevenue).toLocaleString(),
      maxReasonableRevenue: Math.round(maxReasonableRevenue).toLocaleString(),
      conservativeAttributedRevenue: Math.round(
        conservativeAttributedRevenue
      ).toLocaleString(),
      finalContentAttributedRevenue: contentAttributedRevenue.toLocaleString(),
    });
    // avgEngagementRate already calculated above with GA data

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
      Array.isArray(gscAnalysisData.contentDecay?.decay30Days)
    ) {
      gscAnalysisData.contentDecay?.decay30Days
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
      efficiency_ratio: Math.round(efficiency_ratio * 10) / 10, // Add efficiency ratio
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
      // Real content analysis metrics using getRevenueLeak function
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
  }, [
    onboardingData,
    loading,
    conversionRate,
    getMismatchRisk,
    getLinkDilutionRisk,
    getCannibalRisk,
    getCrawlErrorPercentage,
    getTotalWastedSpend,
    getContentWastePages,
    getMoodyCreditScore,
    getHighCTRLeak,
    getRevenueLeak,
  ]); // Added individual risk functions to dependencies

  // Helper functions for data formatting
  const formatMoney = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatDecimal = (value, decimals = 1) => {
    return Number(value).toFixed(decimals);
  };

  // Calculate KPI summary metrics
  const calculateSummaryMetrics = useMemo(() => {
    if (!keywordData || !keywordData.data) return null;

    const data = keywordData.data;

    // Portfolio GPV
    const portfolioGPV = keywordData.gpv || 0;

    // Total URLs
    const totalUrls = data.length;

    // Average Efficiency Ratio
    const avgEfficiencyRatio =
      data.reduce((sum, item) => sum + (item.EfficiencyRatio || 0), 0) /
      totalUrls;

    // High Risk Pages
    const highRiskPages = data.filter(
      (item) => item.RiskLevel === "High" || item.RiskLevel === "Critical"
    ).length;

    // Estimated Mid Loss
    const totalEstLossMid = data.reduce(
      (sum, item) => sum + (item.estLossMid || 0),
      0
    );

    return {
      portfolioGPV,
      totalUrls,
      avgEfficiencyRatio,
      highRiskPages,
      totalEstLossMid,
    };
  }, [keywordData]);

  // Filter data based on user selections
  const filteredData = useMemo(() => {
    if (!keywordData || !keywordData.data) return [];

    return keywordData.data.filter((item) => {
      // Risk level filter
      if (filters.riskLevel !== "all" && item.RiskLevel !== filters.riskLevel) {
        return false;
      }

      // Min opportunity score filter
      if (item.OpportunityScore < filters.minOppScore) {
        return false;
      }

      // URL path search filter
      if (
        filters.pathSearch &&
        !item.url.toLowerCase().includes(filters.pathSearch.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }, [keywordData, filters, loading]);

  // Handle row click for modal display
  const handleRowClick = (row) => {
    setSelectedRow(row);
    setModalOpen(true);
  };

  // Handle column visibility toggle
  const handleColumnToggle = (column) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  // Function to determine row styling based on conditions
  const getRowStyle = (row) => {
    if (row.RiskLevel === "Critical") {
      return { backgroundColor: "#ffebee" }; // light red
    }
    if (row.OpportunityScore >= 80 && row.EfficiencyRatio > 1.2) {
      return { backgroundColor: "#e8f5e9" }; // light green for "quick wins"
    }
    return {};
  };

  // Get risk level color for chips and visualization
  const getRiskLevelColor = (riskLevel) => {
    switch (riskLevel) {
      case "Critical":
        return "#d32f2f"; // red
      case "High":
        return "#f57c00"; // orange
      case "Medium":
        return "#ffa000"; // amber/yellow
      case "Low":
      default:
        return "#757575"; // grey
    }
  };

  // Function to render efficiency ratio with color coding
  const renderEfficiencyRatio = (value) => {
    let color = "#757575"; // default gray
    if (value > 1.2) {
      color = "#4caf50"; // green
    } else if (value >= 0.8) {
      color = "#ffa000"; // yellow/amber
    } else {
      color = "#d32f2f"; // red
    }

    return (
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Typography variant="body2">{formatDecimal(value, 1)}</Typography>
        <Box
          sx={{
            ml: 1,
            width: 40,
            height: 6,
            backgroundColor: color,
            borderRadius: 3,
          }}
        />
      </Box>
    );
  };

  // Render the Summary Ribbon (KPI cards)
  const renderSummaryRibbon = () => {
    if (!calculateSummaryMetrics) return null;

    const metrics = calculateSummaryMetrics;

    return (
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={3}>
          {/* Portfolio GPV */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Card elevation={2}>
              <CardContent>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  gutterBottom
                >
                  Portfolio GPV
                </Typography>
                <Typography variant="h6" component="div" fontWeight="bold">
                  {formatMoney(metrics?.portfolioGPV)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  What the site is worth right now
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Total URLs */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Card elevation={2}>
              <CardContent>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  gutterBottom
                >
                  Total URLs
                </Typography>
                <Typography variant="h6" component="div" fontWeight="bold">
                  {metrics.totalUrls}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Scale indicator
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Avg Efficiency Ratio */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Card elevation={2}>
              <CardContent>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  gutterBottom
                >
                  Avg Efficiency Ratio
                </Typography>
                <Typography variant="h6" component="div" fontWeight="bold">
                  {formatDecimal(metrics.avgEfficiencyRatio, 2)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Authority leverage
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* High-Risk Pages */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Card elevation={2}>
              <CardContent>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  gutterBottom
                >
                  High-Risk Pages
                </Typography>
                <Typography
                  variant="h6"
                  component="div"
                  fontWeight="bold"
                  color="error.main"
                >
                  {metrics.highRiskPages}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Immediate attention needed
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Est. Mid-Loss ($) */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Card elevation={2}>
              <CardContent>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  gutterBottom
                >
                  Est. Mid-Loss ($)
                </Typography>
                <Typography
                  variant="h6"
                  component="div"
                  fontWeight="bold"
                  color="error.main"
                >
                  {formatMoney(metrics.totalEstLossMid)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Dollar cost of missed potential
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // Render the filters section
  const renderFilters = () => {
    return (
      <Box sx={{ mb: 3, p: 2, backgroundColor: "#f5f5f5", borderRadius: 1 }}>
        <Grid container spacing={3} alignItems="center">
          {/* Risk Level Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <ButtonGroup variant="outlined" size="small" fullWidth>
              <Button
                color={filters.riskLevel === "all" ? "primary" : "inherit"}
                onClick={() => handleFilterChange("riskLevel", "all")}
              >
                All
              </Button>
              <Button
                color={filters.riskLevel === "Low" ? "primary" : "inherit"}
                onClick={() => handleFilterChange("riskLevel", "Low")}
              >
                Low
              </Button>
              <Button
                color={filters.riskLevel === "Medium" ? "primary" : "inherit"}
                onClick={() => handleFilterChange("riskLevel", "Medium")}
              >
                Medium
              </Button>
              <Button
                color={filters.riskLevel === "High" ? "primary" : "inherit"}
                onClick={() => handleFilterChange("riskLevel", "High")}
              >
                High
              </Button>
              <Button
                color={filters.riskLevel === "Critical" ? "primary" : "inherit"}
                onClick={() => handleFilterChange("riskLevel", "Critical")}
              >
                Critical
              </Button>
            </ButtonGroup>
          </Grid>

          {/* Min Opportunity Score Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" gutterBottom>
              Min Opportunity Score: {filters.minOppScore}
            </Typography>
            <Slider
              value={filters.minOppScore}
              onChange={(_, value) => handleFilterChange("minOppScore", value)}
              min={0}
              max={100}
              valueLabelDisplay="auto"
            />
          </Grid>

          {/* URL Path Search */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="URL Path Contains"
              variant="outlined"
              size="small"
              fullWidth
              value={filters.pathSearch}
              onChange={(e) => handleFilterChange("pathSearch", e.target.value)}
            />
          </Grid>

          {/* Column Visibility */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl variant="outlined" size="small" fullWidth>
              <InputLabel>Toggle Columns</InputLabel>
              <Select
                multiple
                label="Toggle Columns"
                value={Object.keys(visibleColumns).filter(
                  (key) => visibleColumns[key]
                )}
                onChange={(e) => {
                  const selectedColumns = e.target.value;
                  const newVisibleColumns = {};
                  Object.keys(visibleColumns).forEach((key) => {
                    newVisibleColumns[key] = selectedColumns.includes(key);
                  });
                  setVisibleColumns(newVisibleColumns);
                }}
                renderValue={(selected) => selected.join(", ")}
              >
                {Object.keys(visibleColumns).map((column) => (
                  <MenuItem key={column} value={column}>
                    {column}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // Render the data table
  const renderDataTable = () => {
    if (!filteredData || filteredData.length === 0)
      return (
        <Typography variant="body1" align="center" py={3}>
          No data available. Try adjusting your filters.
        </Typography>
      );

    return (
      <TableContainer component={Paper} elevation={2} sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {visibleColumns.url && <TableCell>URL</TableCell>}
              {visibleColumns.KD_enh && <TableCell>KD-enh</TableCell>}
              {visibleColumns.BA && <TableCell>BA</TableCell>}
              {visibleColumns.EfficiencyRatio && <TableCell>ER</TableCell>}
              {visibleColumns.OpportunityScore && (
                <TableCell>Opp-Score</TableCell>
              )}
              {visibleColumns.RiskLevel && <TableCell>Risk</TableCell>}
              {visibleColumns.SKV && <TableCell>SKV ($)</TableCell>}
              {visibleColumns.TopLineValue && (
                <TableCell>TopLine ($)</TableCell>
              )}
              {visibleColumns.estLossMid && (
                <TableCell>Est Loss Mid ($)</TableCell>
              )}
              {visibleColumns.sessions && <TableCell>Sessions</TableCell>}
              {visibleColumns.CTR && <TableCell>CTR</TableCell>}
              {visibleColumns.engagementRate && <TableCell>EngRate</TableCell>}
              {visibleColumns.dilutionScore && (
                <TableCell>DilutionScore</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.map((row, index) => (
              <TableRow
                key={index}
                onClick={() => handleRowClick(row)}
                hover
                style={getRowStyle(row)}
                sx={{ cursor: "pointer" }}
              >
                {visibleColumns.url && (
                  <TableCell>
                    <Tooltip title={row.url}>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {row.url}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                )}
                {visibleColumns.KD_enh && (
                  <TableCell>{formatDecimal(row.KD_enh, 1)}</TableCell>
                )}
                {visibleColumns.BA && <TableCell>{row.BA}</TableCell>}
                {visibleColumns.EfficiencyRatio && (
                  <TableCell>
                    {renderEfficiencyRatio(row.EfficiencyRatio)}
                  </TableCell>
                )}
                {visibleColumns.OpportunityScore && (
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        {row.OpportunityScore}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={row.OpportunityScore}
                        sx={{ width: 50, height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  </TableCell>
                )}
                {visibleColumns.RiskLevel && (
                  <TableCell>
                    <Chip
                      label={row.RiskLevel}
                      size="small"
                      sx={{
                        backgroundColor: getRiskLevelColor(row.RiskLevel),
                        color: row.RiskLevel === "Low" ? "white" : undefined,
                      }}
                    />
                  </TableCell>
                )}
                {visibleColumns.SKV && (
                  <TableCell>{formatMoney(row.SKV)}</TableCell>
                )}
                {visibleColumns.TopLineValue && (
                  <TableCell>{formatMoney(row.TopLineValue)}</TableCell>
                )}
                {visibleColumns.estLossMid && (
                  <TableCell sx={{ color: "#d32f2f" }}>
                    {formatMoney(row.estLossMid)}
                  </TableCell>
                )}
                {visibleColumns.sessions && (
                  <TableCell>{row.sessions}</TableCell>
                )}
                {visibleColumns.CTR && (
                  <TableCell>{formatPercent(row.CTR)}</TableCell>
                )}
                {visibleColumns.engagementRate && (
                  <TableCell>{formatPercent(row.engagementRate)}</TableCell>
                )}
                {visibleColumns.dilutionScore && (
                  <TableCell sx={{ color: "#757575" }}>
                    {row.dilutionScore.toFixed(4)}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // Render the data visualization charts
  const renderVisualizations = () => {
    if (!keywordData || !keywordData.data || keywordData.data.length === 0)
      return null;

    // Prepare data for risk distribution chart
    const riskDistribution = {
      Low: 0,
      Medium: 0,
      High: 0,
      Critical: 0,
    };

    keywordData.data.forEach((item) => {
      if (item.RiskLevel) {
        riskDistribution[item.RiskLevel]++;
      }
    });

    const riskDistData = Object.keys(riskDistribution).map((key) => ({
      name: key,
      value: riskDistribution[key],
      color: getRiskLevelColor(key),
    }));

    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Scatter Chart */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Opportunity vs Competitiveness
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
              <ScatterChart
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="CompetitivenessIndex"
                  name="Competitiveness Index"
                  domain={[0, "dataMax"]}
                  label={{ value: "Competitiveness Index", position: "bottom" }}
                />
                <YAxis
                  type="number"
                  dataKey="OpportunityScore"
                  name="Opportunity Score"
                  domain={[0, 100]}
                  label={{
                    value: "Opportunity Score",
                    angle: -90,
                    position: "left",
                  }}
                />
                <RechartsTooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  formatter={(value, name) => [value, name]}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <Paper elevation={3} sx={{ p: 1 }}>
                          <Typography variant="caption" display="block">
                            URL: {data.url}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Opportunity: {data.OpportunityScore}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Competitiveness:{" "}
                            {formatDecimal(data.CompetitivenessIndex, 2)}
                          </Typography>
                          <Typography variant="caption" display="block">
                            SKV: {formatMoney(data.SKV)}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Risk: {data.RiskLevel}
                          </Typography>
                        </Paper>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name="Pages" data={keywordData.data} fill="#8884d8">
                  {keywordData.data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getRiskLevelColor(entry.RiskLevel)}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Risk Distribution Bar Chart */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Risk Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={riskDistData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" scale="band" />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="value" name="Pages">
                  {riskDistData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  // Render the detail modal when a row is clicked
  const renderDetailModal = () => {
    if (!selectedRow) return null;

    return (
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Page Details
          <IconButton
            onClick={() => setModalOpen(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle1" gutterBottom>
            {selectedRow.url}
          </Typography>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={4}>
              <Paper elevation={1} sx={{ p: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Risk Level
                </Typography>
                <Typography variant="body1">{selectedRow.RiskLevel}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper elevation={1} sx={{ p: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Opportunity Score
                </Typography>
                <Typography variant="body1">
                  {selectedRow.OpportunityScore}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper elevation={1} sx={{ p: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Efficiency Ratio
                </Typography>
                <Typography variant="body1">
                  {formatDecimal(selectedRow.EfficiencyRatio, 2)}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
            Key Metrics
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Metric</TableCell>
                  <TableCell align="right">Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Keyword Difficulty</TableCell>
                  <TableCell align="right">
                    {formatDecimal(selectedRow.KD_enh, 1)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Blended Authority</TableCell>
                  <TableCell align="right">{selectedRow.BA}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>SKV</TableCell>
                  <TableCell align="right">
                    {formatMoney(selectedRow.SKV)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>TopLine Value</TableCell>
                  <TableCell align="right">
                    {formatMoney(selectedRow.TopLineValue)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Estimated Loss (Mid)</TableCell>
                  <TableCell align="right" sx={{ color: "#d32f2f" }}>
                    {formatMoney(selectedRow.estLossMid)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Sessions</TableCell>
                  <TableCell align="right">{selectedRow.sessions}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>CTR</TableCell>
                  <TableCell align="right">
                    {formatPercent(selectedRow.CTR)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Engagement Rate</TableCell>
                  <TableCell align="right">
                    {formatPercent(selectedRow.engagementRate)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Dilution Score</TableCell>
                  <TableCell align="right">
                    {selectedRow.dilutionScore.toFixed(4)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {/* Additional keyword information would go here if available */}
          <Typography variant="subtitle2" gutterBottom>
            Recommendations
          </Typography>
          <Typography variant="body2">
            {selectedRow.RiskLevel === "High" ||
            selectedRow.RiskLevel === "Critical"
              ? "Prioritize this page for content refresh and optimization"
              : "Monitor and maintain the current page performance"}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Close</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setModalOpen(false);
              // Handle export or further action
            }}
          >
            Export Details
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
  // Handle data refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="keyword-intel-dashboard">
        <CircularProgress />
      </div>
    );
  }

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
      {/* <div className="conversion-rate-section">
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
      </div> */}

      {/* Main Dashboard Grid */}
      <div className="intel-grid">
        {/* Row 2: Market Tape */}
        <div className="market-tape-tile full-width">
          <h3>• KW MARKET TAPE</h3>
          <div className="market-metrics">
            <div className="market-cap">
              <span>
                Portfolio KW Cap* $
                {Math.round(calculateSummaryMetrics?.portfolioGPV / 1000000, 2)}
                M
                <Button
                  size="small"
                  onClick={() => setPortfolioExpanded(!portfolioExpanded)}
                  sx={{ ml: 1, minWidth: "auto", p: "2px 8px" }}
                >
                  {portfolioExpanded ? "▲ Collapse" : "▼ Expand"}
                </Button>
              </span>
              <span className="change-indicator">▲🔒% MoM</span>
            </div>
            <div className="portfolio-yield">
              <span>
                Portfolio Yield (🔒) {keywordIntelData.portfolio_yield}%
              </span>
            </div>

            {keywordData && (
              <div
                className="portfolio-analysis-section"
                style={{ marginTop: "20px" }}
              >
                {/* Always show summary ribbon with GPV metrics */}
                {renderSummaryRibbon()}
              </div>
            )}
          </div>
          <div className="dcf-note">
            Value derived from a discounted‑cash‑flow model on
            keyword‑attributed cash flows, further adjusted for expected ranking
            decay.
          </div>
        </div>
        {/* New modern dashboard UI based on the "billa" data */}
        <div className="new-dashboard-ui">
          {portfolioExpanded && keywordData && (
            <>
              <Typography variant="h5" gutterBottom>
                Content Portfolio Analysis
              </Typography>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Data snapshot:{" "}
                {keywordData?.snapshot ||
                  new Date().toISOString().split("T")[0]}
              </Typography>

              {/* Filters */}
              {renderFilters()}

              {/* Data Visualizations */}
              {renderVisualizations()}

              {/* Main Data Table */}
              {renderDataTable()}
            </>
          )}

          {/* Detail Modal */}
          {renderDetailModal()}
        </div>
        {/* Row 1: Authority & Guard-rail */}
        <div className="intel-row">
          {" "}
          <div className="authority-tile">
            <h3>
              • BLENDED AUTHORITY TILE
              <FinancialTooltip
                title={getTooltipContent("blendedAuthority").title}
                content={getTooltipContent("blendedAuthority").content}
                position="top"
              />
            </h3>
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
            <h3>
              • KD GUARD-RAIL / WEIGHT CLASS STRIP
              <FinancialTooltip
                title={getTooltipContent("keywordEfficiency").title}
                content={getTooltipContent("keywordEfficiency").content}
                position="top"
              />
            </h3>
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
