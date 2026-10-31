import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  async function login() {
    if (!email.trim() || !password) {
      Alert.alert("Missing details", "Enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      if (!["admin", "staff", "student"].includes(data.user.role)) {
        throw new Error("Your account does not have mobile app access.");
      }

      setToken(data.token);
      setUser(data.user);
      setPassword("");
    } catch (error) {
      Alert.alert(
        "Login failed",
        error.message || "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setUser(null);
    setToken("");
    setEmail("");
    setPassword("");
  }

  if (user) {
    const isAdmin = user.role === "admin" || user.role === "staff";

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f7fb" />

        <View style={styles.header}>
          <Text style={styles.logo}>DriveSmart</Text>
          <Text style={styles.subtitle}>Driving School Management</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.greeting}>Welcome!</Text>
            <Text style={styles.name}>
              {user.fullName || user.name || user.email}
            </Text>

            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {user.role.toUpperCase()}
              </Text>
            </View>
          </View>

          {isAdmin ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Admin Dashboard</Text>
              <Text style={styles.description}>
                Your mobile dashboard will let you register candidates,
                search records, manage fees, and update training progress.
              </Text>
              <Text style={styles.note}>
                Admin features are the next development step.
              </Text>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Student Dashboard</Text>
              <Text style={styles.description}>
                Your admission details, training status, and fee information
                will appear here.
              </Text>
              <Text style={styles.note}>
                Your personal record will be connected after we add the
                secure student API.
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f7fb" />

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.loginContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brand}>
            <View style={styles.brandIcon}>
              <Text style={styles.brandIconText}>D</Text>
            </View>
            <Text style={styles.logo}>DriveSmart</Text>
            <Text style={styles.subtitle}>Your driving school, connected.</Text>
          </View>

          <View style={styles.loginCard}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.description}>
              Sign in to continue to your account.
            </Text>

            <Text style={styles.label}>Email address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#8993a4"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#8993a4"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.disabledButton]}
              onPress={login}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.helpText}>
              Use the account provided by your driving school.
            </Text>
          </View>

          <Text style={styles.footer}>
            Driving School Management
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fb",
  },
  keyboard: {
    flex: 1,
  },
  loginContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  brand: {
    alignItems: "center",
    marginBottom: 30,
  },
  brandIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#174c3c",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  brandIconText: {
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "800",
  },
  logo: {
    fontSize: 27,
    fontWeight: "800",
    color: "#174c3c",
  },
  subtitle: {
    fontSize: 13,
    color: "#778295",
    marginTop: 5,
  },
  loginCard: {
    backgroundColor: "#ffffff",
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e8ecf2",
  },
  title: {
    fontSize: 25,
    fontWeight: "800",
    color: "#172b24",
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: "#778295",
    marginTop: 8,
    marginBottom: 22,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#344054",
    marginBottom: 8,
  },
  input: {
    height: 49,
    borderWidth: 1,
    borderColor: "#dce2e9",
    borderRadius: 10,
    paddingHorizontal: 13,
    marginBottom: 18,
    fontSize: 15,
    color: "#172b24",
    backgroundColor: "#ffffff",
  },
  loginButton: {
    height: 50,
    backgroundColor: "#174c3c",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  disabledButton: {
    opacity: 0.65,
  },
  loginButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },
  helpText: {
    textAlign: "center",
    color: "#8993a4",
    fontSize: 12,
    marginTop: 18,
    lineHeight: 18,
  },
  footer: {
    textAlign: "center",
    color: "#8993a4",
    fontSize: 12,
    marginTop: 26,
  },
  header: {
    padding: 24,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e8ecf2",
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: "#ffffff",
    padding: 22,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e8ecf2",
    marginBottom: 16,
  },
  greeting: {
    fontSize: 14,
    color: "#778295",
  },
  name: {
    fontSize: 22,
    fontWeight: "800",
    color: "#172b24",
    marginTop: 5,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#e5f4ec",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 14,
  },
  badgeText: {
    color: "#174c3c",
    fontWeight: "800",
    fontSize: 11,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#172b24",
  },
  note: {
    fontSize: 13,
    color: "#174c3c",
    lineHeight: 19,
  },
  logoutButton: {
    height: 48,
    borderWidth: 1,
    borderColor: "#dce2e9",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 30,
  },
  logoutText: {
    fontSize: 15,
    color: "#344054",
    fontWeight: "700",
  },
});
