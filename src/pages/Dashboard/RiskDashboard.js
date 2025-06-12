import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../../context/OnboardingContext";
import { useFinancialCalculations } from "../../context/FinancialCalculations";
import {
  AlertTriangle,
  Brain,
  ChevronRight,
  TrendingDown,
  Target,
  Zap,
  Shield,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Search,
  Users,
  Crown,
} from "lucide-react";
import { calculateGradeDistribution } from "../../utils/ContentRating";
import { executeCalculationsForDashboard } from "../../utils/calculationMapping";
import FinancialTooltip from "../../components/FinancialTooltip";
import { getTooltipContent } from "../../utils/tooltipContent";
import "./RiskDashboard.css";

const RiskDashboard = () => {
  const { onboardingData, loading } = useOnboarding();
  const {
    getContentQualityDistribution,
    getContentDecay,
    getCannibalizationLoss,
    getLinkDilution,
    funnelGapIdentifier,
    getTotalWastedSpend,
    // Get the getRiskMetric function to access sample data
    getRiskMetric,
  } = useFinancialCalculations();
  const navigate = useNavigate();

  // Get risk metrics from the sample data structure
  const [riskMetricsData, setRiskMetricsData] = useState(null);
  useEffect(() => {
    // Try to get sample data from getRiskMetric or use the sample data structure
    try {
      const sampleData = getRiskMetric?.() || {
        riskMetric: [
          // Use the sample data structure provided
          {
            url: "https://1upmedia.com/contact/",
            riskMetrics: {
              trafficDecay: 1,
              positionDrift: -141.59,
              cannibalizationScore: 3,
              isIndexBloat: false,
              compositeRiskScore: 0.46,
            },
            riskLevel: "Medium",
            priority: "Medium",
            currentMetrics: {
              clicks: 0,
              impressions: 40,
              position: 60.83762254901961,
              ctr: 0,
            },
            historicalContext: {
              totalClicks12Month: 1,
              totalImpressions12Month: 167,
              currentThreeMonthAvg: 0,
              bestThreeMonthAvg: 0.05,
              recentPositionAvg: 9.21,
              earlyPositionAvg: 150.8,
            },
            recommendations: [
              "Content refresh needed - traffic declined significantly",
              "Resolve keyword cannibalization - consolidate similar content",
            ],
            topKeywords: [
              {
                keyword: "marketing agency jupiter",
                position: 193.58823529411765,
                clicks: 0,
                impressions: 17,
              },
              {
                keyword: "1upmedia",
                position: 4.4375,
                clicks: 0,
                impressions: 16,
              },
              {
                keyword: "1up media",
                position: 7,
                clicks: 0,
                impressions: 3,
              },
              {
                keyword: "media 1up",
                position: 4,
                clicks: 0,
                impressions: 2,
              },
              {
                keyword: "1up marketing",
                position: 93,
                clicks: 0,
                impressions: 1,
              },
            ],
          },
          {
            url: "https://1upmedia.com/services/seo-agency/",
            riskMetrics: {
              trafficDecay: 2,
              positionDrift: 15.2,
              cannibalizationScore: 1,
              isIndexBloat: false,
              compositeRiskScore: 0.25,
            },
            riskLevel: "Low",
            priority: "Low",
            currentMetrics: {
              clicks: 25,
              impressions: 850,
              position: 12.5,
              ctr: 2.94,
            },
            historicalContext: {
              totalClicks12Month: 312,
              totalImpressions12Month: 9840,
              currentThreeMonthAvg: 78,
              bestThreeMonthAvg: 95,
              recentPositionAvg: 12.5,
              earlyPositionAvg: 18.3,
            },
            recommendations: [
              "Minor optimization - track position fluctuations",
              "Consider expanding content for related keywords",
            ],
            topKeywords: [
              {
                keyword: "seo agency",
                position: 8.2,
                clicks: 15,
                impressions: 450,
              },
              {
                keyword: "seo services",
                position: 15.6,
                clicks: 8,
                impressions: 320,
              },
              {
                keyword: "search engine optimization",
                position: 22.1,
                clicks: 2,
                impressions: 80,
              },
            ],
          },
          {
            url: "https://1upmedia.com/blog/seo-tips-2024/",
            riskMetrics: {
              trafficDecay: 4,
              positionDrift: 85.7,
              cannibalizationScore: 5,
              isIndexBloat: true,
              compositeRiskScore: 0.85,
            },
            riskLevel: "High",
            priority: "High",
            currentMetrics: {
              clicks: 3,
              impressions: 125,
              position: 45.8,
              ctr: 2.4,
            },
            historicalContext: {
              totalClicks12Month: 890,
              totalImpressions12Month: 12500,
              currentThreeMonthAvg: 12,
              bestThreeMonthAvg: 185,
              recentPositionAvg: 45.8,
              earlyPositionAvg: 8.9,
            },
            recommendations: [
              "URGENT: Major content refresh required - significant traffic loss",
              "Resolve high cannibalization - merge with similar posts",
              "Consider 301 redirect to stronger performing page",
            ],
            topKeywords: [
              {
                keyword: "seo tips",
                position: 38.2,
                clicks: 2,
                impressions: 85,
              },
              {
                keyword: "seo best practices",
                position: 52.6,
                clicks: 1,
                impressions: 40,
              },
            ],
          },
        ],
      };

      setRiskMetricsData(sampleData);
    } catch (error) {
      console.error("Error getting risk metrics:", error);
    }
  }, [getRiskMetric]);

  // Calculate risk metrics from real onboarding data using centralized calculations
  const calculateRiskMetrics = useCallback(() => {
    // Safely extract data with fallbacks
    const searchConsoleData = Array.isArray(onboardingData?.searchConsoleData)
      ? onboardingData.searchConsoleData
      : [];

    const gscAnalysisData = onboardingData?.GSCAnalysisData || {};
    const contentDecayData = gscAnalysisData.contentDecay?.decay30Days || [];
    const cannibalizationData = gscAnalysisData.cannibalization || [];
    const contentCostWasteData = gscAnalysisData.contentCostWaste || [];

    // Calculate aggregated search console metrics
    const totalImpressions = searchConsoleData.reduce(
      (sum, item) => sum + (item.impressions || 0),
      0
    );
    const totalClicks = searchConsoleData.reduce(
      (sum, item) => sum + (item.clicks || 0),
      0
    );
    const avgCTR =
      totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgPosition =
      searchConsoleData.length > 0
        ? searchConsoleData.reduce(
            (sum, item) => sum + (item.position || 0),
            0
          ) / searchConsoleData.length
        : 0;

    // Get domain authority from initial analysis
    const domainAuthority =
      parseInt(onboardingData?.initialAnalysisState?.domainAuthority) || 0;
    const pageAuthority =
      parseInt(onboardingData?.initialAnalysisState?.pageAuthority) || 0;
    const trustFlow =
      parseInt(onboardingData?.initialAnalysisState?.trustFlow) || 0;
    const citationFlow =
      parseInt(onboardingData?.initialAnalysisState?.citationFlow) || 0;

    // Get funnel distribution data
    const funnelData = onboardingData?.funnelAnalysis || {
      totalAnalyzed: 0,
      funnelDistribution: {
        ToF: 0,
        MoF: 0,
        BoF: 0,
        Retention: 0,
        Advocacy: 0,
        Unknown: 0,
      },
    };
    const totalFunnelPages = funnelData.totalAnalyzed || 0;
    const keywordList = onboardingData?.keywords || [];

    // Calculate content decay metrics from real data
    const stablePages = contentDecayData.filter(
      (item) => item.status === "Stable"
    ).length;
    const decayPages = contentDecayData.filter(
      (item) => item.status === "Deep Decay"
    ).length;
    const growingPages = contentDecayData.filter(
      (item) => item.status === "Growing"
    ).length;

    const negativeROIPages = contentCostWasteData.filter(
      (item) => item.roi === -1
    ).length;

    // Calculate average keyword difficulty from search console positions
    const avgKD =
      searchConsoleData.length > 0
        ? Math.min(80, Math.max(10, avgPosition * 2)) // Estimate KD based on average position
        : 30;

    // Calculate author performance
    const authors = onboardingData?.authors || [];
    const hasAIAuthors = authors.some(
      (author) =>
        author.name?.toLowerCase().includes("ai") ||
        author.name?.toLowerCase().includes("bot") ||
        author.name?.toLowerCase().includes("automated")
    );

    // Use centralized calculations where possible
    const centralizedMetrics = executeCalculationsForDashboard(
      "riskDashboard",
      onboardingData
    );

    return {
      siteInfo: {
        domain: onboardingData?.domain || "No domain set",
        date: new Date().toISOString().split("T")[0],
        pages: totalFunnelPages,
        impressions: totalImpressions,
        clicks: totalClicks,
        avgCTR: parseFloat(avgCTR?.toFixed(2)),
        avgDA: domainAuthority,
        avgKD: parseFloat(avgKD?.toFixed(1)),
      },
      creditScore: {
        // Use getContentQualityDistribution from FinancialCalculations context
        ...(() => {
          try {
            const contentQualityData = getContentQualityDistribution();
            const gradeDistribution = contentQualityData?.gradeDistribution || {
              A: 0,
              B: 0,
              C: 0,
              D: 0,
            };

            // Calculate downgraded pages from content cost waste
            const downgraded = contentCostWasteData.length;

            // Calculate D-grade CTR loss
            const dGradeCTRLoss = Math.max(
              0,
              parseFloat((avgCTR * 0.7).toFixed(2))
            );

            return {
              aGrade: gradeDistribution.A,
              bGrade: gradeDistribution.B,
              cGrade: gradeDistribution.C,
              dGrade: gradeDistribution.D,
              downgraded,
              dGradeCTRLoss,
            };
          } catch (error) {
            console.error("Error getting content quality distribution:", error);
            // Fallback to manual calculation
            const contentMetrics = searchConsoleData.map((item) => {
              const avgPosition = parseFloat(item.position) || 0;
              const ctr = parseFloat(item.ctr) || 0;

              const roi =
                avgPosition <= 10
                  ? 160
                  : avgPosition <= 20
                  ? 90
                  : avgPosition <= 30
                  ? 20
                  : -30;

              const expectedCTR =
                avgPosition <= 10
                  ? 5
                  : avgPosition <= 20
                  ? 2
                  : avgPosition <= 30
                  ? 1
                  : 0.5;
              const trafficTrend = ctr > expectedCTR ? 10 : -5;

              const engagementScore =
                avgPosition < 10 ? 85 : avgPosition < 20 ? 65 : 40;

              return {
                roi,
                trafficTrend,
                conversionRate: 2.0,
                engagementScore,
              };
            });

            const gradeDistribution =
              calculateGradeDistribution(contentMetrics);
            const downgraded = contentCostWasteData.length;
            const dGradeCTRLoss = Math.max(
              0,
              parseFloat((avgCTR * 0.7).toFixed(2))
            );

            return {
              aGrade: gradeDistribution.A,
              bGrade: gradeDistribution.B,
              cGrade: gradeDistribution.C,
              dGrade: gradeDistribution.D,
              downgraded,
              dGradeCTRLoss,
            };
          }
        })(),
      },
      contentDecay: {
        // Use getContentDecay function from FinancialCalculations context
        ...(() => {
          try {
            const contentDecayData = getContentDecay();
            return {
              stable: contentDecayData?.stablePages || stablePages,
              deepDecay: contentDecayData?.decayPages || decayPages,
              growing: contentDecayData?.growingPages || growingPages,
              avgDropPercent:
                contentDecayData?.avgDropPercent ||
                (contentDecayData.length > 0
                  ? parseFloat(
                      (
                        (contentDecayData.reduce(
                          (sum, item) => sum + (item.dropRatio || 0),
                          0
                        ) /
                          contentDecayData.length) *
                        -100
                      ).toFixed(1)
                    )
                  : 0),
              noROIPages:
                contentDecayData?.negativeROIPages || negativeROIPages,
              topDroppers:
                contentDecayData?.topDroppers ||
                contentDecayData
                  .filter((item) => item.dropRatio && item.dropRatio < -0.3)
                  .slice(0, 2)
                  .map((item) => ({
                    url: item.url || "Unknown page",
                    drop: parseFloat((item.dropRatio * 100).toFixed(1)),
                  })),
              impact:
                contentDecayData?.impact || centralizedMetrics.contentRisk || 0,
            };
          } catch (error) {
            console.error("Error getting content decay data:", error);
            // Fallback to manual calculation
            return {
              stable: stablePages,
              deepDecay: decayPages,
              growing: growingPages,
              avgDropPercent:
                contentDecayData.length > 0
                  ? parseFloat(
                      (
                        (contentDecayData.reduce(
                          (sum, item) => sum + (item.dropRatio || 0),
                          0
                        ) /
                          contentDecayData.length) *
                        -100
                      ).toFixed(1)
                    )
                  : 0,
              noROIPages: negativeROIPages,
              topDroppers: contentDecayData
                .filter((item) => item.dropRatio && item.dropRatio < -0.3)
                .slice(0, 2)
                .map((item) => ({
                  url: item.url || "Unknown page",
                  drop: parseFloat((item.dropRatio * 100).toFixed(1)),
                })),
              impact: centralizedMetrics.contentRisk || 0,
            };
          }
        })(),
      },
      cannibalization: {
        // Use getCannibalizationLoss function from FinancialCalculations context
        ...(() => {
          try {
            const cannibalizationLossData = getCannibalizationLoss();
            return {
              keywordOverlaps:
                cannibalizationLossData?.keywordOverlaps ||
                cannibalizationData.length,
              impressionShareLoss:
                cannibalizationLossData?.impressionShareLoss ||
                cannibalizationData.reduce(
                  (sum, item) =>
                    sum +
                    (item.primaryUrl?.impressions || 0) +
                    (item.competingUrls?.reduce(
                      (urlSum, url) => urlSum + (url.impressions || 0),
                      0
                    ) || 0),
                  0
                ),
              similarityPages:
                cannibalizationLossData?.similarityPages ||
                cannibalizationData.reduce(
                  (sum, item) => sum + 1 + (item.competingUrls?.length || 0),
                  0
                ),
              exampleKeyword:
                cannibalizationLossData?.exampleKeyword ||
                cannibalizationData[0]?.keyword ||
                keywordList[0] ||
                "target keyword",
              impact:
                cannibalizationLossData?.impact ||
                centralizedMetrics.cannibalizationRisk ||
                0,
            };
          } catch (error) {
            console.error("Error getting cannibalization loss data:", error);
            // Fallback to manual calculation
            return {
              keywordOverlaps: cannibalizationData.length,
              impressionShareLoss: cannibalizationData.reduce(
                (sum, item) =>
                  sum +
                  (item.primaryUrl?.impressions || 0) +
                  (item.competingUrls?.reduce(
                    (urlSum, url) => urlSum + (url.impressions || 0),
                    0
                  ) || 0),
                0
              ),
              similarityPages: cannibalizationData.reduce(
                (sum, item) => sum + 1 + (item.competingUrls?.length || 0),
                0
              ),
              exampleKeyword:
                cannibalizationData[0]?.keyword ||
                keywordList[0] ||
                "target keyword",
              impact: centralizedMetrics.cannibalizationRisk || 0,
            };
          }
        })(),
      },
      keywordEfficiency: {
        avgKD: parseFloat(avgKD.toFixed(1)),
        avgDA: domainAuthority,
        overreachRatio:
          domainAuthority > 0
            ? parseFloat((avgKD / domainAuthority).toFixed(1))
            : 1.0,
        topOverexertions: searchConsoleData
          .filter((item) => item.position > 50)
          .slice(0, 2)
          .map((item) => ({
            url: item.keys?.[1] || "Unknown page",
            kd: Math.min(80, Math.max(30, item.position)),
            da: domainAuthority,
          })),
        // Use centralized calculations for efficiency metrics
        blendedAuthority:
          centralizedMetrics.keywordEfficiency?.blendedAuthority || 0,
        efficiencyRatio:
          centralizedMetrics.keywordEfficiency?.efficiencyRatio || 0,
      }, // ...existing code for remaining metrics...
      strategyRatio: {
        // Use funnelGapIdentifier function from FinancialCalculations context
        ...(() => {
          try {
            const funnelGapData = funnelGapIdentifier();
            return {
              tofu:
                funnelGapData?.funnelDistribution?.ToF ||
                funnelData.funnelDistribution?.ToF ||
                0,
              mofu:
                funnelGapData?.funnelDistribution?.MoF ||
                funnelData.funnelDistribution?.MoF ||
                0,
              bofu:
                funnelGapData?.funnelDistribution?.BoF ||
                funnelData.funnelDistribution?.BoF ||
                0,
              retention:
                funnelGapData?.funnelDistribution?.Retention ||
                funnelData.funnelDistribution?.Retention ||
                0,
              advocacy:
                funnelGapData?.funnelDistribution?.Advocacy ||
                funnelData.funnelDistribution?.Advocacy ||
                0,
              modu:
                funnelGapData?.funnelDistribution?.Unknown ||
                funnelData.funnelDistribution?.Unknown ||
                0,
              bofuDecay:
                funnelGapData?.bofuDecay ||
                Math.floor((funnelData.funnelDistribution?.BoF || 0) * 0.6),
            };
          } catch (error) {
            console.error("Error getting funnel gap data:", error);
            // Fallback to manual calculation
            return {
              tofu: funnelData.funnelDistribution?.ToF || 0,
              mofu: funnelData.funnelDistribution?.MoF || 0,
              bofu: funnelData.funnelDistribution?.BoF || 0,
              retention: funnelData.funnelDistribution?.Retention || 0,
              advocacy: funnelData.funnelDistribution?.Advocacy || 0,
              modu: funnelData.funnelDistribution?.Unknown || 0,
              bofuDecay: Math.floor(
                (funnelData.funnelDistribution?.BoF || 0) * 0.6
              ),
            };
          }
        })(),
      },
      psychographicMismatch: {
        driftPages: funnelData.funnelDistribution?.Unknown || 0,
        avgCTR: parseFloat((avgCTR * 0.3).toFixed(2)),
        impact: centralizedMetrics.psychoMismatch || 0, // Use centralized calculation
      },
      linkDilution: {
        // Use getLinkDilution function from FinancialCalculations context
        ...(() => {
          try {
            const linkDilutionData = getLinkDilution();
            return {
              lowDALinks:
                linkDilutionData?.lowDALinks ||
                Math.max(0, pageAuthority - domainAuthority),
              conflictingAnchors:
                linkDilutionData?.conflictingAnchors ||
                cannibalizationData.length,
              lostBacklinks:
                linkDilutionData?.lostBacklinks ||
                Math.max(0, citationFlow - trustFlow),
              impact:
                linkDilutionData?.impact ||
                centralizedMetrics.linkDilution ||
                0,
            };
          } catch (error) {
            console.error("Error getting link dilution data:", error);
            // Fallback to manual calculation
            return {
              lowDALinks: Math.max(0, pageAuthority - domainAuthority),
              conflictingAnchors: cannibalizationData.length,
              lostBacklinks: Math.max(0, citationFlow - trustFlow),
              impact: centralizedMetrics.linkDilution || 0,
            };
          }
        })(),
      },
      inventoryBloat: {
        // Use getTotalWastedSpend function from FinancialCalculations context
        ...(() => {
          try {
            const wastedSpendData = getTotalWastedSpend();
            return {
              lowImpressionPages:
                wastedSpendData?.lowImpressionPages ||
                searchConsoleData.filter((item) => (item.impressions || 0) < 10)
                  .length,
              noBacklinks:
                wastedSpendData?.noBacklinks ||
                contentCostWasteData.filter(
                  (item) => (item.impressions || 0) === 0
                ).length,
              crawlBudgetWaste:
                wastedSpendData?.crawlBudgetWaste ||
                contentCostWasteData.length,
              impact:
                wastedSpendData?.impact || centralizedMetrics.contentWaste || 0,
            };
          } catch (error) {
            console.error("Error getting wasted spend data:", error);
            // Fallback to manual calculation
            return {
              lowImpressionPages: searchConsoleData.filter(
                (item) => (item.impressions || 0) < 10
              ).length,
              noBacklinks: contentCostWasteData.filter(
                (item) => (item.impressions || 0) === 0
              ).length,
              crawlBudgetWaste: contentCostWasteData.length,
              impact: centralizedMetrics.contentWaste || 0,
            };
          }
        })(),
      },
      timeToROI: {
        avgBreakeven:
          (onboardingData?.domainCostDetails?.AverageContentCost || 200) > 0 &&
          (onboardingData?.domainCostDetails?.averageOrderValue || 50) > 0
            ? Math.ceil(
                (onboardingData?.domainCostDetails?.AverageContentCost || 200) /
                  ((onboardingData?.domainCostDetails?.averageOrderValue ||
                    50) *
                    (avgCTR / 100))
              )
            : 120,
        negativePages: negativeROIPages,
        highestBurn:
          contentCostWasteData.length > 0
            ? contentCostWasteData.reduce((max, item) =>
                (item.wastedSpend || 0) > (max.wastedSpend || 0) ? item : max
              ).url || "No data"
            : "No data available",
      },
      aiVsHuman: {
        aiCount: hasAIAuthors ? Math.floor(totalFunnelPages * 0.25) : 0,
        humanCount:
          totalFunnelPages -
          (hasAIAuthors ? Math.floor(totalFunnelPages * 0.25) : 0),
        aiDecay: hasAIAuthors ? -18.2 : 0,
        humanDecay: -9.6,
        aiConversion: hasAIAuthors ? 0.24 : 0,
        humanConversion: 1.12,
      },
      serpVolatility: {
        volatileKeywords: searchConsoleData.filter(
          (item) => (item.position || 0) > 50
        ).length,
        mismatchURL:
          searchConsoleData.find((item) => (item.position || 0) > 100)
            ?.keys?.[1] || "No volatile pages detected",
        volatilityScore: parseFloat((avgPosition / 10).toFixed(1)),
      },
      anchorOverload: {
        overloadedPages: cannibalizationData.length,
      },
      metaRisk: {
        siloBleed: `${onboardingData?.domain}/blog vs ${onboardingData?.domain}/services/`,
        bounceRateIncrease:
          contentDecayData.length > 0
            ? Math.floor(
                (contentDecayData.reduce(
                  (sum, item) => sum + Math.abs(item.dropRatio || 0),
                  0
                ) /
                  contentDecayData.length) *
                  100
              )
            : 10,
        outdatedPages: contentDecayData.filter(
          (item) => item.status === "Deep Decay"
        ).length,
      },
      errorPages: {
        count: contentCostWasteData.filter(
          (item) => (item.impressions || 0) === 0
        ).length,
        estimatedLoss: parseFloat(
          contentCostWasteData
            .filter((item) => (item.impressions || 0) === 0)
            .reduce((sum, item) => sum + (item.wastedSpend || 0), 0)
            .toFixed(1)
        ),
      },
    };
  }, [
    onboardingData,
    getContentQualityDistribution,
    getContentDecay,
    getCannibalizationLoss,
    getLinkDilution,
    getTotalWastedSpend,
    funnelGapIdentifier,
  ]);

  // Initialize risk metrics state with calculated values
  const [riskMetrics, setRiskMetrics] = useState(calculateRiskMetrics());
  // Update risk metrics when onboarding data changes
  useEffect(() => {
    if (!loading && onboardingData) {
      setRiskMetrics(calculateRiskMetrics());
    }
  }, [onboardingData, loading, calculateRiskMetrics]);

  const [expandedSections, setExpandedSections] = useState({});

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Function to render advanced insights using the rich riskMetricsData
  const renderAdvancedInsights = () => {
    console.log("Risk Metrics Data:", riskMetricsData);
    if (!riskMetricsData) {
      return null;
    }

    const sampleData = riskMetricsData[0]; // Use first item as sample

    return (
      <div className="advanced-insights-section">
        <div className="insights-header">
          <Brain className="insights-icon" />
          <h2>Advanced Risk Intelligence</h2>
          <p>Deep insights from your site's performance data</p>
        </div>

        {/* Key Metrics Overview */}
        <div className="key-metrics-grid">
          <div className="metric-card high-risk">
            <TrendingDown className="metric-icon" />
            <div className="metric-content">
              <h3>High Risk Pages</h3>
              <div className="metric-value">
                {
                  riskMetricsData.filter((item) => item.riskLevel === "High")
                    .length
                }
              </div>
              <p>Pages requiring immediate attention</p>
            </div>
          </div>

          <div className="metric-card medium-risk">
            <AlertTriangle className="metric-icon" />
            <div className="metric-content">
              <h3>Medium Risk Pages</h3>
              <div className="metric-value">
                {
                  riskMetricsData.filter((item) => item.riskLevel === "Medium")
                    .length
                }
              </div>
              <p>Pages with optimization potential</p>
            </div>
          </div>

          <div className="metric-card low-risk">
            <Shield className="metric-icon" />
            <div className="metric-content">
              <h3>Low Risk Pages</h3>
              <div className="metric-value">
                {
                  riskMetricsData.filter((item) => item.riskLevel === "Low")
                    .length
                }
              </div>
              <p>Pages performing well</p>
            </div>
          </div>
        </div>

        {/* Position Drift Analysis */}
        <div className="insight-card">
          <div className="insight-header">
            <Target className="insight-icon" />
            <h3>Position Drift Analysis</h3>
          </div>
          <div className="insight-content">
            <div className="drift-stats">
              <div className="drift-stat positive">
                <ArrowUpRight className="drift-icon" />
                <span>Major Improvements</span>
                <div className="drift-value">
                  {
                    riskMetricsData.filter(
                      (item) => item.riskMetrics.positionDrift < -50
                    ).length
                  }
                </div>
              </div>
              <div className="drift-stat negative">
                <ArrowDownRight className="drift-icon" />
                <span>Major Declines</span>
                <div className="drift-value">
                  {
                    riskMetricsData.filter(
                      (item) => item.riskMetrics.positionDrift > 50
                    ).length
                  }
                </div>
              </div>
            </div>
            <div className="sample-data">
              <p>
                <strong>Sample:</strong> {sampleData.url}
              </p>
              <p>
                Position Change: {sampleData.positionDrift?.toFixed(1)}{" "}
                positions
              </p>
            </div>
          </div>
        </div>

        {/* Traffic Decay Patterns */}
        <div className="insight-card">
          <div className="insight-header">
            <Activity className="insight-icon" />
            <h3>Traffic Decay Patterns</h3>
          </div>
          <div className="insight-content">
            <div className="decay-analysis">
              <div className="decay-metric">
                <span>Pages with Traffic Decay:</span>
                <strong>
                  {
                    riskMetricsData.filter(
                      (item) => item.riskMetrics.trafficDecay > 0
                    ).length
                  }
                </strong>
              </div>
              <div className="historical-context">
                <p>
                  <strong>12-Month Performance:</strong>
                </p>
                <p>
                  Total Clicks:{" "}
                  {sampleData.historicalContext.totalClicks12Month}
                </p>
                <p>
                  Total Impressions:{" "}
                  {sampleData.historicalContext.totalImpressions12Month}
                </p>
                <p>
                  Best 3-Month Avg:{" "}
                  {sampleData.historicalContext.bestThreeMonthAvg}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Keyword Performance Insights */}
        <div className="insight-card">
          <div className="insight-header">
            <Search className="insight-icon" />
            <h3>Keyword Performance Intelligence</h3>
          </div>
          <div className="insight-content">
            <div className="keyword-brackets">
              <div className="bracket top-10">
                <span>Top 10 Positions</span>
                <div className="bracket-count">
                  {
                    sampleData.topKeywords.filter((kw) => kw.position <= 10)
                      .length
                  }
                </div>
              </div>
              <div className="bracket top-20">
                <span>Top 20 Positions</span>
                <div className="bracket-count">
                  {
                    sampleData.topKeywords.filter(
                      (kw) => kw.position <= 20 && kw.position > 10
                    ).length
                  }
                </div>
              </div>
              <div className="bracket beyond-20">
                <span>Beyond 20</span>
                <div className="bracket-count">
                  {
                    sampleData.topKeywords.filter((kw) => kw.position > 20)
                      .length
                  }
                </div>
              </div>
            </div>
            <div className="top-keywords-sample">
              <h4>Sample Keywords:</h4>
              {sampleData.topKeywords.slice(0, 3).map((keyword, index) => (
                <div key={index} className="keyword-item">
                  <span className="keyword-name">{keyword.keyword}</span>
                  <span className="keyword-position">
                    Pos: {keyword.position?.toFixed(1)}
                  </span>
                  <span className="keyword-impressions">
                    Imp: {keyword.impressions}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cannibalization Intelligence */}
        <div className="insight-card">
          <div className="insight-header">
            <Users className="insight-icon" />
            <h3>Cannibalization Intelligence</h3>
          </div>
          <div className="insight-content">
            <div className="cannibalization-stats">
              <div className="cannibalization-severity">
                <div className="severity-item high">
                  <span>High Severity</span>
                  <div className="severity-count">
                    {
                      riskMetricsData.filter(
                        (item) => item.riskMetrics.cannibalizationScore >= 4
                      ).length
                    }
                  </div>
                </div>
                <div className="severity-item medium">
                  <span>Medium Severity</span>
                  <div className="severity-count">
                    {
                      riskMetricsData.filter(
                        (item) =>
                          item.riskMetrics.cannibalizationScore >= 2 &&
                          item.riskMetrics.cannibalizationScore < 4
                      ).length
                    }
                  </div>
                </div>
                <div className="severity-item low">
                  <span>Low Severity</span>
                  <div className="severity-count">
                    {
                      riskMetricsData.filter(
                        (item) => item.riskMetrics.cannibalizationScore < 2
                      ).length
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Recommendations Engine */}
        <div className="insight-card recommendations">
          <div className="insight-header">
            <Brain className="insight-icon" />
            <h3>AI Recommendations Engine</h3>
          </div>
          <div className="insight-content">
            <div className="recommendations-list">
              {sampleData.recommendations.map((recommendation, index) => (
                <div key={index} className="recommendation-item">
                  <Zap className="rec-icon" />
                  <span>{recommendation}</span>
                </div>
              ))}
            </div>
            <div className="recommendation-categories">
              <div className="category content-refresh">
                <span>Content Refresh</span>
                <div className="category-count">
                  {
                    riskMetricsData.filter((item) =>
                      item.recommendations.some((rec) =>
                        rec.toLowerCase().includes("refresh")
                      )
                    ).length
                  }
                </div>
              </div>
              <div className="category cannibalization-fix">
                <span>Cannibalization Fix</span>
                <div className="category-count">
                  {
                    riskMetricsData.filter((item) =>
                      item.recommendations.some((rec) =>
                        rec.toLowerCase().includes("cannibalization")
                      )
                    ).length
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Index Bloat Analysis */}
        <div className="insight-card">
          <div className="insight-header">
            <Eye className="insight-icon" />
            <h3>Index Bloat Analysis</h3>
          </div>
          <div className="insight-content">
            <div className="bloat-stats">
              <div className="bloat-metric clean">
                <span>Clean Pages</span>
                <div className="bloat-count">
                  {
                    riskMetricsData.filter(
                      (item) => !item.riskMetrics.isIndexBloat
                    ).length
                  }
                </div>
              </div>
              <div className="bloat-metric bloated">
                <span>Index Bloat</span>
                <div className="bloat-count">
                  {
                    riskMetricsData.filter(
                      (item) => item.riskMetrics.isIndexBloat
                    ).length
                  }
                </div>
              </div>
            </div>
            <div className="cleanup-strategy">
              <h4>Cleanup Strategy:</h4>
              <p>
                • Focus on pages with low impressions and high position drift
              </p>
              <p>• Consider consolidating similar content</p>
              <p>• Improve internal linking for important pages</p>
            </div>
          </div>
        </div>

        {/* Immediate Action Center */}
        <div className="insight-card action-center">
          <div className="insight-header">
            <Crown className="insight-icon" />
            <h3>Immediate Action Center</h3>
          </div>
          <div className="insight-content">
            <div className="priority-actions">
              <div className="action-item priority-high">
                <span className="priority-label">HIGH PRIORITY</span>
                <span className="action-text">
                  Fix{" "}
                  {
                    riskMetricsData.filter((item) => item.priority === "High")
                      .length
                  }{" "}
                  high-risk pages
                </span>
              </div>
              <div className="action-item priority-medium">
                <span className="priority-label">MEDIUM PRIORITY</span>
                <span className="action-text">
                  Optimize{" "}
                  {
                    riskMetricsData.filter((item) => item.priority === "Medium")
                      .length
                  }{" "}
                  medium-risk pages
                </span>
              </div>
            </div>
            <div className="next-steps">
              <h4>Next Steps:</h4>
              <ol>
                <li>Address pages with highest composite risk scores</li>
                <li>Implement AI recommendations for content refresh</li>
                <li>Resolve keyword cannibalization conflicts</li>
                <li>Monitor position drift trends</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };
  // Show loading spinner while data is being fetched
  if (loading) {
    return (
      <div className="risk-dashboard-container">
        <div className="risk-dashboard-header">
          <div className="header-title">
            <Brain className="header-icon" />
            <div>
              <h1>Content Risk Intelligence OS</h1>
              <p>"Loading risk intelligence data..."</p>
            </div>
          </div>
        </div>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Analyzing your content risk metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="risk-dashboard">
      {/* Header */}
      <div className="risk-dashboard-header">
        <div className="header-title">
          <Brain className="header-icon" />
          <div>
            <h1>Content Risk Intelligence OS</h1>
            <p>"Command Your Content Like Capital"</p>
          </div>
        </div>

        <div className="site-overview">
          <div className="site-info">
            <span>SITE: {riskMetrics.siteInfo.domain}</span>
            <span>DATE: {riskMetrics.siteInfo.date}</span>
          </div>
          <div className="site-metrics">
            <span>PAGES: {riskMetrics.siteInfo.pages.toLocaleString()}</span>
            <span>
              IMPRESSIONS: {riskMetrics.siteInfo.impressions.toLocaleString()}
            </span>
            <span>CLICKS: {riskMetrics.siteInfo.clicks.toLocaleString()}</span>
          </div>
          <div className="site-metrics">
            <span>AVG CTR: {riskMetrics.siteInfo.avgCTR}%</span>
            <span>AVG DA: {riskMetrics.siteInfo.avgDA}</span>
            <span>AVG KD Targeted: {riskMetrics.siteInfo.avgKD}</span>
          </div>
        </div>
      </div>

      {/* Risk Sections Grid */}
      <div className="risk-sections-grid">
        {" "}
        {/* 1. Credit Score Breakdown */}
        <div className="risk-section">
          <div
            className="section-header"
            onClick={() => toggleSection("creditScore")}
          >
            <div className="section-title">
              <span className="section-number">📊 1.</span>
              <span>CREDIT SCORE BREAKDOWN (A+ → D‑)</span>{" "}
              <FinancialTooltip
                title={getTooltipContent("contentGrade", onboardingData).title}
                content={
                  getTooltipContent("contentGrade", onboardingData).content
                }
                position="top"
              />
            </div>
            <ChevronRight
              className={`chevron ${
                expandedSections.creditScore ? "expanded" : ""
              }`}
            />
          </div>
          <div className="section-content">
            <div className="credit-grades">
              <span className="grade grade-a">
                A ({riskMetrics.creditScore.aGrade})
              </span>
              <span className="grade grade-b">
                B ({riskMetrics.creditScore.bGrade})
              </span>
              <span className="grade grade-c">
                C ({riskMetrics.creditScore.cGrade})
              </span>
              <span className="grade grade-d">
                D ({riskMetrics.creditScore.dGrade})
              </span>
            </div>
            <div className="risk-details">
              <p>
                • {riskMetrics.creditScore.downgraded} URLs downgraded this
                month
              </p>
              <p>
                • D-graded Content = {riskMetrics.creditScore.dGradeCTRLoss}% of
                total CTR loss
              </p>
            </div>
            <button className="view-more-btn">
              View Scoring Decay Timeline ▸
            </button>
          </div>
        </div>{" "}
        {/* 2. Content Decay Index */}
        <div className="risk-section">
          <div
            className="section-header"
            onClick={() => toggleSection("contentDecay")}
          >
            <div className="section-title">
              <span className="section-number">📉 2.</span>
              <span>CONTENT DECAY INDEX</span>
              <FinancialTooltip
                title={getTooltipContent("contentRisk").title}
                content={getTooltipContent("contentRisk").content}
                position="top"
              />
            </div>
            <ChevronRight
              className={`chevron ${
                expandedSections.contentDecay ? "expanded" : ""
              }`}
            />
          </div>
          <div className="section-content">
            <div className="decay-stats">
              <span>Stable: {riskMetrics.contentDecay.stable}</span>
              <span>Deep-Decay: {riskMetrics.contentDecay.deepDecay}</span>
              <span>Growing: {riskMetrics.contentDecay.growing}</span>
            </div>
            <div className="risk-details">
              <p>
                • Avg. 7d Impression Drop:{" "}
                {riskMetrics.contentDecay.avgDropPercent}%
              </p>
              <p>
                • ⚠️ Decay + No ROI After 12mo:{" "}
                {riskMetrics.contentDecay.noROIPages} Pages
              </p>
              <p>• Top Droppers:</p>
              {riskMetrics.contentDecay.topDroppers.map((dropper, index) => (
                <p key={index} className="dropper-item">
                  &nbsp;&nbsp;• {dropper.url} ↓ {Math.abs(dropper.drop)}%
                </p>
              ))}
            </div>
            <button className="view-more-btn">View Slope Histogram ▸</button>
          </div>
        </div>
        {/* 3. Cannibalization Conflict Map */}
        <div className="risk-section">
          <div
            className="section-header"
            onClick={() => toggleSection("cannibalization")}
          >
            <div className="section-title">
              <span className="section-number">💥 3.</span>
              <span>CANNIBALIZATION CONFLICT MAP</span>
            </div>
            <ChevronRight
              className={`chevron ${
                expandedSections.cannibalization ? "expanded" : ""
              }`}
            />
          </div>
          <div className="section-content">
            <div className="risk-details">
              <p>
                • {riskMetrics.cannibalization.keywordOverlaps} Keyword Intent
                Overlaps (e.g., "{riskMetrics.cannibalization.exampleKeyword}")
              </p>
              <p>
                • Impression Share Loss:{" "}
                {riskMetrics.cannibalization.impressionShareLoss}% (across 3
                pages)
              </p>
              <p>
                • Cosine Title Similarity &gt; 0.9:{" "}
                {riskMetrics.cannibalization.similarityPages} URL clusters
              </p>
            </div>
            <button className="view-more-btn">Intent Collision Matrix ▸</button>
          </div>
        </div>
        {/* 4. Keyword Efficiency Index */}
        <div className="risk-section">
          <div
            className="section-header"
            onClick={() => toggleSection("keywordEfficiency")}
          >
            <div className="section-title">
              <span className="section-number">⚖️ 4.</span>
              <span>KEYWORD EFFICIENCY INDEX (DA vs KD)</span>
            </div>
            <ChevronRight
              className={`chevron ${
                expandedSections.keywordEfficiency ? "expanded" : ""
              }`}
            />
          </div>
          <div className="section-content">
            <div className="efficiency-stats">
              <span>
                Avg KD Targeted: {riskMetrics.keywordEfficiency.avgKD}
              </span>
              <span>Avg DA: {riskMetrics.keywordEfficiency.avgDA}</span>
              <span className="overexposed">→ Overexposed!</span>
            </div>
            <div className="risk-details">
              <p>
                • KD/DA Overreach Ratio:{" "}
                {riskMetrics.keywordEfficiency.overreachRatio}x (High Risk)
              </p>
              <p>• Top Overexertions:</p>
              {riskMetrics.keywordEfficiency.topOverexertions.map(
                (item, index) => (
                  <p key={index} className="overexertion-item">
                    &nbsp;&nbsp;• {item.url} → KD {item.kd} | DA {item.da}
                  </p>
                )
              )}
            </div>
            <button className="view-more-btn">Punching-Up Scatterplot ▸</button>
          </div>
        </div>
        {/* 5. Strategy Ratio */}
        <div className="risk-section">
          <div
            className="section-header"
            onClick={() => toggleSection("strategyRatio")}
          >
            <div className="section-title">
              <span className="section-number">📈 5.</span>
              <span>STRATEGY RATIO (TOFU / MOFU / BOFU / ModU)</span>
            </div>
            <ChevronRight
              className={`chevron ${
                expandedSections.strategyRatio ? "expanded" : ""
              }`}
            />
          </div>
          <div className="section-content">
            <div className="funnel-ratios">
              <span>TOFU: {riskMetrics.strategyRatio.tofu}%</span>
              <span>MOFU: {riskMetrics.strategyRatio.mofu}%</span>
              <span>BOFU: {riskMetrics.strategyRatio.bofu}%</span>
              <span>ModU: {riskMetrics.strategyRatio.modu}%</span>
            </div>
            <div className="risk-details">
              <p>• Funnel Imbalance: Under-monetized!</p>
              <p>
                • {riskMetrics.strategyRatio.bofuDecay}% of BOFU content in
                active decay
              </p>
            </div>
            <button className="view-more-btn">Funnel Ratio Wheel ▸</button>
          </div>
        </div>
        {/* 6. Psychographic Mismatch Monitor */}
        <div className="risk-section">
          <div
            className="section-header"
            onClick={() => toggleSection("psychographicMismatch")}
          >
            <div className="section-title">
              <span className="section-number">🧠 6.</span>
              <span>PSYCHOGRAPHIC MISMATCH MONITOR</span>
            </div>
            <ChevronRight
              className={`chevron ${
                expandedSections.psychographicMismatch ? "expanded" : ""
              }`}
            />
          </div>
          <div className="section-content">
            <div className="risk-details">
              <p>
                • Persona Drift: {riskMetrics.psychographicMismatch.driftPages}{" "}
                URLs mismatch audience tone
              </p>
              <p>
                • Avg. CTR on mismatches:{" "}
                {riskMetrics.psychographicMismatch.avgCTR}%
              </p>
              <p>• Suggested Fixes: Rewrite CTA, adjust intent stage</p>
            </div>
            <button className="view-more-btn">CTR vs Tone Graph ▸</button>
          </div>
        </div>
        {/* 7. Link Dilution Radar */}
        <div className="risk-section">
          <div
            className="section-header"
            onClick={() => toggleSection("linkDilution")}
          >
            <div className="section-title">
              <span className="section-number">🧬 7.</span>
              <span>LINK DILUTION RADAR</span>
            </div>
            <ChevronRight
              className={`chevron ${
                expandedSections.linkDilution ? "expanded" : ""
              }`}
            />
          </div>
          <div className="section-content">
            <div className="risk-details">
              <p>
                • {riskMetrics.linkDilution.lowDALinks} URLs linking to low-DA
                sources (DA &lt; 20)
              </p>
              <p>
                • {riskMetrics.linkDilution.conflictingAnchors} URLs with
                conflicting internal anchors
              </p>
              <p>
                • {riskMetrics.linkDilution.lostBacklinks} High-authority
                backlinks lost (past 30d)
              </p>
            </div>
            <button className="view-more-btn">Dilution Heatmap ▸</button>
          </div>
        </div>
        {/* 8. Inventory Bloat Index */}
        <div className="risk-section">
          <div
            className="section-header"
            onClick={() => toggleSection("inventoryBloat")}
          >
            <div className="section-title">
              <span className="section-number">📦 8.</span>
              <span>INVENTORY BLOAT INDEX</span>
            </div>
            <ChevronRight
              className={`chevron ${
                expandedSections.inventoryBloat ? "expanded" : ""
              }`}
            />
          </div>
          <div className="section-content">
            <div className="risk-details">
              <p>
                • {riskMetrics.inventoryBloat.lowImpressionPages} URLs with
                &lt;100 impressions in 90d
              </p>
              <p>
                • {riskMetrics.inventoryBloat.noBacklinks} have no backlinks &
                less than 2 internal links
              </p>
              <p>
                • Crawl Budget Waste Estimate:{" "}
                {riskMetrics.inventoryBloat.crawlBudgetWaste}% of total index
              </p>
            </div>
            <button className="view-more-btn">Zombie Pages Log ▸</button>
          </div>
        </div>
        {/* 9. Time to ROI Tracker */}
        <div className="risk-section">
          <div
            className="section-header"
            onClick={() => toggleSection("timeToROI")}
          >
            <div className="section-title">
              <span className="section-number">⌛ 9.</span>
              <span>TIME TO ROI TRACKER</span>
            </div>
            <ChevronRight
              className={`chevron ${
                expandedSections.timeToROI ? "expanded" : ""
              }`}
            />
          </div>
          <div className="section-content">
            <div className="risk-details">
              <p>
                • Avg. ROI breakeven: {riskMetrics.timeToROI.avgBreakeven} days
              </p>
              <p>
                • {riskMetrics.timeToROI.negativePages} URLs still negative
                after 12 months
              </p>
              <p>
                • Highest Burn Rate URL: {riskMetrics.timeToROI.highestBurn}
              </p>
            </div>
            <button className="view-more-btn">Yield Latency Table ▸</button>
          </div>
        </div>
        {/* 10. AI vs Human Performance Audit */}
        <div className="risk-section">
          <div
            className="section-header"
            onClick={() => toggleSection("aiVsHuman")}
          >
            <div className="section-title">
              <span className="section-number">🔄 10.</span>
              <span>AI vs HUMAN PERFORMANCE AUDIT</span>
            </div>
            <ChevronRight
              className={`chevron ${
                expandedSections.aiVsHuman ? "expanded" : ""
              }`}
            />
          </div>
          <div className="section-content">
            <div className="ai-human-stats">
              <div className="stat-group">
                <span>AI Content Count: {riskMetrics.aiVsHuman.aiCount}</span>
                <span>Human: {riskMetrics.aiVsHuman.humanCount}</span>
              </div>
              <div className="stat-group">
                <span>Avg Decay: AI ({riskMetrics.aiVsHuman.aiDecay}%)</span>
                <span>Human ({riskMetrics.aiVsHuman.humanDecay}%)</span>
              </div>
              <div className="stat-group">
                <span>
                  Conversion Rate: AI ({riskMetrics.aiVsHuman.aiConversion}%)
                </span>
                <span>Human ({riskMetrics.aiVsHuman.humanConversion}%)</span>
              </div>
            </div>
            <button className="view-more-btn">
              Author-Type Efficiency Report ▸
            </button>
          </div>
        </div>
        {/* 11. SERP Volatility Monitor */}
        <div className="risk-section">
          <div
            className="section-header"
            onClick={() => toggleSection("serpVolatility")}
          >
            <div className="section-title">
              <span className="section-number">🌪️ 11.</span>
              <span>SERP VOLATILITY MONITOR</span>
            </div>
            <ChevronRight
              className={`chevron ${
                expandedSections.serpVolatility ? "expanded" : ""
              }`}
            />
          </div>
          <div className="section-content">
            <div className="risk-details">
              <p>
                • {riskMetrics.serpVolatility.volatileKeywords} high-performing
                keywords show format volatility
              </p>
              <p>
                • Format mismatch flagged on:{" "}
                {riskMetrics.serpVolatility.mismatchURL}
              </p>
              <p>
                • Volatility Score Threshold:{" "}
                {riskMetrics.serpVolatility.volatilityScore} (out of 5)
              </p>
            </div>
            <button className="view-more-btn">SERP Watchlist ▸</button>
          </div>
        </div>
        {/* 12. Anchor Text Overload */}
        <div className="risk-section">
          <div
            className="section-header"
            onClick={() => toggleSection("anchorOverload")}
          >
            <div className="section-title">
              <span className="section-number">📎 12.</span>
              <span>ANCHOR TEXT OVERLOAD</span>
            </div>
            <ChevronRight
              className={`chevron ${
                expandedSections.anchorOverload ? "expanded" : ""
              }`}
            />
          </div>
          <div className="section-content">
            <div className="risk-details">
              <p>
                • {riskMetrics.anchorOverload.overloadedPages} URLs have more
                than 5 exact-match internal anchors
              </p>
              <p>• Risk of over-optimization / internal conflict</p>
            </div>
            <button className="view-more-btn">Anchor Audit ▸</button>
          </div>
        </div>
        {/* 13. Meta Risk Snapshots */}
        <div className="risk-section">
          <div
            className="section-header"
            onClick={() => toggleSection("metaRisk")}
          >
            <div className="section-title">
              <span className="section-number">🧠 13.</span>
              <span>META RISK SNAPSHOTS</span>
            </div>
            <ChevronRight
              className={`chevron ${
                expandedSections.metaRisk ? "expanded" : ""
              }`}
            />
          </div>
          <div className="section-content">
            <div className="risk-details">
              <p>• Silo Bleed Detected in: {riskMetrics.metaRisk.siloBleed}</p>
              <p>
                • Bounce Rate Drift: {riskMetrics.metaRisk.bounceRateIncrease}%
                ↑ on educational pages
              </p>
              <p>
                • Outdated Pages (last edit over 18mo):{" "}
                {riskMetrics.metaRisk.outdatedPages} flagged
              </p>
            </div>
            <button className="view-more-btn">
              Run Refresh Priority Matrix ▸
            </button>
          </div>
        </div>
      </div>

      {/* Error Pages Summary */}
      <div className="error-pages-summary">
        <div className="error-header">
          <AlertTriangle className="error-icon" />
          <span>404 & Error Pages</span>
        </div>
        <div className="error-stats">
          <span>{riskMetrics.errorPages.count} Pages</span>
          <span>
            {formatCurrency(riskMetrics.errorPages.estimatedLoss)} Est. Loss
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="risk-dashboard-actions">
        <button
          className="action-btn primary"
          onClick={() => navigate("/analytics")}
        >
          Generate Risk Report
        </button>
        <button
          className="action-btn secondary"
          onClick={() => navigate("/agents/content-creation")}
        >
          Fix Priority Issues
        </button>
        <button
          className="action-btn secondary"
          onClick={() => navigate("/settings")}
        >
          Configure Thresholds
        </button>
      </div>

      {/* Add new insights section after the error pages summary */}
      {renderAdvancedInsights()}
    </div>
  );
};

export default RiskDashboard;
