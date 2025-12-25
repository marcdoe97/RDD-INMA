"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

type LogRow = {
  id: string;
  created_at: string;
  api_id: string;
  route_id: string;
  method: string;
  path: string;
  status_code: number;
  latency_ms: number;
};

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

function fmtTs(ts: string) {
  try {
    const d = new Date(ts);
    return d.toLocaleString();
  } catch {
    return ts;
  }
}

export default function ApiMonitorPage() {
  const params = useParams<{ id?: string }>();
  const pathname = usePathname();

  const apiId = useMemo(() => {
    const id = params?.id;
    return typeof id === "string" ? id : "";
  }, [params]);

  const [logs, setLogs] = useState<LogRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  async function loadLogs() {
    setLoading(true);
    setError(null);

    if (!apiId || apiId === "undefined") {
      setLoading(false);
      setError(`Invalid API id in URL. params.id="${String(apiId)}"`);
      return;
    }
    if (!isUuid(apiId)) {
      setLoading(false);
      setError(`URL param is not a valid UUID: "${apiId}"`);
      return;
    }

    const { data, error: qErr } = await supabase
      .from("api_logs")
      .select(
        "id,created_at,api_id,route_id,method,path,status_code,latency_ms"
      )
      .eq("api_id", apiId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (qErr) {
      setLoading(false);
      setError(qErr.message);
      return;
    }

    setLogs((data || []) as LogRow[]);
    setLoading(false);
  }

  useEffect(() => {
    let timer: any = null;

    // initial load
    loadLogs();

    // auto refresh alle 2s (für Demo angenehm)
    if (autoRefresh) {
      timer = setInterval(() => {
        loadLogs();
      }, 2000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiId, autoRefresh]);

  const avgLatency = useMemo(() => {
    if (!logs.length) return null;
    const sum = logs.reduce((acc, l) => acc + (l.latency_ms ?? 0), 0);
    return Math.round(sum / logs.length);
  }, [logs]);

  const errorRate = useMemo(() => {
    if (!logs.length) return null;
    const errors = logs.filter((l) => (l.status_code ?? 0) >= 400).length;
    return Math.round((errors / logs.length) * 100);
  }, [logs]);

  return (
    <div style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <h1 style={{ margin: 0 }}>API Monitor</h1>
        <span style={{ color: "#666" }}>
          (Last 10 calls for this API)
        </span>
      </div>

      <div style={{ marginTop: 10, color: "#666" }}>
        <b>API id:</b> {apiId}
      </div>

      {/* DEBUG */}
      <div
        style={{
          marginTop: 12,
          padding: 12,
          border: "1px dashed #bbb",
          color: "#444",
        }}
      >
        <b>DEBUG</b>
        <div style={{ marginTop: 8 }}>
          <div>
            <b>pathname:</b> {pathname}
          </div>
          <div>
            <b>params.id:</b> {String(params?.id)}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
        <Link href={`/portal/${apiId}`} style={{ textDecoration: "underline" }}>
          ← Back to API Details
        </Link>

        <button onClick={loadLogs} type="button">
          Refresh now
        </button>

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          Auto refresh (2s)
        </label>
      </div>

      {/* KPI Mini-Kacheln */}
      <div
        style={{
          marginTop: 16,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            border: "1px solid #eee",
            padding: 12,
            minWidth: 220,
          }}
        >
          <div style={{ color: "#666" }}>Avg. Latency (last 10)</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>
            {avgLatency === null ? "—" : `${avgLatency} ms`}
          </div>
        </div>

        <div
          style={{
            border: "1px solid #eee",
            padding: 12,
            minWidth: 220,
          }}
        >
		  <div style={{ color: "#666" }}>Error Rate (&gt;= 400)</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>
            {errorRate === null ? "—" : `${errorRate}%`}
          </div>
        </div>

        <div
          style={{
            border: "1px solid #eee",
            padding: 12,
            minWidth: 220,
          }}
        >
          <div style={{ color: "#666" }}>Calls shown</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{logs.length}</div>
        </div>
      </div>

      {loading && <p style={{ marginTop: 16 }}>Loading…</p>}

      {error && (
        <div style={{ marginTop: 16, color: "red" }}>
          <b>Error:</b> {error}
        </div>
      )}

      <h3 style={{ marginTop: 20 }}>Recent Calls</h3>

      {(!loading && logs.length === 0 && !error) && (
        <p style={{ color: "#666" }}>
          No logs yet. Click “Try it” on the API Details page to generate calls.
        </p>
      )}

      {logs.length > 0 && (
        <div style={{ marginTop: 10, border: "1px solid #eee" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "200px 90px 1fr 110px 110px",
              gap: 0,
              padding: 10,
              borderBottom: "1px solid #eee",
              background: "#fafafa",
              fontWeight: 700,
            }}
          >
            <div>Timestamp</div>
            <div>Method</div>
            <div>Path</div>
            <div>Status</div>
            <div>Latency</div>
          </div>

          {logs.map((l) => (
            <div
              key={l.id}
              style={{
                display: "grid",
                gridTemplateColumns: "200px 90px 1fr 110px 110px",
                padding: 10,
                borderBottom: "1px solid #f2f2f2",
                alignItems: "center",
              }}
            >
              <div style={{ color: "#444" }}>{fmtTs(l.created_at)}</div>
              <div>
                <b>{l.method}</b>
              </div>
              <div style={{ color: "#444" }}>{l.path}</div>
              <div style={{ color: l.status_code >= 400 ? "red" : "#444" }}>
                {l.status_code}
              </div>
              <div style={{ color: "#444" }}>{l.latency_ms} ms</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
