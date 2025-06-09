import React from "react";
import FinancialTooltip from "../components/FinancialTooltip";
import { getTooltipContent } from "../utils/tooltipContent";

const TooltipTest = () => {
  // Mock onboarding data to test dynamic content
  const mockOnboardingData = {
    domainCostDetails: {
      averageOrderValue: 75,
      AverageContentCost: 250
    },
    searchConsoleData: [
      { clicks: 1500, impressions: 45000, position: 8.5 },
      { clicks: 890, impressions: 23000, position: 12.3 },
      { clicks: 2100, impressions: 67000, position: 5.2 }
    ],
    GSCAnalysisData: {
      psychoMismatch: Array(176).fill({}), // 176 URLs
      contentDecay: Array(23).fill({}),
      keywordMismatch: Array(45).fill({})
    },
    psychoMismatch: 35 // 35% mismatch
  };

  return (
    <div style={{ padding: "50px", maxWidth: "800px" }}>
      <h1>Tooltip Test Page - Dynamic Content</h1>

      <div style={{ margin: "30px 0", padding: "20px", border: "1px solid #ddd" }}>
        <h3>
          Psychographic Mismatch: $575 (176 URLs)
          <FinancialTooltip
            title={getTooltipContent("psychoMismatch", mockOnboardingData).title}
            content={getTooltipContent("psychoMismatch", mockOnboardingData).content}
            position="top"
          />
        </h3>
        <p style={{ color: "#666", fontSize: "14px" }}>
          This should show: "Based on analysis of 176 URLs, your psychographic mismatch percentage is 35% with total traffic of 4,490 clicks."
        </p>
      </div>

      <div style={{ margin: "30px 0", padding: "20px", border: "1px solid #ddd" }}>
        <h3>
          Revenue Leak Detected 
          <FinancialTooltip
            title={getTooltipContent("revenueLeak", mockOnboardingData).title}
            content={getTooltipContent("revenueLeak", mockOnboardingData).content}
            position="top"
          />
        </h3>
        <p style={{ color: "#666", fontSize: "14px" }}>
          This should show actual traffic numbers and your $75 AOV instead of default $50.
        </p>
      </div>

      <div style={{ margin: "30px 0", padding: "20px", border: "1px solid #ddd" }}>
        <h3>
          Content Decay Impact
          <FinancialTooltip
            title={getTooltipContent("contentDecay", mockOnboardingData).title}
            content={getTooltipContent("contentDecay", mockOnboardingData).content}
            position="bottom"
          />
        </h3>
        <p style={{ color: "#666", fontSize: "14px" }}>
          This should show "Found 23 pages showing traffic decline in your data."
        </p>
      </div>

      <div style={{ margin: "30px 0", padding: "20px", border: "1px solid #ddd" }}>
        <h3>
          Keyword Mismatch Opportunity
          <FinancialTooltip
            title={getTooltipContent("kwMismatch", mockOnboardingData).title}
            content={getTooltipContent("kwMismatch", mockOnboardingData).content}
            position="left"
          />
        </h3>
        <p style={{ color: "#666", fontSize: "14px" }}>
          This should show "Identified 45 keyword targeting misalignments" and your actual traffic/CTR.
        </p>
      </div>

      <div style={{ margin: "30px 0", padding: "20px", backgroundColor: "#f9f9f9" }}>
        <h4>Console Log Check:</h4>
        <p>Open developer tools and hover over the info icons. You should see console logs showing tooltip events.</p>
      </div>
    </div>
  );
};

export default TooltipTest;
