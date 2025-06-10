import { useMemo } from "react";
import { useOnboarding } from "../context/OnboardingContext";
import {
  getFinancialDefaults,
  calculateContentWaste,
  calculateContentDecay,
  calculateCannibalization,
  calculateLinkDilution,
  calculateROI,
} from "../utils/financialCalculations";

/**
 * Custom hook to calculate dynamic Content P&L metrics
 * Uses real data from onboarding context and SEO analysis with standardized calculations
 */
export const useContentPnL = () => {
  const { onboardingData, loading } = useOnboarding();
  const pnlMetrics = useMemo(() => {
    // Extract data from onboarding context
    const {
      domainCostDetails = {},
      GSCAnalysisData = {},
      funnelAnalysis = {},
    } = onboardingData;

    // Get standardized financial defaults
    const { averageOrderValue, contentCost: averageContentCost } =
      getFinancialDefaults(onboardingData); // Calculate content investment from SEO analysis data
    const contentCostWaste = GSCAnalysisData?.contentCostWaste || [];
    const contentDecay = GSCAnalysisData?.contentDecay?.decay30Days || [];
    const cannibalization = GSCAnalysisData?.cannibalization || [];
    const linkDilution = GSCAnalysisData?.linkDilution || [];

    // Check if we have real data
    const hasRealData =
      Array.isArray(contentCostWaste) && contentCostWaste.length > 0;

    // Total Content Investment calculation using standardized approach
    const totalContentInvestment = hasRealData
      ? contentCostWaste.reduce((sum, item) => sum + (item.contentCost || 0), 0)
      : Math.max(averageContentCost * 15, 8500); // Fallback with minimum realistic value

    // Estimated Revenue Impact calculation
    const estimatedRevenueImpact = hasRealData
      ? contentCostWaste.reduce(
          (sum, item) => sum + (item.estimatedMonthlyRevenue || 0),
          0
        )
      : totalContentInvestment * 0.35; // Fallback 35% conversion rate

    // ROI calculation using standardized approach
    const roi = calculateROI(estimatedRevenueImpact, totalContentInvestment);

    // Revenue leak calculations using standardized approaches
    const contentCostWasteAmount = calculateContentWaste(
      { ...onboardingData, GSCAnalysisData },
      contentCostWaste
    );

    const contentDecayLoss = calculateContentDecay(
      { ...onboardingData, GSCAnalysisData },
      contentDecay
    );

    const keywordEfficiencyGap = calculateCannibalization(
      { ...onboardingData, GSCAnalysisData },
      cannibalization
    );

    // Funnel gaps calculation
    const funnelGaps = funnelAnalysis?.funnelDistribution
      ? Object.entries(funnelAnalysis.funnelDistribution).filter(
          ([stage, count]) => stage !== "Unknown" && count === 0
        ).length
      : Math.floor(Math.random() * 8) + 3; // Random between 3-10 for demo

    // Psychographic mismatch from funnel analysis
    const psychographicMismatch = funnelAnalysis?.psychCompositeSummary?.overall
      ?.emotionalResonance
      ? Math.max(
          0,
          100 - funnelAnalysis.psychCompositeSummary.overall.emotionalResonance
        )
      : Math.floor(Math.random() * 25) + 10; // Random between 10-35% for demo

    // Link dilution calculation using standardized approach
    const linkDilutionAmount = calculateLinkDilution(
      { ...onboardingData, GSCAnalysisData },
      linkDilution
    );

    // Status checks for integrations
    const hasCRMConnected = false; // This would come from actual CRM integration
    const hasAttributionPixel = false; // This would come from actual pixel setup

    return {
      totalContentInvestment: Math.round(totalContentInvestment),
      estimatedRevenueImpact: Math.round(estimatedRevenueImpact),
      roi: parseFloat(roi.toFixed(2)),
      verifiedAttribution: hasCRMConnected
        ? "✅ Active"
        : "🔒 Inactive (Connect CRM)",
      attributionPixel: hasAttributionPixel
        ? "✅ Installed"
        : "🔒 Not Installed",
      revenueLeak: {
        contentCostWaste: Math.round(contentCostWasteAmount),
        contentDecayLoss: Math.round(contentDecayLoss),
        keywordEfficiencyGap: Math.round(keywordEfficiencyGap),
        funnelGaps: funnelGaps,
        psychographicMismatch: Math.round(psychographicMismatch),
        linkDilution: Math.round(linkDilutionAmount),
      },
      hasRealData,
      isLoading: loading,
    };
  }, [onboardingData, loading]);

  return pnlMetrics;
};
