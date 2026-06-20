# CrimeLens Dashboard Statistics Reference

This document outlines all metrics, statistics, and data fields displayed across the CrimeLens Tactical Command Dashboard.

## 1. KPI Overview Cards (Top Summary Row)
* **Total Crimes (Active Selection)**: The count of incidents matching the currently applied search queries and filters (type, severity, district, date range).
* **High Risk Districts**: The count of Karnataka districts currently flagged as high-risk (having a calculated `Risk Index ≥ 70`).
* **Critical Alerts**: The count of active, unread critical alerts logged in the system.
* **Resolution Rate**: The average clearance rate across all 30 districts in Karnataka (calculated from individual district resolution percentages).

## 2. Map Viewport Summary Card (Floating Top-Left Overlay)
* **Context**: Identifies whether the metrics show a statewide **State Overview** or specific **District Insights**.
* **Entity Name**: Displays either "Karnataka State" or the name of the clicked/selected district.
* **Crimes (30d)**: Cumulative crimes logged in the past 30 days for the active selection.
* **Risk Index**: Overall risk rating scored out of 100.
* **Trend**: Directional indicators for crime velocity (`increasing` 🔴, `stable` ⚪, or `decreasing` 🟢).

## 3. District Comparison Panels (Bottom Comparative Matrix)
* **District Name**: Title of the card representing the compared district.
* **Crimes (30d)**: Total counts of reported incidents in that district over the last 30 days.
* **MoM Growth**: Month-over-Month growth percentage of incidents (colored red for increases, green for decreases).
* **Risk Score**: Calculated risk factor out of 100 (colored red for critical, blue for high, slate for low).
* **Clearance Rate**: Percentage of crimes successfully resolved or closed by police divisions.
* **Active Trend**: Categorized status indicators (`increasing`, `stable`, `decreasing`) with visual status dots.

## 4. Incident Logs (Granular Records Grid)
* **Case #**: Official unique ID number assigned to the incident.
* **Incident Type**: Category classification of the crime (e.g. `Burglary`, `Narcotics`, `Assault`, `Theft`, `Cyber`, `Homicide`).
* **Description**: Brief narrative summarizing the crime details and officer responses.
* **Location / Area**: Specific sector or zone address details.
* **Date & Time**: Exact chronological timestamp of the dispatch.
* **Severity**: Interactive color badges marking severity levels (`low`, `medium`, `high`, `critical`).
* **Status**: Status badge showing response states (`open` 🔴, `investigating` 🟡, `resolved` 🟢, `closed` ⚪).
