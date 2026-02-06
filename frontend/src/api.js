const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"
).replace(/\/+$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (err) {
    // Non-JSON responses are treated as empty payloads
  }

  if (!response.ok) {
    const detail =
      payload?.detail ||
      payload?.message ||
      (typeof payload === "string" ? payload : null) ||
      "Request failed";
    const error = new Error(detail);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export const api = {
  listEmployees() {
    return request("/employees/");
  },

  createEmployee(payload) {
    return request("/employees/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  deleteEmployee(employeeId) {
    return request(`/employees/${employeeId}/`, {
      method: "DELETE",
    });
  },

  listAttendance(employeeId, params = {}) {
    const search = new URLSearchParams();
    if (params.from) search.set("from", params.from);
    if (params.to) search.set("to", params.to);
    const query = search.toString();
    const suffix = query ? `?${query}` : "";
    return request(`/employees/${employeeId}/attendance/${suffix}`);
  },

  createAttendance(employeeId, payload) {
    return request(`/employees/${employeeId}/attendance/`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getDashboard() {
    return request("/dashboard/");
  },
};
