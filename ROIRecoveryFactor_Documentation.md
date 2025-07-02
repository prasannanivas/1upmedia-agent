# ROI Recovery Factor - Documentation

## Overview

This document explains the data-driven approach used to calculate the ROI Recovery Potential, particularly for the 360-day recovery timeframe.

## Recovery Factor Calculation

Instead of using a fixed percentage (previously 70%), the system now calculates a weighted recovery factor based on the specific composition of content issues in your website. This makes the recovery potential calculation more accurate, transparent, and tailored to your unique situation.

## Category-Specific Recovery Rates

Each type of content issue has a different expected recoverability rate, based on industry benchmarks and our experience:

| Content Issue Type      | Recovery Rate | Rationale                                                                     |
| ----------------------- | ------------- | ----------------------------------------------------------------------------- |
| Content Decay           | 80%           | Content decay is highly reversible through content refreshes and updates      |
| Keyword Mismatch        | 75%           | Keyword optimization has high recovery potential through targeted changes     |
| Keyword Cannibalization | 65%           | Cannibalization resolution requires more complex content restructuring        |
| Link Structure          | 60%           | Link structure improvements have moderate recovery rates due to indexing time |
| Funnel Alignment        | 55%           | Funnel issues require more comprehensive changes to user journeys             |

## Weighted Calculation Method

1. For each category of content issue, the system determines what proportion of your total loss it represents.
2. The system multiplies each category's proportion by its respective recovery rate.
3. These weighted rates are summed to produce a final, weighted recovery factor specific to your content issues.
4. This factor is bounded between 55% and 85% to ensure realistic projections.

## Example Calculation

If your content issues break down as:

- 40% Content Decay (80% recoverable)
- 30% Keyword Mismatch (75% recoverable)
- 20% Cannibalization (65% recoverable)
- 10% Link Structure (60% recoverable)

Your weighted recovery factor would be:
(0.4 × 0.8) + (0.3 × 0.75) + (0.2 × 0.65) + (0.1 × 0.6) = 0.74 or 74%

## Benefits of This Approach

1. **Data-driven**: Recovery potential is based on your actual content issue distribution
2. **Transparent**: Clear methodology that can be explained to stakeholders
3. **Customized**: Different websites will have different recovery factors based on their issues
4. **Realistic**: Provides a more accurate prediction of recovery potential

The 360-day recovery potential is calculated by applying this weighted recovery factor to your total system loss, giving you a realistic target for what you can potentially recover through comprehensive content optimization.
