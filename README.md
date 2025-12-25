# API Management Prototype (Supabase + Next.js)

## Overview
This repository contains a **minimal but fully working API Management prototype**
consisting of:

- a **Supabase (PostgreSQL)** database schema for API management and observability
- a **Next.js (App Router) frontend** implemented in TypeScript/TSX

The prototype demonstrates core concepts of **Service and API Management** in a
transparent and reproducible way and is intended for **educational and academic use**.

---

## High-Level Architecture

Browser (Next.js / TSX)
|
| Supabase Client (read/write)
v
Supabase PostgreSQL
├─ apis
├─ api_routes
└─ api_logs


The frontend reads API definitions and routes from Supabase, triggers mock API
calls, and visualizes runtime logs and KPIs.

---

## Core Concepts Demonstrated

- API registration and lifecycle management
- Route-based API configuration (method + path)
- Mocked API execution without backend services
- Runtime logging and basic observability
- Coordination and governance through configuration and monitoring

---

## Database Schema

### `apis`
Central API registry.

- Represents managed APIs with name, version and base path
- Supports lifecycle states (`draft`, `published`, `deprecated`)
- Root entity for routes and logs

### `api_routes`
API endpoint definitions.

- Each route belongs to exactly one API
- Defined by HTTP method and path
- Mock responses stored as JSON
- Routes can be enabled or disabled dynamically

### `api_logs`
Runtime API call log.

- Stores request metadata (method, path)
- Captures status code and latency
- Enables monitoring, troubleshooting and KPI calculation

### `api_keys` (optional)
Optional API consumer credential storage.

- Stores hashed API keys
- Supports revocation and labeling
- Enables realistic access-control scenarios

---

## Frontend (Next.js / TSX)

The frontend is implemented using **Next.js App Router** and communicates directly
with Supabase via the official client.

### Main Pages

#### Developer Portal (`page.tsx`)
- Lists all **published APIs**
- Reads from `apis`
- Entry point for exploring APIs

#### API Details Page (`page_id.tsx`)
- Displays API metadata
- Lists all configured routes from `api_routes`
- Allows triggering mock API calls via a “Try it” action

#### API Monitor Page (`page.tsx` under `/monitor`)
- Displays the **last 10 API calls** for a selected API
- Reads from `api_logs`
- Shows basic KPIs:
  - average latency
  - error rate (status ≥ 400)
  - number of calls
- Supports automatic refresh (every 2 seconds) for live demos

#### API Execution Route (`route.ts`)
- Server-side endpoint that simulates an API call
- Resolves the configured route
- Writes execution data to `api_logs`
- Acts as a lightweight mock API gateway

#### Layout (`layout.tsx`)
- Global application layout
- Font and styling configuration


---

## Setup Instructions

### Prerequisites
- Supabase project (PostgreSQL)
- Node.js (for Next.js frontend)
- Supabase project URL and anon key

### Database Setup
Execute the SQL files in this order:

1. `01_schema.sql`
2. `02_indexes.sql`
3. `03_seed.sql`
4. `04_optional_api_keys.sql` (optional)

### Frontend Setup
1. Configure Supabase credentials in the frontend (`lib/supabase.ts`)
2. Install dependencies
3. Start the Next.js development server

---

## Demo Query (Database)
```sql
select created_at,
       api_id,
       method,
       path,
       status_code,
       latency_ms
from public.api_logs
order by created_at desc
limit 20;



