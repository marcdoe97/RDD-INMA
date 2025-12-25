import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

function randomLatency() {
  return Math.floor(40 + Math.random() * 220); // 40..260ms
}

function extractRouteIdFromUrl(urlStr: string): string {
  try {
    const url = new URL(urlStr);
    // erwartet: /api/try/<routeId>
    const parts = url.pathname.split("/").filter(Boolean);
    // parts = ["api","try","<routeId>"]
    const idx = parts.indexOf("try");
    if (idx >= 0 && parts.length > idx + 1) return parts[idx + 1];
    return "";
  } catch {
    return "";
  }
}

export async function POST(
  req: Request,
  ctx?: { params?: { routeId?: string } }
) {
  // 1) Primär: aus URL parsen (robust)
  const fromUrl = extractRouteIdFromUrl(req.url);

  // 2) Fallback: Next params (wenn vorhanden)
  const fromParams = ctx?.params?.routeId ?? "";

  const routeId = (fromUrl || fromParams || "").trim();

  if (!routeId || routeId === "undefined") {
    return NextResponse.json(
      {
        error: 'Invalid routeId: "undefined"',
        debug: {
          req_url: req.url,
          parsed_from_url: fromUrl,
          from_params: fromParams,
        },
      },
      { status: 400 }
    );
  }

  const { data: route, error: routeErr } = await supabase
    .from("api_routes")
    .select("id,api_id,method,path,enabled,status_code,mock_response_json")
    .eq("id", routeId)
    .single();

  if (routeErr || !route) {
    return NextResponse.json(
      { error: routeErr?.message || "Route not found", routeId },
      { status: 404 }
    );
  }

  if (!route.enabled) {
    return NextResponse.json(
      { error: "Route disabled", routeId: route.id },
      { status: 403 }
    );
  }

  const latency = randomLatency();
  const statusCode = route.status_code ?? 200;

  const { error: logErr } = await supabase.from("api_logs").insert([
    {
      api_id: route.api_id,
      route_id: route.id,
      method: route.method,
      path: route.path,
      status_code: statusCode,
      latency_ms: latency,
    },
  ]);

  if (logErr) {
    return NextResponse.json(
      { error: "Failed to write log", detail: logErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      route: { id: route.id, method: route.method, path: route.path },
      latency_ms: latency,
      status_code: statusCode,
      response: route.mock_response_json ?? { message: "ok" },
    },
    { status: 200 }
  );
}
