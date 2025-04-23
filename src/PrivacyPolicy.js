import React from "react";
import "./PrivacyPolicy.css";

function PrivacyPolicy() {
  return (
    <div className="privacy-policy">
      <h1 className="privacy-policy__title">Privacy Policy</h1>
      <p className="privacy-policy__date">Last updated: April 23, 2025</p>

      <section className="privacy-policy__section">
        <h2 className="privacy-policy__section-title">
          1. Information We Collect
        </h2>
        <ul className="privacy-policy__list">
          <li className="privacy-policy__list-item">
            Google account information (email, profile data)
          </li>
          <li className="privacy-policy__list-item">
            Google Search Console data
          </li>
          <li className="privacy-policy__list-item">
            YouTube video transcripts
          </li>
          <li className="privacy-policy__list-item">
            Social media account access tokens (Facebook, LinkedIn)
          </li>
          <li className="privacy-policy__list-item">
            Content analytics and performance metrics
          </li>
          <li className="privacy-policy__list-item">
            Website interaction data
          </li>
        </ul>
      </section>

      <section className="privacy-policy__section">
        <h2 className="privacy-policy__section-title">
          2. How We Use Your Information
        </h2>
        <ul className="privacy-policy__list">
          <li className="privacy-policy__list-item">
            Authenticate your access using Google Sign-In
          </li>
          <li className="privacy-policy__list-item">
            Analyze Search Console data for SEO optimization
          </li>
          <li className="privacy-policy__list-item">
            Process YouTube transcripts for content creation
          </li>
          <li className="privacy-policy__list-item">
            Auto-post content to social media platforms
          </li>
          <li className="privacy-policy__list-item">
            Track content performance and keyword rankings
          </li>
          <li className="privacy-policy__list-item">
            Generate AI-powered content recommendations
          </li>
        </ul>
      </section>

      <section className="privacy-policy__section">
        <h2 className="privacy-policy__section-title">
          3. Third-Party Services
        </h2>
        <p className="privacy-policy__text">
          We integrate with the following services:
        </p>
        <ul className="privacy-policy__list">
          <li className="privacy-policy__list-item">
            Google (Search Console, Authentication, YouTube API)
          </li>
          <li className="privacy-policy__list-item">
            Facebook (Authentication, Content Publishing API)
          </li>
          <li className="privacy-policy__list-item">
            LinkedIn (Authentication,Content Publishing API)
          </li>
        </ul>
      </section>

      <section className="privacy-policy__section">
        <h2 className="privacy-policy__section-title">4. Data Protection</h2>
        <p className="privacy-policy__text">
          We implement security measures to protect your data:
        </p>
        <ul className="privacy-policy__list">
          <li className="privacy-policy__list-item">
            Secure OAuth 2.0 authentication
          </li>
          <li className="privacy-policy__list-item">
            Encrypted data transmission
          </li>
          <li className="privacy-policy__list-item">Regular security audits</li>
          <li className="privacy-policy__list-item">
            Limited data retention periods
          </li>
        </ul>
      </section>

      <section className="privacy-policy__section">
        <h2 className="privacy-policy__section-title">5. User Rights</h2>
        <ul className="privacy-policy__list">
          <li className="privacy-policy__list-item">Access your stored data</li>
          <li className="privacy-policy__list-item">Request data deletion</li>
          <li className="privacy-policy__list-item">
            Opt-out of automatic posting
          </li>
          <li className="privacy-policy__list-item">
            Modify platform connections
          </li>
          <li className="privacy-policy__list-item">Export your data</li>
        </ul>
      </section>

      <section className="privacy-policy__section">
        <h2 className="privacy-policy__section-title">6. Data Retention</h2>
        <p className="privacy-policy__text">
          We retain your data for as long as your account is active or as needed
          for our services. You can request data deletion at any time.
        </p>
      </section>

      <section className="privacy-policy__section">
        <h2 className="privacy-policy__section-title">7. Compliance</h2>
        <ul className="privacy-policy__list">
          <li className="privacy-policy__list-item">
            Google API Services User Data Policy
          </li>
          <li className="privacy-policy__list-item">Facebook Platform Terms</li>
          <li className="privacy-policy__list-item">
            LinkedIn API Terms of Use
          </li>
          <li className="privacy-policy__list-item">
            GDPR and CCPA compliance where applicable
          </li>
        </ul>
      </section>

      <section className="privacy-policy__section">
        <h2 className="privacy-policy__section-title">8. Contact</h2>
        <p className="privacy-policy__text">
          For privacy-related inquiries, please contact us at: Adam@1upmedia.com
        </p>
      </section>
    </div>
  );
}

export default PrivacyPolicy;
