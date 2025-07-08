# Disclosure Philosophy: "Show the Recipe, Hide the Spice"

This document outlines our tiered disclosure strategy for financial calculations and algorithmic models. It serves as a guide for what information should be made public, what should be reserved for regulatory/investor review, and what constitutes protected intellectual property.

Our implementation of this philosophy in the user interface is detailed in [PARAMETER_ACCESS_STRATEGY.md](PARAMETER_ACCESS_STRATEGY.md), which outlines how we expose only public and regulatory parameters to users while keeping proprietary coefficients hidden.

## Tiered Disclosure Framework

| Layer                                                                     | Disclosed                                                           | Hidden / Obfuscated                                                        | Rationale                                                            |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Conceptual Framework** <br>(six loss domains, NPV lens, recovery logic) | ✓ Fully transparent.                                                | —                                                                          | Needed for trust; easily defensible as original thought leadership.  |
| **Mathematical Form** <br>(equations, cash‑flow model, discounting)       | ✓ Publish full formulas with placeholder variables (e.g., ρ, λ, θ). | —                                                                          | Allows peer review & GAAP dialogue.                                  |
| **Coefficient Ranges**                                                    | ✓ Give plausible bands (e.g., "recovery 70–85 %; discount 8–12 %"). | —                                                                          | Enough for stakeholders to sanity‑check without precise replication. |
| **Exact Coefficients / Weightings**                                       | —                                                                   | ✓ Stored server‑side; exposed only via compiled API or hashed config file. | Maintains trade secret & moat.                                       |
| **Data‑pull tactics** <br>(GSC, Moz, etc.)                                | High‑level overview only; no reverse‑engineering tricks.            | Implementation scripts.                                                    | Underpins credibility while keeping IP safe.                         |

## Implementation Guidelines

### Public Documentation (Whitepapers, Marketing)

- Provide conceptual explanations of all six financial domains
- Include generalized formulas with placeholder variables
- Present case studies with real results but obfuscated inputs
- Show coefficient ranges rather than exact values

### Investor Materials

- Include everything from public documentation
- Provide deeper explanation of mathematical models with sample calculations
- Show historical performance of algorithms vs. market benchmarks
- Present reasonable coefficient ranges with explanations of how they're derived

### Regulatory Documentation

- Include mathematical proofs where necessary
- Provide audit trails for calculation methodologies
- Document coefficient derivation process and validation
- Secure access to exact coefficient values when required

### Protected IP (Internal Only)

- Exact coefficient values and their derivation methodology
- Implementation details of data collection scripts
- Proprietary heuristics for data filtering and weighting
- Custom algorithms for trend detection and forecasting

## Technical Implementation

- Store sensitive coefficients server-side or in encrypted configuration
- Implement API-based calculation where possible to protect exact formulas
- Use parameter object pattern for calculation functions to allow for flexibility while hiding defaults
- Provide tiered access controls for different user types (public, investor, regulator, internal)

This philosophy maintains our competitive advantage while building necessary trust with stakeholders, regulators, and the public.
