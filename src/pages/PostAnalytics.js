import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./PostAnalytics.css";

function PostAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { postId } = useParams();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://ai.1upmedia.com:443/pixel/analytics/article/${postId}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch analytics: ${response.statusText}`);
        }

        const data = await response.json();
        setAnalytics(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    if (postId) {
      fetchAnalytics();
    }
  }, [postId]);

  if (loading) {
    return <div className="analytics-loading">Loading analytics data...</div>;
  }

  if (error) {
    return (
      <div className="analytics-error">
        <h2>Error Loading Analytics</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!analytics) {
    return <div className="analytics-error">No analytics data available</div>;
  }

  const { overview, engagement, traffic_sources, visitor_sample } = analytics;

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>Content Analytics</h1>
        <p className="content-id">Content ID: {analytics.content_uuid}</p>
        <p className="last-updated">
          Last Updated: {new Date(analytics.last_updated).toLocaleString()}
        </p>
      </div>

      <div className="analytics-grid">
        {/* Overview Section */}
        <div className="analytics-card overview-card">
          <h2>Overview</h2>
          <div className="metrics-grid">
            <div className="metric">
              <span className="metric-value">{overview.total_pageviews}</span>
              <span className="metric-label">Total Pageviews</span>
            </div>
            <div className="metric">
              <span className="metric-value">{overview.unique_visitors}</span>
              <span className="metric-label">Unique Visitors</span>
            </div>
            <div className="metric">
              <span className="metric-value">{overview.avg_time_on_page}s</span>
              <span className="metric-label">Avg. Time on Page</span>
            </div>
            <div className="metric">
              <span className="metric-value">
                {overview.avg_engagement_time}s
              </span>
              <span className="metric-label">Avg. Engagement</span>
            </div>
            <div className="metric">
              <span className="metric-value">{overview.avg_scroll_depth}%</span>
              <span className="metric-label">Avg. Scroll Depth</span>
            </div>
            <div className="metric">
              <span className="metric-value">{overview.bounce_rate}%</span>
              <span className="metric-label">Bounce Rate</span>
            </div>
          </div>
        </div>
        {/* Engagement Section */}
        <div className="analytics-card engagement-card">
          <h2>Engagement</h2>
          <div className="engagement-details">
            <div className="scroll-distribution">
              <h3>Scroll Depth Distribution</h3>
              <div className="scroll-bars">
                {Object.entries(engagement.scroll_distribution).map(
                  ([range, count]) => (
                    <div className="scroll-bar-container" key={range}>
                      <div className="scroll-bar-label">{range}</div>
                      <div className="scroll-bar-wrapper">
                        <div
                          className="scroll-bar"
                          style={{
                            width: `${
                              (count /
                                Math.max(
                                  ...Object.values(
                                    engagement.scroll_distribution
                                  )
                                )) *
                              100
                            }%`,
                            opacity: count > 0 ? 1 : 0.3,
                          }}
                        ></div>
                        <span className="scroll-bar-value">{count}</span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="clicks-section">
              <h3>User Interactions</h3>
              <div className="clicks-overview">
                <div className="total-clicks">
                  <span className="clicks-number">{engagement.clicks}</span>
                  <span className="clicks-label">Total Clicks</span>
                </div>
              </div>

              {engagement.click_heatmap_data &&
                engagement.click_heatmap_data.length > 0 && (
                  <div className="click-details">
                    <h4>Click Details</h4>
                    <div className="click-list-container">
                      <ul className="click-list">
                        {engagement.click_heatmap_data.map((click, index) => (
                          <li key={index} className="click-item">
                            <div className="click-element">
                              <strong>Element:</strong> {click.element}
                              {click.isLink && (
                                <span className="link-badge">Link</span>
                              )}
                            </div>
                            <div className="click-position">
                              <span>
                                Position: ({click.x}, {click.y})
                              </span>
                            </div>
                            <div className="click-time">
                              <span>
                                Time:{" "}
                                {new Date(click.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>{" "}
        {/* Traffic Sources */}
        <div className="analytics-card traffic-card">
          <h2>Traffic Sources</h2>
          <div className="referrers-list">
            <h3>Top Referrers</h3>
            {traffic_sources &&
            traffic_sources.top_referrers &&
            Object.keys(traffic_sources.top_referrers).length > 0 ? (
              <ul>
                {Object.entries(traffic_sources.top_referrers).map(
                  ([source, count]) => (
                    <li key={source} className="referrer-item">
                      <a
                        href={
                          source.startsWith("http")
                            ? source
                            : `https://${source}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="referrer-domain-link"
                      >
                        {source}
                        <span className="external-link-icon">↗</span>
                      </a>
                      <span className="referrer-count">{count} visits</span>
                    </li>
                  )
                )}
              </ul>
            ) : (
              <p className="no-data-message">No referrer data available</p>
            )}
          </div>
        </div>
        {/* Content URL Section */}
        <div className="analytics-card url-card">
          <h2>Content URL</h2>
          <div className="url-container">
            {traffic_sources &&
            traffic_sources.top_pages &&
            Object.keys(traffic_sources.top_pages).length > 0 ? (
              <>
                <p className="page-url-label">Page URL:</p>
                {Object.keys(traffic_sources.top_pages).map(
                  (pageUrl, index) => (
                    <div key={index} className="page-url-value">
                      <a
                        href={pageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="url-link"
                      >
                        {pageUrl}
                        <span className="external-link-icon">↗</span>
                      </a>
                      <span className="page-view-count">
                        {traffic_sources.top_pages[pageUrl]} views
                      </span>
                      <button
                        className="visit-button"
                        onClick={() => window.open(pageUrl, "_blank")}
                      >
                        Visit Page
                      </button>
                    </div>
                  )
                )}
              </>
            ) : visitor_sample &&
              visitor_sample[0] &&
              visitor_sample[0].page_url ? (
              <>
                <p className="page-url-label">Page URL:</p>
                <div className="page-url-value">
                  <a
                    href={visitor_sample[0].page_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="url-link"
                  >
                    {visitor_sample[0].page_url}
                    <span className="external-link-icon">↗</span>
                  </a>
                  <button
                    className="visit-button"
                    onClick={() =>
                      window.open(visitor_sample[0].page_url, "_blank")
                    }
                  >
                    Visit Page
                  </button>
                </div>
              </>
            ) : (
              <p className="no-url-message">
                No direct URL available for this content.
              </p>
            )}

            {traffic_sources &&
              traffic_sources.top_referrers &&
              Object.keys(traffic_sources.top_referrers).length > 0 && (
                <div className="url-section">
                  <h3>Traffic Sources</h3>
                  <ul className="viewed-on-list">
                    {Object.keys(traffic_sources.top_referrers).map(
                      (domain, index) => (
                        <li key={index} className="viewed-on-item">
                          <a
                            href={
                              domain.startsWith("http")
                                ? domain
                                : `https://${domain}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="domain-link"
                          >
                            {domain}
                            <span className="external-link-icon">↗</span>
                          </a>
                          <span className="view-count">
                            {traffic_sources.top_referrers[domain]} visits
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
          </div>
        </div>
        {/* Visitor Sample */}
        <div className="analytics-card visitors-card">
          <h2>Visitor Samples</h2>
          <div className="visitor-list">
            {visitor_sample.map((visitor, index) => (
              <div key={index} className="visitor-item">
                <div className="visitor-id">
                  ID: {visitor.visitor_id.substring(0, 8)}...
                </div>
                <div className="visitor-details">
                  <div className="visitor-detail">
                    <strong>First seen:</strong>{" "}
                    {new Date(visitor.first_seen).toLocaleString()}
                  </div>
                  <div className="visitor-detail">
                    <strong>Last seen:</strong>{" "}
                    {new Date(visitor.last_seen).toLocaleString()}
                  </div>{" "}
                  {visitor.page_url && (
                    <div className="visitor-detail visitor-url">
                      <strong>Page URL:</strong>{" "}
                      <a
                        href={visitor.page_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="visitor-url-link"
                        title={visitor.page_url}
                      >
                        {visitor.page_url.length > 40
                          ? visitor.page_url.substring(0, 40) + "..."
                          : visitor.page_url}
                        <span className="external-link-icon">↗</span>
                      </a>
                      <button
                        className="mini-visit-button"
                        onClick={() => window.open(visitor.page_url, "_blank")}
                        title="Open page in new tab"
                      >
                        Visit
                      </button>
                    </div>
                  )}
                  <div className="visitor-detail">
                    <strong>Engagement time:</strong> {visitor.engagement_time}s
                  </div>
                  <div className="visitor-detail">
                    <strong>Max scroll:</strong> {visitor.max_scroll}%
                  </div>
                  <div className="visitor-detail">
                    <strong>Event count:</strong> {visitor.events_count}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PostAnalytics;
