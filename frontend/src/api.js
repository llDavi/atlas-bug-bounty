const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/* One door to the backend. Sends the Clerk session token when a getToken is
   given, and turns a refusal into an Error that still carries its status, so
   callers can tell "not registered" (404) from "the register is down". */
export async function api(path, { getToken, method = "GET", body } = {}) {
  const headers = {};
  const token = getToken ? await getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const detail = data && typeof data.detail === "string" ? data.detail : null;
    const err = new Error(detail || `The register refused the request (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}
