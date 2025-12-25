import { supabase } from "../lib/supabase";

export const dynamic = "force-dynamic";

type ApiRow = {
  id: string;
  name: string;
  version: string;
  description: string | null;
};

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export default async function Home() {
  const { data, error } = await supabase
    .from("apis")
    .select("id,name,version,description,status,created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  // Laufzeit-validieren (kein blindes "as ApiRow[]")
  const apis: ApiRow[] = (data || [])
    .map((row: any) => ({
      id: row?.id,
      name: row?.name,
      version: row?.version,
      description: row?.description ?? null,
    }))
    .filter(
      (r: any) =>
        isNonEmptyString(r.id) &&
        isNonEmptyString(r.name) &&
        isNonEmptyString(r.version)
    );

  return (
    <div style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <h1>Developer Portal</h1>
      <p>Published APIs (from Supabase)</p>

      {error && (
        <div style={{ color: "red", marginTop: 10 }}>
          Error loading APIs: {error.message}
        </div>
      )}

      {/* DEBUG: zeigt dir exakt, was vom Backend kommt (nur IDs/Namen) */}
      <div
        style={{
          marginTop: 16,
          padding: 12,
          border: "1px dashed #bbb",
          color: "#444",
        }}
      >
        <b>DEBUG (IDs from query):</b>
        <pre style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
          {JSON.stringify(
            (data || []).map((r: any) => ({ id: r?.id, name: r?.name })),
            null,
            2
          )}
        </pre>
      </div>

      {apis.length === 0 && (
        <p style={{ color: "#666", marginTop: 16 }}>
          No valid published APIs found (or missing id/name/version in result).
        </p>
      )}

      {apis.map((api) => {
        const href = `/portal/${encodeURIComponent(String(api.id))}`;

        return (
          <div
            key={api.id}
            style={{ border: "1px solid #ccc", padding: 12, marginTop: 12 }}
          >
            <h3 style={{ margin: 0 }}>
              {api.name}{" "}
              <span style={{ fontWeight: "normal" }}>v{api.version}</span>
            </h3>

            {/* DEBUG: zeigt ID + Link, so wie er gerendert wird */}
            <p style={{ margin: "6px 0", color: "#666" }}>
              <b>API ID:</b> {api.id}
              <br />
              <b>Link href:</b> {href}
            </p>

            <p style={{ marginTop: 6 }}>{api.description}</p>

            <a href={href}>View API</a>
          </div>
        );
      })}
    </div>
  );
}
