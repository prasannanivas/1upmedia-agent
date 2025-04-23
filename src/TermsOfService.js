import React from "react";
import "./TermsOfService.css";

function TermsOfService() {
  return (
    <div className="terms-of-service">
      <h1 className="terms-of-service__title">Terms of Service</h1>
      <p className="terms-of-service__date">Last updated: April 23, 2025</p>

      <section className="terms-of-service__section">
        <h2 className="terms-of-service__section-title">
          1. Acceptance of Terms
        </h2>
        <p className="terms-of-service__text">
          By accessing or using our AI content pipeline services, you agree to
          be bound by these Terms of Service.
        </p>
      </section>

      <section className="terms-of-service__section">
        <h2 className="terms-of-service__section-title">
          2. Service Description
        </h2>
        <ul className="terms-of-service__list">
          <li className="terms-of-service__list-item">
            AI-powered content analysis and generation
          </li>
          <li className="terms-of-service__list-item">
            SEO optimization and keyword tracking
          </li>
          <li className="terms-of-service__list-item">
            Social media content automation
          </li>
          <li className="terms-of-service__list-item">
            YouTube transcript processing
          </li>
          <li className="terms-of-service__list-item">
            Analytics and performance reporting
          </li>
        </ul>
      </section>

      <section className="terms-of-service__section">
        <h2 className="terms-of-service__section-title">3. User Obligations</h2>
        <ul className="terms-of-service__list">
          <li className="terms-of-service__list-item">
            Maintain accurate account information
          </li>
          <li className="terms-of-service__list-item">
            Ensure proper authorization for connected accounts
          </li>
          <li className="terms-of-service__list-item">
            Review and approve auto-generated content
          </li>
          <li className="terms-of-service__list-item">
            Comply with all platform-specific terms
          </li>
          <li className="terms-of-service__list-item">
            Respect intellectual property rights
          </li>
        </ul>
      </section>

      <section className="terms-of-service__section">
        <h2 className="terms-of-service__section-title">
          4. API Usage and Limitations
        </h2>
        <ul className="terms-of-service__list">
          <li className="terms-of-service__list-item">
            Adherence to Google API Services Terms
          </li>
          <li className="terms-of-service__list-item">
            Compliance with Facebook Platform Policies
          </li>
          <li className="terms-of-service__list-item">
            Respect for LinkedIn API rate limits
          </li>
          <li className="terms-of-service__list-item">
            Fair usage of YouTube Data API
          </li>
        </ul>
      </section>

      <section className="terms-of-service__section">
        <h2 className="terms-of-service__section-title">
          5. Content Ownership
        </h2>
        <p className="terms-of-service__text">
          Users retain ownership of their original content. AI-generated content
          requires review and approval before publication.
        </p>
      </section>

      <section className="terms-of-service__section">
        <h2 className="terms-of-service__section-title">
          6. Service Availability
        </h2>
        <p className="terms-of-service__text">
          We strive for 99.9% uptime but do not guarantee uninterrupted service.
          Maintenance windows will be communicated in advance.
        </p>
      </section>

      <section className="terms-of-service__section">
        <h2 className="terms-of-service__section-title">7. Termination</h2>
        <ul className="terms-of-service__list">
          <li className="terms-of-service__list-item">
            Right to terminate service for violations
          </li>
          <li className="terms-of-service__list-item">
            Data export options upon termination
          </li>
          <li className="terms-of-service__list-item">
            Refund policy for prepaid services
          </li>
        </ul>
      </section>

      <section className="terms-of-service__section">
        <h2 className="terms-of-service__section-title">
          8. Liability and Disclaimer
        </h2>
        <p className="terms-of-service__text">
          Service provided "as is" without warranties. We are not liable for
          content accuracy or third-party platform changes.
        </p>
      </section>

      <section className="terms-of-service__section">
        <h2 className="terms-of-service__section-title">9. Contact</h2>
        <p className="terms-of-service__text">
          For terms-related inquiries, please contact us at: Adam@1upmedia.com
        </p>
      </section>
    </div>
  );
}

export default TermsOfService;
