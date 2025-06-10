/**
 * SUMMARY: Updated to Use Comprehensive Loss Calculation
 *
 * WHAT CHANGED:
 * =============
 *
 * 1. CURRENT CONTENT VALUE:
 *    - Formula: Total Invested - Average of ALL losses
 *    - Instead of just decay loss, now considers ALL loss types
 *    - More comprehensive business impact assessment
 *
 * 2. CONTENT DECAY PERCENTAGE (now "Average Loss Rate"):
 *    - Shows average percentage across all loss types
 *    - Includes: Revenue Leak, Content Decay, Keyword Mismatch, Link Dilution, Cannibalization, Wasted Content
 *    - More holistic view of content portfolio health
 *
 * NEW LOSS TYPES INCLUDED:
 * ========================
 *
 * 1. Revenue Leak (15% impact for underperforming content)
 * 2. Content Decay Loss (25% for severe, 10% for moderate decay)
 * 3. Keyword Mismatch (8% for under-optimized, 5% for over-optimized)
 * 4. Link Dilution (12% impact for high dilution)
 * 5. Cannibalization/Psychographic Mismatch (20% impact)
 * 6. Content Creation Cost Waste (25% for underperforming content)
 *
 * CALCULATION METHOD:
 * ===================
 *
 * Step 1: Calculate individual loss percentages for each type
 * Step 2: Filter to only active loss types (percentage > 0)
 * Step 3: Calculate average: Sum of all active loss percentages ÷ Number of active loss types
 * Step 4: Apply average loss percentage to total investment
 * Step 5: Current Value = Total Investment - Average Loss Value
 *
 * EXAMPLE CALCULATION:
 * ====================
 *
 * If you have:
 * - Total Investment: $100,000
 * - Revenue Leak: 10%
 * - Content Decay: 15%
 * - Keyword Mismatch: 5%
 * - Link Dilution: 8%
 * - Cannibalization: 12%
 * - Wasted Content: 20%
 *
 * Average Loss = (10 + 15 + 5 + 8 + 12 + 20) ÷ 6 = 11.67%
 * Loss Value = $100,000 × 11.67% = $11,670
 * Current Content Value = $100,000 - $11,670 = $88,330
 *
 * EXPECTED DASHBOARD DISPLAY:
 * ============================
 * 💰 Total Invested: $100,000
 * 📈 Current Content Value: $88,330
 * 📉 Average Loss Rate: 12% (rounded)
 *
 * BENEFITS:
 * =========
 * 1. Comprehensive View: Considers all types of content losses
 * 2. Balanced Approach: Averages losses to avoid any single metric dominating
 * 3. Business Reality: Shows true remaining value after all identified losses
 * 4. Actionable Insights: Debug console shows breakdown of each loss type
 * 5. Conservative Estimate: Only counts active loss types in average
 *
 * DEBUG OUTPUT:
 * =============
 * Console will show:
 * - "🔥 Comprehensive Loss Analysis:" - Full calculation breakdown
 * - "💰 All Loss Types Analysis:" - Individual loss percentages and values
 * - "📊 Individual Loss Breakdown:" - Each active loss type with percentage and dollar impact
 */

export const comprehensiveLossCalculationSummary = {
  method: "comprehensive_average_loss",
  description:
    "Current Value = Total Investment - Average of All Active Losses",
  lossTypes: [
    "Revenue Leak",
    "Content Decay",
    "Keyword Mismatch",
    "Link Dilution",
    "Cannibalization",
    "Wasted Content Creation",
  ],
  benefits: [
    "Holistic business impact assessment",
    "Balanced loss calculation",
    "More realistic current content value",
    "Comprehensive loss type visibility",
  ],
};
