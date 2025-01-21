import React, { useState } from "react";
import ReactMarkdown from "react-markdown"; // For Markdown parsing
import { useToast } from "../context/ToastProvider";
import "./SetupWizard.css";
import Loader from "../components/Loader";

const SetupWizard = () => {
  const [siteURL, setSiteURL] = useState("");
  const [location, setLocation] = useState("");
  const [keyword, setKeyword] = useState("");
  const [businessDetails, setBusinessDetails] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [domainAuthority, setDomainAuthority] = useState(null);
  const { PositiveToast, NegativeToast } = useToast();

  const postToBackend = async (data) => {
    try {
      const response = await fetch(
        "https://ai.1upmedia.com:443/aiagent/updateBusinessdetails",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to post data to backend");
      }

      PositiveToast("Data posted to backend successfully!");
    } catch (error) {
      NegativeToast(`Error posting to backend: ${error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First API call: Get Business Details
      const businessResponse = await fetch(
        "https://ai.1upmedia.com:443/get-business-details",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: siteURL, location, keyword }),
        }
      );

      if (!businessResponse.ok)
        throw new Error("Failed to fetch business details");
      const businessData = await businessResponse.json();
      setBusinessDetails(businessData.detail);

      // Post business details to backend
      await postToBackend({
        email: "user@example.com", // Replace with dynamic email if available
        siteData: {
          URL: siteURL,
          location,
          keywords: [keyword],
          business_details: businessData.detail,
        },
      });

      PositiveToast("Business details fetched successfully!");

      // Second API call: Get Domain Authority
      const domainResponse = await fetch(
        "https://ai.1upmedia.com:443/get-domain-authority",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ site_url: siteURL }),
        }
      );

      if (!domainResponse.ok)
        throw new Error("Failed to fetch domain authority");
      const domainData = await domainResponse.json();
      setDomainAuthority(domainData.detail?.domain_authority);

      // Post domain authority to backend
      await postToBackend({
        email: "user@example.com", // Replace with dynamic email if available
        siteData: {
          URL: siteURL,
          location,
          keywords: [keyword],
          business_details: businessData.detail,
          domain_authority: domainData.detail?.domain_authority,
        },
      });

      PositiveToast("Domain authority fetched successfully!");
    } catch (error) {
      NegativeToast(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDetailsChange = (e) => {
    setBusinessDetails(e.target.value);
  };

  const handleSave = async () => {
    try {
      // Post updated business details to backend
      await postToBackend({
        email: "user@example.com", // Replace with dynamic email if available
        siteData: {
          URL: siteURL,
          location,
          keywords: [keyword],
          business_details: businessDetails,
          domain_authority: domainAuthority,
        },
      });

      PositiveToast("Updated details saved successfully!");
    } catch (error) {
      NegativeToast(`Error saving details: ${error.message}`);
    }
  };

  return (
    <div className="setup-wizard">
      <h1 className="title">Setup Wizard</h1>
      <form onSubmit={handleSubmit} className="form-container">
        <div className="form-group">
          <label htmlFor="siteURL">Site URL:</label>
          <input
            type="text"
            id="siteURL"
            value={siteURL}
            onChange={(e) => setSiteURL(e.target.value)}
            placeholder="Enter Site URL"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="location">Location:</label>
          <input
            type="text"
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter Location"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="keyword">Keyword:</label>
          <input
            type="text"
            id="keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Enter Keyword"
            required
          />
        </div>
        <button type="submit" className="submit-button">
          Submit
        </button>
      </form>

      {/* Loading Message */}
      {isLoading && <Loader />}

      {/* Editable Business Details */}
      {!isLoading && businessDetails && (
        <div className="result-section">
          <h2>Business Details (Editable)</h2>
          <textarea
            value={businessDetails}
            onChange={handleDetailsChange}
            className="details-textarea"
          />
          <ReactMarkdown className="markdown-preview">
            {businessDetails}
          </ReactMarkdown>
          <button onClick={handleSave} className="save-button">
            Save
          </button>
        </div>
      )}

      {/* Domain Authority */}
      {!isLoading && domainAuthority && (
        <div className="result-section">
          <h2>Domain Authority</h2>
          <pre>{domainAuthority}</pre>
        </div>
      )}
    </div>
  );
};

export default SetupWizard;
