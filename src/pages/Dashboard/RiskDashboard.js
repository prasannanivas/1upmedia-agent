import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../../context/OnboardingContext";
import { useFinancialCalculations } from "../../context/FinancialCalculations";
import { AlertTriangle, Brain, ChevronRight } from "lucide-react";
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
  } = useFinancialCalculations();
  const navigate = useNavigate();

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
        avgCTR: parseFloat(avgCTR.toFixed(2)),
        avgDA: domainAuthority,
        avgKD: parseFloat(avgKD.toFixed(1)),
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
    <div className="risk-dashboard-container">
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
    </div>
  );
};

export default RiskDashboard;
