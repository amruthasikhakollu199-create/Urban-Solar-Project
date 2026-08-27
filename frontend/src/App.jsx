import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import CoverPage from "./components/CoverPage";
import HomePage from "./components/HomePage";
import Dashboard from "./components/Dashboard";
import InputForm from "./components/InputForm";
import GridPrediction from "./components/GridPrediction";
import PredictionHistory from "./components/PredictionHistory";
import DetailsPage from "./components/DetailsPage";
import HamburgerMenu from "./components/HamburgerMenu";
import LoginPage from "./components/LoginPage";
import SignupPage from "./components/SignupPage";

// ─── Inner app — needs access to the auth context ───────────────────────────

function AppInner() {
  const { user, loading, signOut } = useAuth();

  // "auth" pages: "login" | "signup"
  // App pages: "cover" | "home" | "dashboard" | "solar" | "grid" | "history" | "details"
  const [currentPage, setCurrentPage] = useState("cover");
  const [authPage, setAuthPage] = useState("login"); // which auth screen to show
  const [solarPower, setSolarPower] = useState(null);

  // ── Browser history (existing logic, untouched) ──────────────────────────
  useEffect(() => {
    window.history.replaceState({ page: "cover" }, "");
    window.history.pushState({ page: "cover" }, "");

    const handlePopState = (event) => {
      if (event.state && event.state.page) {
        setCurrentPage(event.state.page);
        if (event.state.page === "cover") {
          window.history.pushState({ page: "cover" }, "");
        }
      } else {
        setCurrentPage("cover");
        window.history.pushState({ page: "cover" }, "");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateTo = (page) => {
    setCurrentPage(page);
    window.history.pushState({ page }, "");
  };

  // ── Auth handlers ─────────────────────────────────────────────────────────
  const handleLoginSuccess = () => {
    navigateTo("dashboard");
  };

  const handleLogout = async () => {
    await signOut();
    navigateTo("cover");
  };

  const handleDeleteSuccess = () => {
    setAuthPage("login");
    navigateTo("login");
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "#f8faf6",
          color: "#2f6339",
          fontFamily: "Inter, sans-serif",
          fontSize: "18px",
          gap: "12px",
        }}
      >
        <span style={{ fontSize: "28px", animation: "floatArrow 1.8s ease-in-out infinite" }}>☀️</span>
        Loading…
      </div>
    );
  }

  // ── Protected route guard ─────────────────────────────────────────────────
  // Pages that require authentication
  const protectedPages = ["dashboard", "solar", "grid", "history", "details"];
  if (!user && protectedPages.includes(currentPage)) {
    // Redirect to login if trying to access a protected page without auth
    return authPage === "signup" ? (
      <SignupPage
        onSignupSuccess={() => setAuthPage("login")}
        onGoToLogin={() => setAuthPage("login")}
      />
    ) : (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onGoToSignup={() => setAuthPage("signup")}
      />
    );
  }

  // ── Cover page — always accessible, no auth needed ────────────────────────
  if (currentPage === "cover") {
    return (
      <CoverPage onTitleClick={() => navigateTo("home")} />
    );
  }

  // ── Home page — always accessible ────────────────────────────────────────
  if (currentPage === "home" || currentPage === "landing") {
    return (
      <HomePage onExplore={() => navigateTo("dashboard")} />
    );
  }

  // ── Auth pages (when not logged in) ──────────────────────────────────────
  if (!user) {
    if (authPage === "signup") {
      return (
        <SignupPage
          onSignupSuccess={() => setAuthPage("login")}
          onGoToLogin={() => setAuthPage("login")}
        />
      );
    }
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onGoToSignup={() => setAuthPage("signup")}
      />
    );
  }

  // ── Authenticated pages (with Hamburger Menu) ─────────────────────────────
  return (
    <>
      {/* Top-Left Hamburger Navigation Drawer (authenticated only) */}
      <HamburgerMenu
        currentPage={currentPage}
        onNavigateTo={navigateTo}
        onLogout={handleLogout}
        onDeleteSuccess={handleDeleteSuccess}
      />

      {/* Page Views */}
      {currentPage === "dashboard" && (
        <Dashboard
          onSolarSelect={() => navigateTo("solar")}
          onHistorySelect={() => navigateTo("history")}
          onLogout={handleLogout}
        />
      )}

      {currentPage === "history" && (
        <PredictionHistory
          onBackToDashboard={() => navigateTo("dashboard")}
        />
      )}

      {currentPage === "details" && (
        <DetailsPage
          onBackToDashboard={() => navigateTo("dashboard")}
          onNavigateTo={navigateTo}
        />
      )}

      {currentPage === "solar" && (
        <div className="dashboard">
          <header>
            <h2>☀️ Solar Power Prediction</h2>
            <p>Predict solar AC power using environmental conditions.</p>
          </header>

          <InputForm
            onSolarPrediction={(power) => {
              setSolarPower(power);
              navigateTo("grid");
            }}
          />
        </div>
      )}

      {currentPage === "grid" && (
        <div className="dashboard">
          <header>
            <h2>⚡ Grid Load Prediction</h2>
            <p>Compare solar generation with your power consumption.</p>
          </header>

          <GridPrediction
            solarPower={solarPower}
            onGoToSolar={() => navigateTo("solar")}
          />
        </div>
      )}
    </>
  );
}

// ─── Root — wraps everything in AuthProvider ─────────────────────────────────

function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

export default App;