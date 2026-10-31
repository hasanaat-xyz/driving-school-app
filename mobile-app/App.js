import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { API_URL } from "./src/config";

const EMPTY_FORM = {
  candidateId: "",
  fullName: "",
  phone: "",
  email: "",
  licenseNumber: "",
  licenseCategory: "LMV",
  admissionDate: new Date().toISOString().slice(0, 10),
  totalFees: "0",
  paidFees: "0",
  trainingStatus: "Not Started",
  remarks: "",
};

const EMPTY_ADMISSION = {
  fullName: "",
  phone: "",
  email: "",
  licenseNumber: "",
  licenseCategory: "LMV",
};

const CATEGORIES = ["LMV", "HMV", "MCWG", "MCWOG", "OTHER"];
const STATUSES = ["Not Started", "In Progress", "Completed"];

export default function App() {
  const [page, setPage] = useState("welcome");
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [admissionForm, setAdmissionForm] = useState(EMPTY_ADMISSION);
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");

  const isAdmin = ["admin", "staff"].includes(user?.role);

  async function api(path, options = {}, publicRequest = false) {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(!publicRequest && token
          ? { Authorization: `Bearer ${token}` }
          : {}),
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || `Request failed (${response.status}).`);
    }

    return data;
  }

  function setField(name, value) {
    setForm((old) => ({ ...old, [name]: value }));
  }

  function setAdmissionField(name, value) {
    setAdmissionForm((old) => ({ ...old, [name]: value }));
  }

  function candidateToForm(candidate) {
    return {
      candidateId: candidate.candidateId || "",
      fullName: candidate.fullName || "",
      phone: candidate.phone || "",
      email: candidate.email || "",
      licenseNumber: candidate.licenseNumber || "",
      licenseCategory: candidate.licenseCategory || "LMV",
      admissionDate: candidate.admissionDate
        ? new Date(candidate.admissionDate).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      totalFees: String(candidate.totalFees ?? 0),
      paidFees: String(candidate.paidFees ?? 0),
      trainingStatus: candidate.trainingStatus || "Not Started",
      remarks: candidate.remarks || "",
    };
  }

  async function submitAdmission() {
    if (!admissionForm.fullName.trim() || !admissionForm.phone.trim()) {
      Alert.alert("Required fields", "Enter your full name and phone number.");
      return;
    }

    try {
      setBusy(true);

      const result = await api(
        "/candidates/admission",
        {
          method: "POST",
          body: JSON.stringify({
            fullName: admissionForm.fullName.trim(),
            phone: admissionForm.phone.trim(),
            email: admissionForm.email.trim(),
            licenseNumber: admissionForm.licenseNumber.trim(),
            licenseCategory: admissionForm.licenseCategory,
          }),
        },
        true
      );

      Alert.alert(
        "Application submitted!",
        `${result.message}\n\nApplication ID: ${result.applicationId}`,
        [
          {
            text: "OK",
            onPress: () => {
              setAdmissionForm(EMPTY_ADMISSION);
              setPage("welcome");
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert("Submission failed", error.message);
    } finally {
      setBusy(false);
    }
  }

  async function login() {
    if (!email.trim() || !password) {
      Alert.alert("Missing details", "Enter your admin email and password.");
      return;
    }

    try {
      setBusy(true);

      const result = await api(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
          }),
        },
        true
      );

      if (!["admin", "staff"].includes(result.user?.role)) {
        throw new Error("Only admin and staff accounts can access this area.");
      }

      setToken(result.token);
      setUser(result.user);
      setPassword("");
      setPage("home");
    } catch (error) {
      Alert.alert("Login failed", error.message);
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    setUser(null);
    setToken("");
    setPassword("");
    setCandidates([]);
    setSelected(null);
    setPage("welcome");
  }

  async function loadCandidates() {
    try {
      setBusy(true);

      const result = await api("/candidates");
      setCandidates(Array.isArray(result) ? result : result.candidates || []);
      setPage("candidates");
    } catch (error) {
      Alert.alert("Could not load candidates", error.message);
    } finally {
      setBusy(false);
    }
  }

  async function searchCandidate() {
    if (!search.trim()) {
      Alert.alert("Search", "Enter a candidate ID, phone, or license number.");
      return;
    }

    try {
      setBusy(true);

      const result = await api(
        `/candidates/search?query=${encodeURIComponent(search.trim())}`
      );

      const candidate = result.candidate || result;

      if (!candidate?._id) {
        throw new Error("Candidate not found.");
      }

      setSelected(candidate);
      setForm(candidateToForm(candidate));
      setPage("details");
    } catch (error) {
      Alert.alert("Search failed", error.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveCandidate() {
    if (!selected?._id) return;

    if (
      !form.candidateId.trim() ||
      !form.fullName.trim() ||
      !form.phone.trim()
    ) {
      Alert.alert(
        "Required fields",
        "Candidate ID, full name, and phone are required."
      );
      return;
    }

    const total = Number(form.totalFees);
    const paid = Number(form.paidFees);

    if (
      !Number.isFinite(total) ||
      !Number.isFinite(paid) ||
      total < 0 ||
      paid < 0 ||
      paid > total
    ) {
      Alert.alert(
        "Invalid fees",
        "Paid fees cannot exceed total fees. Enter valid amounts."
      );
      return;
    }

    if (
      !form.admissionDate ||
      Number.isNaN(Date.parse(form.admissionDate))
    ) {
      Alert.alert("Invalid date", "Enter the admission date as YYYY-MM-DD.");
      return;
    }

    try {
      setBusy(true);

      const result = await api(`/candidates/${selected._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          candidateId: form.candidateId.trim(),
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          licenseNumber: form.licenseNumber.trim(),
          licenseCategory: form.licenseCategory,
          admissionDate: form.admissionDate,
          totalFees: total,
          paidFees: paid,
          trainingStatus: form.trainingStatus,
          remarks: form.remarks.trim(),
        }),
      });

      const updated = result.candidate;

      setSelected(updated);
      setForm(candidateToForm(updated));

      setCandidates((old) =>
        old.map((item) => (item._id === updated._id ? updated : item))
      );

      setPage("details");
      Alert.alert("Success", "All candidate details have been updated.");
    } catch (error) {
      Alert.alert("Update failed", error.message);
    } finally {
      setBusy(false);
    }
  }

  function Field({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = "default",
    secureTextEntry = false,
    multiline = false,
  }) {
    return (
      <View style={styles.field}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          style={[styles.input, multiline && styles.multiline]}
          value={value == null ? "" : String(value)}
          onChangeText={onChangeText}
          placeholder={placeholder || label}
          placeholderTextColor="#8993a4"
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          multiline={multiline}
        />
      </View>
    );
  }

  function Button({ title, onPress, secondary = false }) {
    return (
      <TouchableOpacity
        style={[styles.button, secondary && styles.secondaryButton]}
        onPress={onPress}
        disabled={busy}
      >
        {busy && !secondary ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text
            style={[
              styles.buttonText,
              secondary && styles.secondaryButtonText,
            ]}
          >
            {title}
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  function Detail({ label, value }) {
    return (
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>
          {value === undefined || value === null || value === ""
            ? "—"
            : String(value)}
        </Text>
      </View>
    );
  }

  function CategoryPicker({ value, onChange }) {
    return (
      <View style={styles.field}>
        <Text style={styles.label}>License Category</Text>
        <View style={styles.wrapRow}>
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.chip,
                value === category && styles.chipSelected,
              ]}
              onPress={() => onChange(category)}
            >
              <Text
                style={[
                  styles.chipText,
                  value === category && styles.chipTextSelected,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  function StatusPicker() {
    return (
      <View style={styles.field}>
        <Text style={styles.label}>Training Status</Text>
        <View style={styles.wrapRow}>
          {STATUSES.map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.chip,
                form.trainingStatus === status && styles.chipSelected,
              ]}
              onPress={() => setField("trainingStatus", status)}
            >
              <Text
                style={[
                  styles.chipText,
                  form.trainingStatus === status && styles.chipTextSelected,
                ]}
              >
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  function goHome() {
    setSelected(null);
    setPage("home");
  }

  // Public screens: no login required to apply for admission.
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f7fb" />

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.brand}>
            <View style={styles.brandIcon}>
              <Text style={styles.brandIconText}>D</Text>
            </View>
            <Text style={styles.logo}>Deccan Motor</Text>
            <Text style={styles.subtitle}>Driving School</Text>
          </View>

          {page === "welcome" && (
            <View style={styles.card}>
              <Text style={styles.title}>Start Your Driving Journey!</Text>
              <Text style={styles.description}>
                Apply for admission online. No account or login is required.
              </Text>

              <Button
                title="Apply for Admission"
                onPress={() => setPage("admission")}
              />

              <Button
                title="Admin / Staff Login"
                secondary
                onPress={() => setPage("login")}
              />
            </View>
          )}

          {page === "admission" && (
            <View style={styles.card}>
              <Text style={styles.title}>Admission Application</Text>
              <Text style={styles.description}>
                Fill in your details and submit your application.
              </Text>

              <Field
                label="Full Name *"
                value={admissionForm.fullName}
                onChangeText={(v) => setAdmissionField("fullName", v)}
              />
              <Field
                label="Phone Number *"
                value={admissionForm.phone}
                onChangeText={(v) => setAdmissionField("phone", v)}
                keyboardType="phone-pad"
              />
              <Field
                label="Email (optional)"
                value={admissionForm.email}
                onChangeText={(v) => setAdmissionField("email", v)}
                keyboardType="email-address"
              />
              <Field
                label="Existing License Number (optional)"
                value={admissionForm.licenseNumber}
                onChangeText={(v) => setAdmissionField("licenseNumber", v)}
              />

              <CategoryPicker
                value={admissionForm.licenseCategory}
                onChange={(v) => setAdmissionField("licenseCategory", v)}
              />

              <Button
                title="Submit Application"
                onPress={submitAdmission}
              />
              <Button
                title="Back"
                secondary
                onPress={() => setPage("welcome")}
              />
            </View>
          )}

          {page === "login" && (
            <View style={styles.card}>
              <Text style={styles.title}>Admin Login</Text>
              <Text style={styles.description}>
                Sign in to manage admission applications and student records.
              </Text>

              <Field
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
              <Field
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <Button title="Sign In" onPress={login} />
              <Button
                title="Back"
                secondary
                onPress={() => setPage("welcome")}
              />
            </View>
          )}

          <Text style={styles.footer}>Deccan Motor Driving School</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Admin and staff screens.
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f7fb" />

      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>Deccan Motor</Text>
          <Text style={styles.subtitle}>Driving School Management</Text>
        </View>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>Log out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {page === "home" && (
          <>
            <View style={styles.card}>
              <Text style={styles.greeting}>Welcome back!</Text>
              <Text style={styles.name}>
                {user.fullName || user.name || user.email}
              </Text>
              <Text style={styles.role}>{user.role.toUpperCase()}</Text>
            </View>

            <Text style={styles.sectionTitle}>Admin Dashboard</Text>

            <Menu
              icon="☷"
              title="All Applications & Candidates"
              description="Review new admissions and manage records."
              onPress={loadCandidates}
            />

            <Menu
              icon="⌕"
              title="Search Candidate"
              description="Search by candidate ID, phone or license."
              onPress={() => setPage("search")}
            />
          </>
        )}

        {page === "candidates" && (
          <>
            <Text style={styles.title}>Applications & Candidates</Text>

            {candidates.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.description}>
                  No applications or candidates found.
                </Text>
              </View>
            ) : (
              candidates.map((candidate) => (
                <TouchableOpacity
                  key={candidate._id}
                  style={styles.candidateCard}
                  onPress={() => {
                    setSelected(candidate);
                    setForm(candidateToForm(candidate));
                    setPage("details");
                  }}
                >
                  <Text style={styles.menuTitle}>{candidate.fullName}</Text>
                  <Text style={styles.candidateInfo}>
                    ID: {candidate.candidateId}
                  </Text>
                  <Text style={styles.candidateInfo}>
                    Phone: {candidate.phone}
                  </Text>
                  <Text style={styles.candidateInfo}>
                    Training: {candidate.trainingStatus || "Not Started"}
                  </Text>
                  <Text style={styles.linkText}>View / Edit ›</Text>
                </TouchableOpacity>
              ))
            )}

            <Button title="Refresh List" onPress={loadCandidates} />
            <Button title="Dashboard" secondary onPress={goHome} />
          </>
        )}

        {page === "search" && (
          <View style={styles.card}>
            <Text style={styles.title}>Search Candidate</Text>
            <Field
              label="Candidate ID, Phone or License Number"
              value={search}
              onChangeText={setSearch}
              placeholder="Enter search term"
            />
            <Button title="Search" onPress={searchCandidate} />
            <Button title="Dashboard" secondary onPress={goHome} />
          </View>
        )}

        {page === "details" && selected && (
          <View style={styles.card}>
            <Text style={styles.title}>Candidate Details</Text>

            <Detail label="Full Name" value={selected.fullName} />
            <Detail label="Candidate ID" value={selected.candidateId} />
            <Detail label="Phone" value={selected.phone} />
            <Detail label="Email" value={selected.email} />
            <Detail label="License Number" value={selected.licenseNumber} />
            <Detail label="License Category" value={selected.licenseCategory} />
            <Detail
              label="Admission Date"
              value={
                selected.admissionDate
                  ? new Date(selected.admissionDate).toLocaleDateString()
                  : "—"
              }
            />
            <Detail
              label="Training Status"
              value={selected.trainingStatus || "Not Started"}
            />
            <Detail label="Total Fees" value={`₹${selected.totalFees ?? 0}`} />
            <Detail label="Fees Paid" value={`₹${selected.paidFees ?? 0}`} />
            <Detail
              label="Remaining Balance"
              value={`₹${Math.max(
                0,
                Number(selected.totalFees || 0) -
                  Number(selected.paidFees || 0)
              )}`}
            />
            <Detail label="Remarks" value={selected.remarks} />

            <Button
              title="Edit All Details"
              onPress={() => {
                setForm(candidateToForm(selected));
                setPage("edit");
              }}
            />
            <Button
              title="Back to Candidates"
              secondary
              onPress={() => setPage("candidates")}
            />
            <Button title="Dashboard" secondary onPress={goHome} />
          </View>
        )}

        {page === "edit" && selected && (
          <View style={styles.card}>
            <Text style={styles.title}>Edit Candidate</Text>

            <Field
              label="Candidate ID *"
              value={form.candidateId}
              onChangeText={(v) => setField("candidateId", v)}
            />
            <Field
              label="Full Name *"
              value={form.fullName}
              onChangeText={(v) => setField("fullName", v)}
            />
            <Field
              label="Phone *"
              value={form.phone}
              onChangeText={(v) => setField("phone", v)}
              keyboardType="phone-pad"
            />
            <Field
              label="Email"
              value={form.email}
              onChangeText={(v) => setField("email", v)}
              keyboardType="email-address"
            />
            <Field
              label="License Number"
              value={form.licenseNumber}
              onChangeText={(v) => setField("licenseNumber", v)}
            />

            <CategoryPicker
              value={form.licenseCategory}
              onChange={(v) => setField("licenseCategory", v)}
            />

            <Field
              label="Admission Date (YYYY-MM-DD)"
              value={form.admissionDate}
              onChangeText={(v) => setField("admissionDate", v)}
              placeholder="2026-10-31"
            />
            <Field
              label="Total Fees (₹)"
              value={form.totalFees}
              onChangeText={(v) => setField("totalFees", v)}
              keyboardType="decimal-pad"
            />
            <Field
              label="Fees Paid (₹)"
              value={form.paidFees}
              onChangeText={(v) => setField("paidFees", v)}
              keyboardType="decimal-pad"
            />

            <StatusPicker />

            <Field
              label="Remarks"
              value={form.remarks}
              onChangeText={(v) => setField("remarks", v)}
              multiline
            />

            <Button title="Save All Changes" onPress={saveCandidate} />
            <Button
              title="Cancel"
              secondary
              onPress={() => setPage("details")}
            />
          </View>
        )}

        <Text style={styles.footer}>Deccan Motor Driving School</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Menu({ icon, title, description, onPress }) {
  return (
    <TouchableOpacity style={styles.menuCard} onPress={onPress}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuDescription}>{description}</Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fb" },
  content: { padding: 20, paddingBottom: 40 },
  brand: { alignItems: "center", marginTop: 30, marginBottom: 28 },
  brandIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: "#174c3c",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  brandIconText: { color: "#fff", fontSize: 30, fontWeight: "800" },
  logo: { fontSize: 24, fontWeight: "800", color: "#174c3c" },
  subtitle: { fontSize: 12, color: "#778295", marginTop: 5 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e8ecf2",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logout: { color: "#174c3c", fontWeight: "700" },
  card: {
    backgroundColor: "#fff",
    padding: 21,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#e8ecf2",
    marginBottom: 18,
  },
  title: {
    fontSize: 23,
    fontWeight: "800",
    color: "#172b24",
    marginBottom: 8,
  },
  description: {
    color: "#778295",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 5,
    marginBottom: 18,
  },
  greeting: { fontSize: 14, color: "#778295" },
  name: {
    fontSize: 22,
    fontWeight: "800",
    color: "#172b24",
    marginTop: 5,
  },
  role: {
    alignSelf: "flex-start",
    backgroundColor: "#e5f4ec",
    color: "#174c3c",
    overflow: "hidden",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 12,
    fontSize: 11,
    fontWeight: "800",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#172b24",
    marginBottom: 13,
  },
  menuCard: {
    backgroundColor: "#fff",
    padding: 17,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e8ecf2",
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  menuIcon: {
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor: "#e5f4ec",
    textAlign: "center",
    textAlignVertical: "center",
    color: "#174c3c",
    fontSize: 25,
    overflow: "hidden",
    marginRight: 13,
  },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: "800", color: "#172b24" },
  menuDescription: {
    fontSize: 12,
    color: "#778295",
    marginTop: 5,
    lineHeight: 17,
  },
  arrow: { color: "#174c3c", fontWeight: "700", fontSize: 20 },
  field: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#344054",
    marginBottom: 7,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#dce2e9",
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: "#172b24",
    backgroundColor: "#fff",
  },
  multiline: { minHeight: 90, paddingTop: 12, textAlignVertical: "top" },
  button: {
    minHeight: 49,
    backgroundColor: "#174c3c",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    marginTop: 7,
    marginBottom: 9,
  },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  secondaryButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dce2e9",
  },
  secondaryButtonText: { color: "#344054" },
  wrapRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: {
    borderWidth: 1,
    borderColor: "#dce2e9",
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 10,
    marginBottom: 4,
  },
  chipSelected: { backgroundColor: "#174c3c", borderColor: "#174c3c" },
  chipText: { fontSize: 12, color: "#344054", fontWeight: "700" },
  chipTextSelected: { color: "#fff" },
  candidateCard: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e8ecf2",
    marginTop: 12,
  },
  candidateInfo: { fontSize: 13, color: "#778295", marginTop: 6 },
  linkText: { color: "#174c3c", fontWeight: "700", marginTop: 10 },
  detailRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#edf0f4",
  },
  detailLabel: { fontSize: 12, color: "#778295", marginBottom: 5 },
  detailValue: { fontSize: 15, color: "#172b24", fontWeight: "600" },
  footer: {
    textAlign: "center",
    color: "#8993a4",
    fontSize: 12,
    marginTop: 15,
    marginBottom: 15,
  },
});