import { useState } from "react";
import "./App.css";

const API = "http://localhost:5000/api";

export default function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem("token") || ""
  );

  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [search, setSearch] = useState("");
  const [candidate, setCandidate] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [message, setMessage] = useState("");
  const [page, setPage] = useState("dashboard");

  const [form, setForm] = useState({
    candidateId: "",
    fullName: "",
    phone: "",
    email: "",
    licenseNumber: "",
    licenseCategory: "LMV",
    admissionDate: new Date().toISOString().slice(0, 10),
    trainingStatus: "Not Started",
    totalFees: 0,
    paidFees: 0,
    remarks: "",
  });

  async function request(path, options = {}) {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong.");
    }

    return data;
  }

  async function login(event) {
    event.preventDefault();
    setMessage("");

    try {
      const data = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (data.user.role !== "admin" && data.user.role !== "staff") {
        throw new Error("This website is for admin and staff accounts.");
      }

      localStorage.setItem("token", data.token);
      setToken(data.token);
      setUser(data.user);
      setMessage("");
    } catch (error) {
      setMessage(error.message);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
    setCandidate(null);
    setCandidates([]);
    setMessage("");
  }

  async function searchCandidate(event) {
    event.preventDefault();
    setMessage("");
    setCandidate(null);

    try {
      const data = await request(
        `/candidates/search?query=${encodeURIComponent(search)}`
      );

      setCandidate(data.candidate);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function loadCandidates() {
    setMessage("");

    try {
      const data = await request("/candidates");
      setCandidates(data.candidates);
      setPage("candidates");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function addCandidate(event) {
    event.preventDefault();
    setMessage("");

    try {
      await request("/candidates", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          totalFees: Number(form.totalFees),
          paidFees: Number(form.paidFees),
        }),
      });

      setMessage("Candidate registered successfully!");

      setForm({
        candidateId: "",
        fullName: "",
        phone: "",
        email: "",
        licenseNumber: "",
        licenseCategory: "LMV",
        admissionDate: new Date().toISOString().slice(0, 10),
        trainingStatus: "Not Started",
        totalFees: 0,
        paidFees: 0,
        remarks: "",
      });

      setPage("dashboard");
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (!token) {
    return (
      <main className="login-page">
        <form className="login-card" onSubmit={login}>
          <div className="brand-icon">D</div>

          <h1>DMDS Portal</h1>
          <p>Driving School Management System</p>

          <label>Email address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />

          {message && <div className="alert">{message}</div>}

          <button className="primary-button" type="submit">
            Sign in
          </button>

          <small>Authorized personnel only.</small>
        </form>
      </main>
    );
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">D</span>
          <div>
            <strong>DMDS</strong>
            <small>Driving School</small>
          </div>
        </div>

        <p className="nav-heading">MAIN MENU</p>

        <button
          className={page === "dashboard" ? "nav-item active" : "nav-item"}
          onClick={() => setPage("dashboard")}
        >
          ◫ Dashboard
        </button>

        <button
          className={page === "candidates" ? "nav-item active" : "nav-item"}
          onClick={loadCandidates}
        >
          ♙ All Candidates
        </button>

        <button
          className={page === "add" ? "nav-item active" : "nav-item"}
          onClick={() => {
            setMessage("");
            setPage("add");
          }}
        >
          + Register Candidate
        </button>

        <button className="nav-item logout" onClick={logout}>
          ↪ Sign Out
        </button>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <h2>
              {page === "dashboard"
                ? "Dashboard"
                : page === "add"
                ? "Register Candidate"
                : "All Candidates"}
            </h2>
            <p>Driving School Management Portal</p>
          </div>

          <div className="profile">
            <div className="avatar">
              {(user?.fullName || "A").charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>{user?.fullName || "Administrator"}</strong>
              <small>{user?.role || "Admin"}</small>
            </div>
          </div>
        </header>

        {message && (
          <div className="alert">
            {message}
            <button
              className="close-alert"
              onClick={() => setMessage("")}
            >
              ×
            </button>
          </div>
        )}

        {page === "dashboard" && (
          <>
            <section className="welcome">
              <div>
                <span className="eyebrow">ADMINISTRATION</span>
                <h1>Welcome back!</h1>
                <p>Manage candidates and access their folios.</p>
              </div>

              <button
                className="primary-button"
                onClick={() => {
                  setMessage("");
                  setPage("add");
                }}
              >
                + New Candidate
              </button>
            </section>

            <section className="stat-grid">
              <div className="stat-card">
                <span>Total Candidates</span>
                <h2>{candidates.length || "—"}</h2>
                <p>Registered student records</p>
              </div>

              <div className="stat-card">
                <span>Candidate Search</span>
                <h2>⌕</h2>
                <p>Find records instantly</p>
              </div>

              <div className="stat-card">
                <span>Management</span>
                <h2>✓</h2>
                <p>Admission and training records</p>
              </div>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h3>Find a Candidate</h3>
                  <p>Search using a school folio number or license number.</p>
                </div>
              </div>

              <form className="search-form" onSubmit={searchCandidate}>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="e.g. DMDS-001 or license number"
                  required
                />
                <button className="primary-button" type="submit">
                  Search
                </button>
              </form>
            </section>

            {candidate && <CandidateFolio candidate={candidate} />}
          </>
        )}

        {page === "add" && (
          <section className="panel">
            <h3>Candidate Information</h3>
            <p>Enter the student's admission details.</p>

            <form className="candidate-form" onSubmit={addCandidate}>
              <Field
                label="School Folio Number"
                value={form.candidateId}
                onChange={(v) => setForm({ ...form, candidateId: v })}
                required
              />

              <Field
                label="Full Name"
                value={form.fullName}
                onChange={(v) => setForm({ ...form, fullName: v })}
                required
              />

              <Field
                label="Phone Number"
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
                required
              />

              <Field
                label="Email"
                type="email"
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
              />

              <Field
                label="Driving License Number (optional)"
                value={form.licenseNumber}
                onChange={(v) => setForm({ ...form, licenseNumber: v })}
              />

              <div className="field">
                <label>License Category</label>
                <select
                  value={form.licenseCategory}
                  onChange={(e) =>
                    setForm({ ...form, licenseCategory: e.target.value })
                  }
                >
                  <option value="LMV">LMV</option>
                  <option value="HMV">HMV</option>
                  <option value="MCWG">MCWG</option>
                  <option value="MCWOG">MCWOG</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <Field
                label="Admission Date"
                type="date"
                value={form.admissionDate}
                onChange={(v) => setForm({ ...form, admissionDate: v })}
                required
              />

              <div className="field">
                <label>Training Status</label>
                <select
                  value={form.trainingStatus}
                  onChange={(e) =>
                    setForm({ ...form, trainingStatus: e.target.value })
                  }
                >
                  <option>Not Started</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                </select>
              </div>

              <Field
                label="Total Fees (₹)"
                type="number"
                value={form.totalFees}
                onChange={(v) => setForm({ ...form, totalFees: v })}
              />

              <Field
                label="Fees Paid (₹)"
                type="number"
                value={form.paidFees}
                onChange={(v) => setForm({ ...form, paidFees: v })}
              />

              <div className="field full-width">
                <label>Remarks</label>
                <textarea
                  value={form.remarks}
                  onChange={(e) =>
                    setForm({ ...form, remarks: e.target.value })
                  }
                  placeholder="Additional information"
                />
              </div>

              <div className="form-actions full-width">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setPage("dashboard")}
                >
                  Cancel
                </button>

                <button type="submit" className="primary-button">
                  Register Candidate
                </button>
              </div>
            </form>
          </section>
        )}

        {page === "candidates" && (
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h3>Registered Candidates</h3>
                <p>All candidate records in the database.</p>
              </div>

              <button
                className="secondary-button"
                onClick={loadCandidates}
              >
                Refresh
              </button>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Folio No.</th>
                    <th>Candidate</th>
                    <th>Phone</th>
                    <th>Training</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {candidates.map((c) => (
                    <tr key={c._id}>
                      <td>{c.candidateId}</td>
                      <td>{c.fullName}</td>
                      <td>{c.phone}</td>
                      <td>{c.trainingStatus}</td>
                      <td>
                        <button
                          className="text-button"
                          onClick={async () => {
                            try {
                              const data = await request(
                                `/candidates/${c._id}`
                              );
                              setCandidate(data.candidate);
                              setSearch(c.candidateId);
                              setPage("dashboard");
                            } catch (error) {
                              setMessage(error.message);
                            }
                          }}
                        >
                          View Folio
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {candidates.length === 0 && (
                <p className="empty-state">
                  No candidates found. Register your first candidate.
                </p>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        min={type === "number" ? 0 : undefined}
      />
    </div>
  );
}

function CandidateFolio({ candidate }) {
  return (
    <section className="panel folio">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">CANDIDATE FOLIO</span>
          <h3>{candidate.fullName}</h3>
          <p>Folio Number: {candidate.candidateId}</p>
        </div>

        <span className="status-badge">{candidate.trainingStatus}</span>
      </div>

      <div className="folio-grid">
        <Detail label="Phone" value={candidate.phone} />
        <Detail label="Email" value={candidate.email} />
        <Detail
          label="License Number"
          value={candidate.licenseNumber}
        />
        <Detail
          label="License Category"
          value={candidate.licenseCategory}
        />
        <Detail
          label="Admission Date"
          value={
            candidate.admissionDate
              ? new Date(candidate.admissionDate).toLocaleDateString()
              : "—"
          }
        />
        <Detail
          label="Total Fees"
          value={`₹${candidate.totalFees ?? 0}`}
        />
        <Detail
          label="Fees Paid"
          value={`₹${candidate.paidFees ?? 0}`}
        />
        <Detail
          label="Outstanding Balance"
          value={`₹${Math.max(
            0,
            (candidate.totalFees || 0) - (candidate.paidFees || 0)
          )}`}
        />
        <Detail label="Remarks" value={candidate.remarks} />
      </div>
    </section>
  );
}

function Detail({ label, value }) {
  return (
    <div className="detail">
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
}