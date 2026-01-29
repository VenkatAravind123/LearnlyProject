import React, { useEffect, useMemo, useState } from "react";
import Loader from "../components/Loader";

const API_BASE = "http://localhost:5000";

export default function Users({ search }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        setError("");
        setLoading(true);

        const res = await fetch(`${API_BASE}/api/admin/actions/getusers`, {
          credentials: "include",
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data?.error || data?.message || "Failed to load users");

        if (!ignore) setUsers(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!ignore) setError(e.message || "Failed to load users");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    if (!q) return users;
  //const nonAdmins = users.filter((u) => String(u.role || "".toLowerCase() !== "admin"));  //admin Only list

    return users.filter((u) => {
      const name = String(u.name || "").toLowerCase();
      const email = String(u.email || "").toLowerCase();
      const role = String(u.role || "").toLowerCase();
      return name.includes(q) || email.includes(q) || role.includes(q);
    });
  }, [search, users]);

  return (
    <section>
      <div className="section-header">
        <h3>Users</h3>
        <p className="muted">All registered users.</p>
      </div>

      {loading && (
        <div className="loading-center" style={{ padding: "1rem 0" }}>
          <div className="loading-inline">
            <Loader size={20} color="#646cff" />
            <div className="muted">Loading users…</div>
          </div>
        </div>
      )}
      {error && <div className="muted">{error}</div>}

      {!loading && !error && (
        <div className="card" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>ID</th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Name</th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Email</th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Role</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td style={{ padding: "0.5rem" }}>{u.id}</td>
                  <td style={{ padding: "0.5rem" }}>{u.name}</td>
                  <td style={{ padding: "0.5rem" }}>{u.email}</td>
                  <td style={{ padding: "0.5rem" }}>{u.role}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: "0.75rem" }} className="muted">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}