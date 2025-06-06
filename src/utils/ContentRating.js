/**
 * ContentRating.js - Standardized content grading system
 *
 * This module provides standardized content rating calculations and definitions
 * to ensure consistency across all dashboards in the application.
 *
 * Grade definitions:
 * - A: High-performing content with excellent ROI (>150%)
 * - B: Good content with positive ROI (50-150%)
 * - C: Average content with breakeven ROI (-50% to 50%)
 * - D: Underperforming content with negative ROI (<-50%)
 */

/**
 * Calculate content grade based on various metrics
 *
 * @param {Object} metrics - Content performance metrics
 * @param {number} metrics.roi - Return on investment percentage
 * @param {number} metrics.trafficTrend - Traffic trend (positive = growth, negative = decline)
 * @param {number} metrics.conversionRate - Conversion rate percentage (optional)
 * @param {number} metrics.engagementScore - User engagement score (optional)
 * @returns {string} Content grade (A, B, C, or D)
 */
export const calculateContentGrade = (metrics) => {
  const {
    roi,
    trafficTrend = 0,
    conversionRate = 0,
    engagementScore = 0,
  } = metrics;

  // Primary factor is ROI
  if (roi > 150) {
    // A grade territory - validate with other metrics
    if (trafficTrend > 0 || conversionRate > 2 || engagementScore > 70) {
      return "A"; // Confirmed A grade
    }
    // Some negative signals, downgrade to B
    return "B";
  } else if (roi >= 50) {
    // B grade territory
    if (trafficTrend > 10 && (conversionRate > 3 || engagementScore > 80)) {
      return "A"; // Upgrade to A due to strong performance signals
    }
    return "B";
  } else if (roi >= -50) {
    // C grade territory
    if (trafficTrend > 15 && (conversionRate > 2 || engagementScore > 70)) {
      return "B"; // Upgrade to B due to improving signals
    }
    return "C";
  } else {
    // D grade territory
    if (trafficTrend > 20 && (conversionRate > 1 || engagementScore > 60)) {
      return "C"; // Upgrade to C due to recent improvements
    }
    return "D";
  }
};

/**
 * Get color for content grade
 *
 * @param {string} grade - Content grade (A, B, C, or D)
 * @returns {string} Hex color code
 */
export const getGradeColor = (grade) => {
  switch (grade) {
    case "A":
      return "#4ade80"; // Green
    case "B":
      return "#60a5fa"; // Blue
    case "C":
      return "#facc15"; // Yellow
    case "D":
      return "#f87171"; // Red
    default:
      return "#94a3b8"; // Gray (default)
  }
};

/**
 * Get description for content grade
 *
 * @param {string} grade - Content grade (A, B, C, or D)
 * @returns {string} Grade description
 */
export const getGradeDescription = (grade) => {
  switch (grade) {
    case "A":
      return "High-performing content with excellent ROI";
    case "B":
      return "Good content with positive ROI";
    case "C":
      return "Average content with breakeven ROI";
    case "D":
      return "Underperforming content with negative ROI";
    default:
      return "Ungraded content";
  }
};

/**
 * Get recommendation for content grade
 *
 * @param {string} grade - Content grade (A, B, C, or D)
 * @returns {string} Recommendation based on content grade
 */
export const getGradeRecommendation = (grade) => {
  switch (grade) {
    case "A":
      return "Repurpose and expand this high-performing content";
    case "B":
      return "Optimize and promote this good content";
    case "C":
      return "Revise and improve to increase ROI";
    case "D":
      return "Consider updating or pruning this underperforming content";
    default:
      return "Evaluate content performance";
  }
};

/**
 * Format ROI percentage with appropriate styling
 *
 * @param {number} roi - ROI percentage
 * @returns {Object} Formatted ROI with value and color
 */
export const formatROI = (roi) => {
  const formattedValue = `${roi >= 0 ? "+" : ""}${roi.toFixed(1)}%`;
  let color;

  if (roi > 150) {
    color = "#4ade80"; // Green
  } else if (roi >= 50) {
    color = "#60a5fa"; // Blue
  } else if (roi >= -50) {
    color = "#facc15"; // Yellow
  } else {
    color = "#f87171"; // Red
  }

  return {
    value: formattedValue,
    color,
  };
};

/**
 * Calculate distribution of content grades from content data
 *
 * @param {Array} contentItems - Array of content items with performance metrics
 * @returns {Object} Distribution of content grades (A, B, C, D)
 */
export const calculateGradeDistribution = (contentItems) => {
  const distribution = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    total: contentItems.length,
  };

  contentItems.forEach((item) => {
    const {
      roi,
      trafficTrend = 0,
      conversionRate = 0,
      engagementScore = 0,
    } = item;

    const grade = calculateContentGrade({
      roi,
      trafficTrend,
      conversionRate,
      engagementScore,
    });

    distribution[grade]++;
  });

  // Calculate percentages
  distribution.percentA =
    distribution.total > 0 ? (distribution.A / distribution.total) * 100 : 0;
  distribution.percentB =
    distribution.total > 0 ? (distribution.B / distribution.total) * 100 : 0;
  distribution.percentC =
    distribution.total > 0 ? (distribution.C / distribution.total) * 100 : 0;
  distribution.percentD =
    distribution.total > 0 ? (distribution.D / distribution.total) * 100 : 0;

  return distribution;
};
