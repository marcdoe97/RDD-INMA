# RDD-INMA

## Overview
This repository contains a minimal and transparent database schema for an **API Management prototype** built on **Supabase (PostgreSQL)**.

The prototype demonstrates essential API management concepts, including:
- API creation and lifecycle management
- Route-based API configuration with mocked responses
- Runtime logging and basic observability
- Foundations for API governance and coordination

The focus is on **clarity, reproducibility, and educational value**, rather than production completeness.

---

## Architecture at a Glance
The prototype is centered around three core entities:

- **APIs** – managed API products and their lifecycle state  
- **API Routes** – HTTP endpoints belonging to an API  
- **API Logs** – runtime request logs for monitoring and analysis  

Optionally, API access can be extended with:
- **API Keys** – consumer credentials for controlled access

---

## Database Schema

### `apis`
Stores the central API registry.

- Represents managed APIs with name, version and base path
- Supports lifecycle states (`draft`, `published`, `deprecated`)
- Serves as the root entity for routes and logs

### `api_routes`
Defines the technical API contract.

- Each route belongs to a single API
- Defined by HTTP method and path
- Mock responses enable API simulation without backend services
- Routes can be enabled or disabled dynamically

### `api_logs`
Captures runtime API invocations.

- Stores request metadata (method, path)
- Captures response status codes and latency
- Enables monitoring, troubleshooting and demo queries

### `api_keys` (optional)
Manages API consumer credentials.

- Stores hashed API keys (no plaintext secrets)
- Supports revocation and labeling
- Enables realistic access-control scenarios
