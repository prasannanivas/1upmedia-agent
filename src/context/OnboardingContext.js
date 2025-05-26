import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext"; // Ensure correct import

const OnboardingContext = createContext();

export const OnboardingProvider = ({ children }) => {
  const { authState } = useAuth();
  const { email } = authState;
  const [loading, setLoading] = useState(true);
  const [connectedSites, setConnectedSites] = useState([]);

  const [onboardingData, setOnboardingData] = useState({
    domain: "",
    language: "",
    location: "",
    integrations: [],
    keywords: [],
    businessDetails: "",
    domain_authority: "",
    page_authority: "",
    initialAnalysisState: {
      domainAuthority: "",
      pageAuthority: "",
      trustFlow: "",
      citationFlow: "",
    },
    domainCostDetails: {
      averageOrderValue: "",
      AverageContentCost: "",
    },
    socialIntegrations: [],
    suggestionsFromAi: {},
    authors: [],
    searchConsoleData: [],
  });

  useEffect(() => {
    const fetchOnboardingData = async () => {
      setLoading(true);
      try {
        if (!email) return;

        // Fetch Business Details
        const businessResponse = await axios.get(
          "https://ai.1upmedia.com:443/aiagent/getBusinessDetails",
          { params: { email } }
        );

        if (businessResponse.data && businessResponse.data.length > 0) {
          const firstSite = businessResponse.data[0];

          setOnboardingData((prev) => ({
            ...prev,
            domain: firstSite.URL || "",
            location: firstSite.location || "",
            keywords: firstSite.keywords || [],
            businessDetails: firstSite.business_details || "",
            GSCAnalysisData: firstSite.dynamic_fields?.analysisData,
            initialAnalysisState: {
              domainAuthority: firstSite?.dynamic_fields?.domainAuthority || "",
              pageAuthority: firstSite.dynamic_fields?.pageAuthority || "",
              trustFlow: firstSite.dynamic_fields?.trustFlow || "",
              citationFlow: firstSite.dynamic_fields?.citationFlow || "",
            },
            funnelAnalysis: firstSite.dynamic_fields?.funnelAnalysis || {
              totalAnalyzed: 0,
              funnelDistribution: { ToF: 0, MoF: 0, BoF: 0, Unknown: 0 },
            },
            domainCostDetails: firstSite.dynamic_fields?.domainCostDetails || {
              averageOrderValue: "",
              AverageContentCost: "",
            },
            sitemaps: firstSite.dynamic_fields?.sitemaps || [],
            selectedSitemaps: firstSite.dynamic_fields?.selectedSitemaps || [],
            searchConsoleData: firstSite.search_analytics || [],
            suggestionsFromAi: {
              content_strategies:
                firstSite.dynamic_fields?.suggestions?.content_strategies || [],
              content_types:
                firstSite.dynamic_fields?.suggestions?.content_types || [],
              topic_clusters:
                firstSite.dynamic_fields?.suggestions?.topic_clusters || [],
            },
          }));
        }

        // Fetch Authors
        const authorsResponse = await fetch(
          `https://ai.1upmedia.com:443/aiagent/getAuthors?email=${email}`
        );
        if (authorsResponse.ok) {
          const authorsData = await authorsResponse.json();
          setOnboardingData((prev) => ({
            ...prev,
            authors: authorsData || [],
          }));
        }
      } catch (error) {
        console.error("Error fetching onboarding data:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchConnectedSites = async () => {
      try {
        const response = await fetch(
          `https://ai.1upmedia.com:443/aiagent/search-console/${email}`
        );
        if (response.ok) {
          const data = await response.json();
          setConnectedSites(data.data?.sites || []);
        }
      } catch (error) {
        console.error("Error fetching connected sites:", error);
      }
    };

    if (email) {
      try {
        fetchOnboardingData();
      } catch (error) {
        console.error("Error fetching onboarding data:", error);
        setLoading(false);
      }

      try {
        fetchConnectedSites();
      } catch (error) {}
    }
  }, [email]);

  // Calculate Profile Completion Percentage with weighted sections
  const getPercentageProfileCompletion = () => {
    const sections = {
      basicInfo: {
        weight: 20,
        fields: [
          { name: "domain", check: (data) => data.domain.trim() !== "" },
          { name: "location", check: (data) => data.location.trim() !== "" },
          {
            name: "businessDetails",
            path: "/onboarding/step-business-details",
            check: (data) => data.businessDetails?.trim() !== "",
          },
        ],
      },
      domainAnalysis: {
        weight: 20,
        fields: [
          {
            name: "domainAuthority",
            check: (data) => data.initialAnalysisState?.domainAuthority !== "",
          },
          {
            name: "pageAuthority",
            check: (data) => data.initialAnalysisState?.pageAuthority !== "",
          },
          {
            name: "trustFlow",
            check: (data) => data.initialAnalysisState?.trustFlow !== "",
          },
          {
            name: "citationFlow",
            check: (data) => data.initialAnalysisState?.citationFlow !== "",
          },
        ],
      },
      contentStrategy: {
        weight: 25,
        fields: [
          {
            name: "contentStrategies",
            path: "/onboarding/step-strategy",
            check: (data) =>
              data.suggestionsFromAi?.content_strategies?.length > 0,
          },
          {
            name: "contentTypes",
            path: "/onboarding/step-strategy",
            check: (data) => data.suggestionsFromAi?.content_types?.length > 0,
          },
          {
            name: "topicClusters",
            path: "/onboarding/step-strategy",
            check: (data) => data.suggestionsFromAi?.topic_clusters?.length > 0,
          },
        ],
      },
      team: {
        weight: 15,
        fields: [
          { name: "authors", check: (data) => data.authors?.length > 0 },
        ],
      },
      analytics: {
        weight: 20,
        fields: [
          {
            name: "keywords",
            path: "/onboarding/step-keywords",
            check: (data) => data.keywords?.length > 0,
          },
          {
            name: "searchConsole",
            check: (data) =>
              Object.keys(data.searchConsoleData || {}).length > 0,
          },
        ],
      },
    };

    // Calculate completion percentage for each section
    const sectionCompletions = {};
    let totalPercentage = 0;

    for (const [sectionName, section] of Object.entries(sections)) {
      const completedFields = section.fields.filter((field) =>
        field.check(onboardingData)
      ).length;
      const sectionPercentage =
        (completedFields / section.fields.length) * section.weight;
      sectionCompletions[sectionName] = sectionPercentage;
      totalPercentage += sectionPercentage;
    }

    // Add section completion percentages to the result for detailed reporting
    const result = {
      total: Math.round(totalPercentage),
      sections: sectionCompletions,
      details: Object.entries(sections).map(([sectionName, section]) => ({
        name: sectionName,
        completedFields: section.fields.filter((field) =>
          field.check(onboardingData)
        ).length,
        totalFields: section.fields.length,
        weight: section.weight,
        percentage: Math.round(
          (section.fields.filter((field) => field.check(onboardingData))
            .length /
            section.fields.length) *
            100
        ),
      })),
    };

    return result;
  };

  return (
    <OnboardingContext.Provider
      value={{
        connectedSites,
        setConnectedSites,
        onboardingData,
        setOnboardingData,
        loading,
        getPercentageProfileCompletion,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => useContext(OnboardingContext);
