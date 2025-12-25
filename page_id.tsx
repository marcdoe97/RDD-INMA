"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type ApiRow = {
  id: string;
  name: string;
  version: string;
  description: string | null;
};

type RouteRow = {
  id: string;
  api_id: string;
  method: string;
  path: string;
  enabled: boolean;
  status_code: number | null;
  mock_response_json: any;
};

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

export default function ApiDetailPage() {
  const params = useParams<{ id?: string }>();
  const pathname = usePathname();

  const apiId = useMemo(() => {
    return typeof params?.id === "string" ? params.id : "";
  }, [params]);

  const [api, setApi] = useState<ApiRow | null>(null);
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    setError(null);

    if (!apiId || apiId === "undefined") {
      setError(`Invalid API id in URL: "${apiId}"`);
      setLoading(false);
      return;
    }

    if (!isUuid(apiId)) {
      setError(`URL param is not a valid UUID: "${apiId}"`);
      setLoading(false);
      return;
    }

    const { data: apiData, error: apiErr } = await supabase
      .from("apis")
      .select("id,name,version,description")
      .eq("id", apiId)
      .single();

    if (apiErr || !apiData) {
      setError(apiErr?.message || "API not found");
      setLoading(false);
      return;
    }

    setApi(apiData as ApiRow);

    const { data: routeData, error: routeErr } = await supabase
      .from("api_routes")
      .select(
        "id,api_id,method,path,enabled,status_code,mock_response_json"
      )
      .eq("api_id", apiId)
      .order("method", { ascending: true })
      .order("path", { ascending: true });

    if (routeErr) {
      setError(routeErr.message);
      setLoading(false);
      return;
    }

    setRoutes((routeData || []) as RouteRow[]);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiId]);

  return (
    <div style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <h1>API Details</h1>

      {/* DEBUG */}
      <div
        style={{
          marginTop: 10,
          padding: 12,
          border: "1px dashed #bbb",
          color: "#444",
        }}
      >
        <b>DEBUG</b>
        <div style={{ marginTop: 6 }}>
          <div>
            <b>pathname:</b> {pathname}
          </div>
          <div>
            <b>params.id:</b> {String(params?.id)}
          </div>
        </div>
      </div>

      {loading && <p style={{ marginTop: 16 }}>Loading…</p>}

      {error && (
        <div style={{ marginTop: 16, color: "red" }}>
          <b>Error:</b> {error}
        </div>
      )}

      {api && (
        <>
          <h2 style={{ marginTop: 20 }}>
            {api.name} v{api.version}
          </h2>

          <p style={{ color: "#666" }}>
            <b>API id:</b> {api.id}
          </p>

          {/* Monitor Button */}
          <div
            style={{
              marginTop: 10,
              display: "flex",
              gap: 12,
              alignItems: "center",
            }}
          >
            <Link href={`/portal/${api.id}/monitor`}>
              <button type="button">Open Monitor →</button>
            </Link>
            <span style={{ color: "#666" }}>
              View last calls (status / latency)
            </span>
          </div>

          {api.description && (
            <p style={{ marginTop: 10 }}>{api.description}</p>
          )}

          <h3 style={{ marginTop: 24 }}>Endpoints</h3>

          {routes.length === 0 && (
            <p style={{ color: "#666" }}>
              No routes found for this API.
            </p>
          )}

          {routes.map((r) => (
            <div
              key={r.id}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                marginTop: 10,
                paddingTop: 10,
                borderTop: "1px solid #eee",
              }}
            >
              <b>{r.method}</b>
              <span>{r.path}</span>

              <span style={{ color: "#666" }}>
                routeId: {r.id}
              </span>

              {r.enabled ? (
                <form action={`/api/try/${r.id}`} method="post">
                  <button type="submit">Try it</button>
                </form>
              ) : (
                <span style={{ color: "#999" }}>disabled</span>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
