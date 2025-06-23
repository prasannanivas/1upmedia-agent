import React, { useState } from "react";
import {
  CircleDollarSign,
  Heart,
  Zap,
  Target,
  Shield,
  FolderInput,
  Unlink,
  CheckCircle,
} from "lucide-react";
import "./BucketDataVisualization.css";

const BucketDataVisualization = ({ bucketData }) => {
  const [selectedBucketKey, setSelectedBucketKey] = useState(null);

  if (!bucketData) return null;

  // Define bucket display properties
  const bucketInfo = {
    REV_OPP: {
      title: "Revenue Opportunity",
      description: "Pages with clicks but low session conversion",
      icon: <CircleDollarSign size={20} />,
      color: "#FF6B6B",
    },
    ENGAGE_OPP: {
      title: "Engagement Opportunity",
      description: "Pages with decaying performance",
      icon: <Heart size={20} />,
      color: "#4ECDC4",
    },
    CANNIBAL: {
      title: "Cannibalization Issues",
      description: "Pages competing for the same keywords",
      icon: <Unlink size={20} />,
      color: "#FF9F1C",
    },
    INTENT_OPP: {
      title: "Intent Opportunity",
      description: "Pages with keyword mismatch issues",
      icon: <Target size={20} />,
      color: "#845EC2",
    },
    AUTH_OPP: {
      title: "Authority Opportunity",
      description: "Pages with link dilution issues",
      icon: <Shield size={20} />,
      color: "#00B8A9",
    },
    RELEV_OPP: {
      title: "Relevance Opportunity",
      description: "Pages with psychological mismatch",
      icon: <Zap size={20} />,
      color: "#F9F871",
    },
    STRANDED: {
      title: "Stranded Content",
      description: "Pages with no traffic or engagement",
      icon: <FolderInput size={20} />,
      color: "#B0A8B9",
    },
    HEALTHY: {
      title: "Healthy Content",
      description: "Pages performing well",
      icon: <CheckCircle size={20} />,
      color: "#4BB543",
    },
  };

  // Calculate totals for percentage
  const totalUrls = Object.values(bucketData).reduce(
    (sum, bucket) => sum + bucket.length,
    0
  );

  // Sort buckets by count in descending order
  const sortedBuckets = Object.keys(bucketData)
    .map((key) => ({
      key,
      count: bucketData[key].length,
      percentage:
        totalUrls > 0
          ? ((bucketData[key].length / totalUrls) * 100).toFixed(1)
          : 0,
      ...bucketInfo[key],
    }))
    .sort((a, b) => b.count - a.count);

  const handleBucketClick = (bucketKey) => {
    setSelectedBucketKey(selectedBucketKey === bucketKey ? null : bucketKey);
  };

  return (
    <div className="bucket-data-container">
      <div className="bucket-visualization">
        <div className="bucket-chart">
          {sortedBuckets.map((bucket) => (
            <div
              key={bucket.key}
              className={`bucket-bar ${
                selectedBucketKey === bucket.key ? "selected" : ""
              }`}
              style={{
                width: `${Math.max(5, bucket.percentage)}%`,
                backgroundColor: bucket.color,
              }}
              onClick={() => handleBucketClick(bucket.key)}
              title={`${bucket.title}: ${bucket.count} URLs (${bucket.percentage}%)`}
            >
              <div className="bucket-bar-content">
                {bucket.icon}
                <span className="bucket-count">{bucket.count}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="bucket-legend">
          {sortedBuckets.map((bucket) => (
            <div
              key={bucket.key}
              className={`legend-item ${
                selectedBucketKey === bucket.key ? "selected" : ""
              }`}
              onClick={() => handleBucketClick(bucket.key)}
            >
              <div
                className="legend-color"
                style={{ backgroundColor: bucket.color }}
              ></div>
              <div className="legend-info">
                <div className="legend-title">
                  <span>{bucket.title}</span>
                  <span className="legend-count">{bucket.count}</span>
                </div>
                <div className="legend-description">{bucket.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedBucketKey && bucketData[selectedBucketKey] && (
        <div className="bucket-detail">
          <h3>{bucketInfo[selectedBucketKey].title} URLs</h3>
          <div className="url-list">
            {bucketData[selectedBucketKey].slice(0, 10).map((item, index) => (
              <div key={index} className="url-item">
                <span className="url-number">{index + 1}.</span>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="url-link"
                >
                  {new URL(item.url).pathname}
                </a>
                {item.metrics && (
                  <div className="url-metrics">
                    {item.metrics.gscClicks > 0 && (
                      <span className="metric-badge clicks">
                        {item.metrics.gscClicks} clicks
                      </span>
                    )}
                    {item.metrics.gaSessions > 0 && (
                      <span className="metric-badge sessions">
                        {item.metrics.gaSessions} sessions
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
            {bucketData[selectedBucketKey].length > 10 && (
              <div className="more-urls">
                + {bucketData[selectedBucketKey].length - 10} more URLs
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BucketDataVisualization;
