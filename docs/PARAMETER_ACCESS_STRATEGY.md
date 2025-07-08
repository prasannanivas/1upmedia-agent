# Parameter Access Strategy

## Overview

This document outlines our strategy for exposing financial calculation parameters to users in the dashboard interface. This strategy aligns with our broader "Show the Recipe, Hide the Spice" disclosure philosophy, where we maintain transparency about our methodologies while protecting proprietary coefficients and algorithms.

## Parameter Classification

We classify parameters into three categories:

1. **Public Parameters** - Fully exposed and editable by users

   - Industry standard metrics
   - Common financial parameters
   - Example: conversion rates, discount rates

2. **Regulatory Parameters** - Exposed with some limitations

   - Parameters necessary for regulatory compliance
   - Parameters discussed in investor documentation
   - Example: recovery rates, content lifespan estimates, content production costs

3. **Proprietary Parameters** - Hidden from user interface
   - Core algorithm coefficients
   - Proprietary thresholds and multipliers
   - Example: risk thresholds, click loss multipliers, impact factors

## User Interface Implementation

The Calculation Parameters Modal implements this strategy by:

1. **Grouping Parameters Functionally** - Parameters are organized by their business function rather than by calculation module

   - Core Business Parameters (conversion rates, discount rates)
   - Content Investment Parameters (content costs, content lifespan)
   - Recovery Parameters (recovery rates for various calculations)

2. **Visual Differentiation** - Parameters are visually marked to indicate their classification:

   - Public parameters have green badges
   - Regulatory parameters have blue badges
   - Proprietary parameters are not shown individually but summarized in a note

3. **Parameter Consolidation** - Global parameters that appear in multiple calculations (like conversion rates) are unified to a single control

4. **Transparency Note** - A clear explanation informs users about which parameters are editable and why certain parameters are not exposed

## Technical Implementation

Technically, the strategy is implemented by:

1. Defining explicitly which parameters are editable in the `editableParams` object
2. Using the `isEditable` function to determine whether a parameter can be modified
3. Only rendering UI controls for editable parameters
4. Consolidating duplicate parameters across calculation modules
5. Providing explanatory text for proprietary parameters

## Future Enhancements

Potential future enhancements to this strategy may include:

1. **Tiered Access** - Different parameter access based on user role (e.g., public user, investor, regulator)
2. **Parameter Documentation** - Tooltips and help text explaining each parameter's meaning and impact
3. **Parameter History** - Tracking changes to parameters over time for audit purposes
4. **Parameter Presets** - Industry-specific parameter configurations
5. **Parameter Validation** - Rules to prevent invalid or extreme parameter values

## Alignment with Disclosure Philosophy

This parameter access strategy implements our disclosure philosophy by:

- **Showing the Recipe** - Exposing the structure of calculations and primary variables
- **Hiding the Spice** - Protecting proprietary coefficients and algorithm details
- **Building Trust** - Providing clear explanations about what is shown and what is not
- **Supporting Compliance** - Enabling regulatory access to required parameters
