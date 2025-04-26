import React, { useState } from "react";
import "./CompetitorSitemapContent.css"; // optional -- add your own styles

const CompetitorSitemapContent = () => {
  /* ── state ─────────────────────────────────────────────────── */
  const [competitor, setCompetitor] = useState("");
  const [isFetchingXML, setIsFetchingXML] = useState(false);
  const [xmlError, setXmlError] = useState("");

  const [sitemaps, setSitemaps] = useState([]); // list of XML files
  const [manualXml, setManualXml] = useState(""); // single XML fallback

  const [selectedXMLs, setSelectedXMLs] = useState(new Set());

  const [isFetchingLinks, setIsFetchingLinks] = useState(false);
  const [linksMap, setLinksMap] = useState({}); // xml ⇒ [links]
  const [linksError, setLinksError] = useState("");
  const [validationStatus, setValidationStatus] = useState({}); // Add this state

  /* ── helpers ──────────────────────────────────────────────── */
  const toggleXML = (xml) => {
    setSelectedXMLs((prev) => {
      const next = new Set(prev);
      next.has(xml) ? next.delete(xml) : next.add(xml);
      return next;
    });
  };

  /* ── 1. find sitemap index (or error) ─────────────────────── */
  const handleFindSitemaps = async () => {
    if (!competitor) return;
    setIsFetchingXML(true);
    setXmlError("");
    setSitemaps([]);
    setSelectedXMLs(new Set());
    setLinksMap({});
    try {
      const res = await fetch(
        `https://ai.1upmedia.com:443/sitemap?site=${encodeURIComponent(
          competitor
        )}`
      );
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Unknown error");
      }
      const { data } = await res.json();
      const all = [...(data.mainXML || []), ...(data.blindXML || [])];
      if (!all.length) {
        throw new Error("No sitemaps found. Please enter one manually.");
      }
      setSitemaps(all);
    } catch (err) {
      setXmlError(err.message);
    } finally {
      setIsFetchingXML(false);
    }
  };

  /* ── 2. validate a manual XML file ────────────────────────── */
  const handleUseManualXml = async () => {
    if (!manualXml) return;
    setIsFetchingXML(true);
    setXmlError("");
    setSitemaps([]);
    setSelectedXMLs(new Set());
    try {
      const res = await fetch(
        `https://ai.1upmedia.com:443/sitemap/all-links?xml=${encodeURIComponent(
          manualXml
        )}`
      );
      const data = await res.json();
      if (!data.success) throw new Error("Invalid sitemap");
      // treat this single file as our child-sitemap list
      setSitemaps([manualXml]);
    } catch (err) {
      setXmlError(err.message);
    } finally {
      setIsFetchingXML(false);
    }
  };

  /* ── 3. fetch links for all selected XMLs ─────────────────── */
  const handleFetchLinks = async () => {
    if (selectedXMLs.size === 0) return;
    setIsFetchingLinks(true);
    setLinksError("");
    const newMap = {};
    const newStatus = {};

    try {
      for (const xml of selectedXMLs) {
        try {
          const res = await fetch(
            `https://ai.1upmedia.com:443/sitemap/all-links?xml=${encodeURIComponent(
              xml
            )}`
          );
          const data = await res.json();
          if (!data.success) {
            newStatus[xml] = { valid: false, error: `Invalid sitemap: ${xml}` };
            continue;
          }
          newMap[xml] = data.links;
          newStatus[xml] = { valid: true, linkCount: data.links.length };
        } catch (err) {
          newStatus[xml] = { valid: false, error: err.message };
        }
      }
      setLinksMap(newMap);
      setValidationStatus(newStatus);
    } catch (err) {
      setLinksError(err.message);
    } finally {
      setIsFetchingLinks(false);
    }
  };

  /* ── 4. toggle individual content URLs (placeholder logic) ─ */
  const [selectedLinks, setSelectedLinks] = useState(new Set());
  const toggleLink = (url) => {
    setSelectedLinks((prev) => {
      const next = new Set(prev);
      next.has(url) ? next.delete(url) : next.add(url);
      return next;
    });
  };

  /* ── render ───────────────────────────────────────────────── */
  return (
    <div className="fromcomp-sitemap">
      <div className="fromcomp-sitemap__header">
        <h2>Harvest Content Ideas from a Competitor</h2>

        <div className="fromcomp-sitemap__input-group">
          <input
            className="fromcomp-sitemap__input"
            type="text"
            value={competitor}
            onChange={(e) => setCompetitor(e.target.value)}
            placeholder="Enter competitor domain (e.g. example.com)"
          />
          <button
            className="fromcomp-sitemap__btn"
            onClick={handleFindSitemaps}
            disabled={!competitor || isFetchingXML}
          >
            {isFetchingXML ? "Searching..." : "Find Sitemaps"}
          </button>
        </div>

        {xmlError && (
          <>
            <p className="fromcomp-sitemap__error">{xmlError}</p>
            <div className="fromcomp-sitemap__input-group">
              <input
                className="fromcomp-sitemap__input"
                type="text"
                value={manualXml}
                onChange={(e) => setManualXml(e.target.value)}
                placeholder="https://example.com/sitemap.xml"
              />
              <button
                className="fromcomp-sitemap__btn"
                onClick={handleUseManualXml}
                disabled={!manualXml || isFetchingXML}
              >
                {isFetchingXML ? "Checking..." : "Use this sitemap"}
              </button>
            </div>
          </>
        )}
      </div>

      {sitemaps.length > 0 && (
        <div className="fromcomp-sitemap__sitemaps">
          {sitemaps.map((xml) => {
            const status = validationStatus[xml];
            const validityClass = status
              ? status.valid
                ? "fromcomp-sitemap__sitemap-item--valid"
                : "fromcomp-sitemap__sitemap-item--invalid"
              : "";

            return (
              <div
                key={xml}
                className={`fromcomp-sitemap__sitemap-item ${validityClass}`}
              >
                <input
                  type="checkbox"
                  className="fromcomp-sitemap__checkbox"
                  checked={selectedXMLs.has(xml)}
                  onChange={() => toggleXML(xml)}
                />
                <span className="fromcomp-sitemap__url">{xml}</span>

                {status && (
                  <div className="fromcomp-sitemap__sitemap-status">
                    {status.valid ? (
                      <>
                        <span className="fromcomp-sitemap__status-text fromcomp-sitemap__status-text--valid">
                          <svg
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            width="16"
                            height="16"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            />
                          </svg>
                          Valid sitemap
                        </span>
                        <span className="fromcomp-sitemap__link-count">
                          {status.linkCount} Links fetched
                        </span>
                      </>
                    ) : (
                      <span className="fromcomp-sitemap__status-text fromcomp-sitemap__status-text--invalid">
                        <svg
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          width="16"
                          height="16"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          />
                        </svg>
                        {status.error}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {sitemaps.length > 0 && (
        <button
          className="fromcomp-sitemap__btn"
          onClick={handleFetchLinks}
          disabled={selectedXMLs.size === 0 || isFetchingLinks}
        >
          {isFetchingLinks
            ? "Fetching links..."
            : `Fetch Links (${selectedXMLs.size} selected)`}
        </button>
      )}

      {linksError && <p className="fromcomp-sitemap__error">{linksError}</p>}

      {Object.keys(linksMap).length > 0 && (
        <div className="fromcomp-sitemap__links-container">
          <h3>Select Content URLs to Analyze</h3>
          {Object.entries(linksMap).map(([xml, links]) => (
            <div key={xml} className="fromcomp-sitemap__group">
              <h4>{xml}</h4>
              <div className="fromcomp-sitemap__links-grid">
                {links.map((url) => (
                  <div key={url} className="fromcomp-sitemap__link-item">
                    <input
                      type="checkbox"
                      className="fromcomp-sitemap__checkbox"
                      checked={selectedLinks.has(url)}
                      onChange={() => toggleLink(url)}
                    />
                    <span className="fromcomp-sitemap__url">{url}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedLinks.size > 0 && (
        <div className="fromcomp-sitemap__selected-count">
          <span>
            {selectedLinks.size} URL{selectedLinks.size > 1 ? "s" : ""} selected
          </span>
          <button
            className="fromcomp-sitemap__btn fromcomp-sitemap__btn--primary"
            onClick={() =>
              console.log("Selected URLs:", Array.from(selectedLinks))
            }
          >
            Continue with Selection
          </button>
        </div>
      )}
    </div>
  );
};

export default CompetitorSitemapContent;
