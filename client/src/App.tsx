import { useState, type FormEvent } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import {
  auth,
  googleProvider,
  appleProvider,
} from "./firebase";
import "./App.css";

type Destination = {
  id: string;
  name: string;
  location: string;
  image: string;
  description: string;
  bestTime: string;
  duration: string;
  highlights: string[];
};

const destinations: Destination[] = [
  {
    id: "manali",
    name: "Manali",
    location: "Himachal Pradesh",
    image:
      "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80",
    description:
      "Manali is a beautiful Himalayan destination known for snow-covered mountains, pine forests, rivers, adventure sports, and breathtaking views.",
    bestTime: "October to June",
    duration: "3–5 Days",
    highlights: [
      "Solang Valley",
      "Rohtang Pass",
      "Old Manali",
      "Hadimba Temple",
    ],
  },

  {
    id: "goa",
    name: "Goa",
    location: "India",
    image:
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80",
    description:
      "Goa is famous for its beautiful beaches, vibrant nightlife, Portuguese heritage, delicious seafood, and relaxing tropical atmosphere.",
    bestTime: "November to February",
    duration: "3–6 Days",
    highlights: [
      "Baga Beach",
      "Palolem Beach",
      "Fort Aguada",
      "Dudhsagar Falls",
    ],
  },

  {
    id: "jaipur",
    name: "Jaipur",
    location: "Rajasthan",
    image:
      "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=80",
    description:
      "Jaipur, also known as the Pink City, is famous for its royal palaces, historic forts, colorful markets, traditional food, and rich Rajasthani culture.",
    bestTime: "October to March",
    duration: "2–4 Days",
    highlights: [
      "Amber Fort",
      "Hawa Mahal",
      "City Palace",
      "Jantar Mantar",
    ],
  },

  {
    id: "kerala",
    name: "Kerala",
    location: "God's Own Country",
    image:
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80",
    description:
      "Kerala is known for peaceful backwaters, lush greenery, tropical beaches, hill stations, wildlife, and unforgettable houseboat experiences.",
    bestTime: "September to March",
    duration: "4–7 Days",
    highlights: [
      "Alleppey Backwaters",
      "Munnar",
      "Kochi",
      "Wayanad",
    ],
  },
];

function App() {
  const [selectedDestination, setSelectedDestination] =
    useState<Destination | null>(null);

  const [showLogin, setShowLogin] = useState(false);

  /* =========================================================
     USER LOGIN STATE
  ========================================================= */

  const [showUserLogin, setShowUserLogin] =
    useState(false);

  /* =========================================================
     ADDED: LOCAL LOGIN STATE
  ========================================================= */

  const [showLocalLogin, setShowLocalLogin] =
    useState(false);

  const [localEmail, setLocalEmail] =
    useState("");

  const [localPassword, setLocalPassword] =
    useState("");

  /* =========================================================
     ADDED: AUTHORITY LOGIN STATE
  ========================================================= */

  const [showAuthorityLogin, setShowAuthorityLogin] =
    useState(false);

  const [authorityEmail, setAuthorityEmail] =
    useState("");

  const [authorityPassword, setAuthorityPassword] =
    useState("");

  /* =========================================================
     ADDED: AUTHORITY DASHBOARD STATE
  ========================================================= */

  const [showAuthorityDashboard, setShowAuthorityDashboard] =
    useState(false);

  const [authorityDashboardSection, setAuthorityDashboardSection] =
    useState("overview");

  /* =========================================================
     ADDED: USER DASHBOARD STATE
  ========================================================= */

  const [showUserDashboard, setShowUserDashboard] =
    useState(false);

  const [dashboardSection, setDashboardSection] =
    useState("overview");

  const [selectedLocation, setSelectedLocation] =
    useState("Shaniwar Wada, Pune");

  const [userBudget, setUserBudget] =
    useState("₹10,000");

  const [userInterest, setUserInterest] =
    useState("Culture");

  const [peopleCount, setPeopleCount] =
    useState(1240);

  /* =========================================================
     ADDED: LOCAL PROVIDER DASHBOARD STATE
  ========================================================= */

  const [showLocalDashboard, setShowLocalDashboard] =
    useState(false);

  const [localDashboardSection, setLocalDashboardSection] =
    useState("profile");

  const [providerName, setProviderName] =
    useState("TravelBoost Local Partner");

  const [providerLocation, setProviderLocation] =
    useState("Pune, Maharashtra");

  const [providerType, setProviderType] =
    useState("Homestay");

  const [providerRating, setProviderRating] =
    useState("4.8");

  const [providerLanguages, setProviderLanguages] =
    useState("English • Hindi • Marathi");

  const [servicePrice, setServicePrice] =
    useState("₹1,500 / night");

  const [serviceAvailability, setServiceAvailability] =
    useState("Available");

  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] =
    useState("");

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const scrollToSection = (id: string) => {
    setSelectedDestination(null);
    setShowLogin(false);
    setShowUserLogin(false);
    setShowLocalLogin(false);
    setShowAuthorityLogin(false);
    setShowUserDashboard(false);
    setShowLocalDashboard(false);

    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
      });
    }, 100);
  };

  const openDestination = (
    destination: Destination
  ) => {
    setSelectedDestination(destination);
    setShowLogin(false);
    setShowUserLogin(false);
    setShowLocalLogin(false);
    setShowAuthorityLogin(false);
    setShowUserDashboard(false);
    setShowLocalDashboard(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const closeDestination = () => {
    setSelectedDestination(null);

    setTimeout(() => {
      document
        .getElementById("destinations")
        ?.scrollIntoView({
          behavior: "smooth",
        });
    }, 100);
  };

  const openLogin = () => {
    setSelectedDestination(null);
    setShowUserLogin(false);
    setShowLocalLogin(false);
    setShowAuthorityLogin(false);
    setShowUserDashboard(false);
    setShowLocalDashboard(false);
    setShowLogin(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const closeLogin = () => {
    setShowLogin(false);
    setShowUserLogin(false);
    setShowLocalLogin(false);
    setShowAuthorityLogin(false);
    setShowUserDashboard(false);
    setShowLocalDashboard(false);
    setShowAuthorityDashboard(false);

    setTimeout(() => {
      document.getElementById("home")?.scrollIntoView({
        behavior: "smooth",
      });
    }, 100);
  };

  /* =========================================================
     OPEN USER LOGIN
  ========================================================= */

  const openUserLogin = () => {
    setShowUserLogin(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =========================================================
     BACK TO ROLE SELECTION
  ========================================================= */

  const backToRoleSelection = () => {
    setShowUserLogin(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =========================================================
     ADDED: OPEN LOCAL LOGIN
  ========================================================= */

  const openLocalLogin = () => {
    setShowLogin(false);
    setShowUserLogin(false);
    setShowLocalLogin(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =========================================================
     ADDED: BACK TO LOGIN ROLE SELECTION
  ========================================================= */

  const backToLocalRoleSelection = () => {
    setShowLocalLogin(false);
    setShowLogin(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =========================================================
     ADDED: LOCAL EMAIL LOGIN
  ========================================================= */

  const handleLocalLogin = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!localEmail || !localPassword) {
      alert(
        "Please enter your email and password."
      );
      return;
    }

    try {
      const result =
        await signInWithEmailAndPassword(
          auth,
          localEmail,
          localPassword
        );

      const user = result.user;

      alert(
        `Welcome back to TravelBoost!\nLogged in as ${
          user.email || localEmail
        }`
      );

      console.log(
        "Local provider user:",
        user
      );

      setShowLocalLogin(false);
      setShowLogin(false);
      setShowLocalDashboard(true);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error(
        "Local login error:",
        error
      );

      const errorCode =
        (error as {
          code?: string;
        })?.code;

      const errorMessage =
        (error as {
          message?: string;
        })?.message;

      alert(
        `Local Login Error:\n\nCode: ${
          errorCode || "unknown"
        }\n\nMessage: ${
          errorMessage || "Unknown error"
        }`
      );
    }
  };

  /* =========================================================
     ADDED: LOCAL GOOGLE LOGIN
  ========================================================= */

  const handleLocalGoogleLogin =
    async () => {
      try {
        const result =
          await signInWithPopup(
            auth,
            googleProvider
          );

        const user = result.user;

        alert(
          `Welcome to TravelBoost, ${
            user.displayName ||
            user.email ||
            "Local Provider"
          }!`
        );

        console.log(
          "Local Google user:",
          user
        );

        setShowLocalLogin(false);
        setShowLogin(false);
        setShowLocalDashboard(true);

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } catch (error) {
        console.error(
          "Local Google login error:",
          error
        );

        const errorCode =
          (error as {
            code?: string;
          })?.code;

        const errorMessage =
          (error as {
            message?: string;
          })?.message;

        alert(
          `Local Google Login Error:\n\nCode: ${
            errorCode || "unknown"
          }\n\nMessage: ${
            errorMessage || "Unknown error"
          }`
        );
      }
    };

  /* =========================================================
     ADDED: OPEN AUTHORITY LOGIN
  ========================================================= */

  const openAuthorityLogin = () => {
    setShowLogin(false);
    setShowUserLogin(false);
    setShowLocalLogin(false);
    setShowAuthorityDashboard(false);
    setShowAuthorityLogin(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =========================================================
     ADDED: BACK TO LOGIN ROLE SELECTION
  ========================================================= */

  const backToAuthorityRoleSelection = () => {
    setShowAuthorityLogin(false);
    setShowLogin(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =========================================================
     ADDED: AUTHORITY EMAIL LOGIN
  ========================================================= */

  const handleAuthorityLogin = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!authorityEmail || !authorityPassword) {
      alert(
        "Please enter your official email and password."
      );
      return;
    }

    try {
      const result =
        await signInWithEmailAndPassword(
          auth,
          authorityEmail,
          authorityPassword
        );

      const user = result.user;

      alert(
        `Welcome to TravelBoost Authority Portal!\nLogged in as ${
          user.email || authorityEmail
        }`
      );

      console.log(
        "Authority user:",
        user
      );

      setShowAuthorityLogin(false);
      setShowLogin(false);
      setShowAuthorityDashboard(true);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error(
        "Authority login error:",
        error
      );

      const errorCode =
        (error as {
          code?: string;
        })?.code;

      const errorMessage =
        (error as {
          message?: string;
        })?.message;

      alert(
        `Authority Login Error:\n\nCode: ${
          errorCode || "unknown"
        }\n\nMessage: ${
          errorMessage || "Unknown error"
        }`
      );
    }
  };

  /* =========================================================
     ADDED: AUTHORITY GOOGLE LOGIN
  ========================================================= */

  const handleAuthorityGoogleLogin =
    async () => {
      try {
        const result =
          await signInWithPopup(
            auth,
            googleProvider
          );

        const user = result.user;

        alert(
          `Welcome to the TravelBoost Authority Portal, ${
            user.displayName ||
            user.email ||
            "Authority User"
          }!`
        );

        console.log(
          "Authority Google user:",
          user
        );

        setShowAuthorityLogin(false);
        setShowLogin(false);
        setShowAuthorityDashboard(true);

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } catch (error) {
        console.error(
          "Authority Google login error:",
          error
        );

        const errorCode =
          (error as {
            code?: string;
          })?.code;

        const errorMessage =
          (error as {
            message?: string;
          })?.message;

        alert(
          `Authority Google Login Error:\n\nCode: ${
            errorCode || "unknown"
          }\n\nMessage: ${
            errorMessage || "Unknown error"
          }`
        );
      }
    };

  /* =========================================================
     ADDED: AUTHORITY DASHBOARD NAVIGATION
  ========================================================= */

  const openAuthorityDashboardSection = (
    section: string
  ) => {
    setAuthorityDashboardSection(section);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const logoutAuthority = () => {
    setShowAuthorityDashboard(false);
    setShowAuthorityLogin(false);
    setShowLogin(false);

    setTimeout(() => {
      document.getElementById("home")?.scrollIntoView({
        behavior: "smooth",
      });
    }, 100);
  };

  const authorityDashboardTitle =
    authorityDashboardSection === "overview"
      ? "Authority Overview"
      : authorityDashboardSection === "crowd"
      ? "Live Crowd Monitoring"
      : authorityDashboardSection === "complaints"
      ? "Complaint Management"
      : authorityDashboardSection === "safety"
      ? "Tourism & Public Safety"
      : "Reports & Insights";

  /* =========================================================
     ADDED: AUTHORITY DASHBOARD
  ========================================================= */

  if (showAuthorityDashboard) {
    return (
      <div
        className="app user-dashboard-page authority-dashboard-page"
        aria-label="TravelBoost authority dashboard"
      >
        <div className="background-glow glow-one" />
        <div className="background-glow glow-two" />

        <nav className="navbar dashboard-navbar">
          <button
            type="button"
            className="logo logo-button"
            onClick={logoutAuthority}
            aria-label="Back to TravelBoost home"
          >
            Travel<span>Boost</span>
          </button>

          <div className="dashboard-user-info">
            <span>🛡️ Authority Portal</span>
          </div>

          <button
            type="button"
            className="login-btn"
            onClick={logoutAuthority}
          >
            Logout
          </button>
        </nav>

        <main className="user-dashboard-content">
          <div className="dashboard-nav">
            {[
              ["overview", "Overview"],
              ["crowd", "Live Crowd"],
              ["complaints", "Complaints"],
              ["safety", "Safety"],
              ["reports", "Reports"],
            ].map(([section, label]) => (
              <button
                key={section}
                type="button"
                className={
                  authorityDashboardSection === section
                    ? "dashboard-nav-btn active"
                    : "dashboard-nav-btn"
                }
                onClick={() =>
                  openAuthorityDashboardSection(section)
                }
              >
                {label}
              </button>
            ))}
          </div>

          <section className="dashboard-heading">
            <p className="section-label">
              TRAVELBOOST • AUTHORITY PORTAL
            </p>

            <h1>{authorityDashboardTitle}</h1>

            <p>
              Monitor tourism activity, public safety,
              complaints, and destination conditions.
            </p>
          </section>

          {authorityDashboardSection === "overview" && (
            <>
              <div className="dashboard-grid">
                <div className="dashboard-card dashboard-card-wide">
                  <span className="dashboard-card-icon">👥</span>
                  <div>
                    <p>Visitors Today</p>
                    <strong>12,840</strong>
                    <small>📈 8.4% compared with yesterday</small>
                  </div>
                </div>

                <div className="dashboard-card dashboard-card-wide">
                  <span className="dashboard-card-icon">📍</span>
                  <div>
                    <p>Monitored Locations</p>
                    <strong>24</strong>
                    <small>21 operational • 3 require attention</small>
                  </div>
                </div>

                <div className="dashboard-card dashboard-card-wide">
                  <span className="dashboard-card-icon">🚨</span>
                  <div>
                    <p>Active Alerts</p>
                    <strong>5</strong>
                    <small>2 high priority</small>
                  </div>
                </div>

                <div className="dashboard-card dashboard-card-wide">
                  <span className="dashboard-card-icon">📝</span>
                  <div>
                    <p>Open Complaints</p>
                    <strong>18</strong>
                    <small>7 pending review</small>
                  </div>
                </div>
              </div>

              <div className="dashboard-card ai-recommendation-card">
                <div className="ai-card-header">
                  <span className="dashboard-card-icon">📊</span>

                  <div>
                    <p>Authority Insight</p>

                    <h2>
                      Crowd pressure is highest at central
                      tourist zones
                    </h2>
                  </div>
                </div>

                <p className="ai-recommendation-text">
                  Review live crowd density and unresolved
                  complaints before allocating staff or
                  issuing destination advisories.
                </p>

                <div className="ai-recommendation-tags">
                  <span>🔴 2 High Alerts</span>
                  <span>👥 12,840 Visitors</span>
                  <span>📝 18 Complaints</span>
                  <span>📍 24 Locations</span>
                </div>
              </div>

              <div className="dashboard-feature-panel">
                <div className="dashboard-feature-card">
                  <span className="dashboard-card-icon">👥</span>
                  <h2>Monitor Crowds</h2>
                  <p>
                    View tourist density and live activity
                    across monitored spots.
                  </p>

                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() =>
                      openAuthorityDashboardSection("crowd")
                    }
                  >
                    Open Monitoring →
                  </button>
                </div>

                <div className="dashboard-feature-card">
                  <span className="dashboard-card-icon">📝</span>
                  <h2>Review Complaints</h2>
                  <p>
                    Prioritize, review, and track traveller
                    complaints.
                  </p>

                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() =>
                      openAuthorityDashboardSection("complaints")
                    }
                  >
                    Manage Complaints →
                  </button>
                </div>
              </div>
            </>
          )}

          {authorityDashboardSection === "crowd" && (
            <div className="dashboard-feature-panel">
              {[
                {
                  icon: "🔴",
                  level: "High Density",
                  name: "Shaniwar Wada, Pune",
                  visitors: "4,820",
                  density: "HIGH",
                  trend: "Increasing",
                  alert: "Critical",
                },
                {
                  icon: "🟡",
                  level: "Moderate Density",
                  name: "Aga Khan Palace",
                  visitors: "1,240",
                  density: "MODERATE",
                  trend: "Stable",
                  alert: "Watch",
                },
                {
                  icon: "🟢",
                  level: "Lower Density",
                  name: "Sinhagad Fort",
                  visitors: "680",
                  density: "LOW",
                  trend: "Decreasing",
                  alert: "Normal",
                },
              ].map((spot) => (
                <div
                  className="dashboard-card"
                  key={spot.name}
                >
                  <p>
                    {spot.icon} {spot.level}
                  </p>

                  <h2>{spot.name}</h2>

                  <div className="dashboard-stat-row">
                    <span>Current visitors</span>
                    <strong>{spot.visitors}</strong>
                  </div>

                  <div className="dashboard-stat-row">
                    <span>Density</span>
                    <strong>{spot.density}</strong>
                  </div>

                  <div className="dashboard-stat-row">
                    <span>Trend</span>
                    <strong>{spot.trend}</strong>
                  </div>

                  <div className="dashboard-stat-row">
                    <span>Alert level</span>
                    <strong>{spot.alert}</strong>
                  </div>
                </div>
              ))}

              <div className="dashboard-card">
                <p>⚙️ Monitoring Controls</p>
                <h2>Destination Controls</h2>

                <p>
                  Future backend integration can connect
                  these controls to live sensors, maps, and
                  alerts.
                </p>

                <button
                  type="button"
                  className="primary-btn"
                  onClick={() =>
                    alert(
                      "Live crowd controls will be connected by the backend team."
                    )
                  }
                >
                  Open Controls →
                </button>
              </div>
            </div>
          )}

          {authorityDashboardSection === "complaints" && (
            <div className="dashboard-feature-panel">
              <div className="dashboard-card">
                <p>🚨 Priority Complaint</p>

                <h2>
                  Unsafe crowding near entrance
                </h2>

                <div className="dashboard-stat-row">
                  <span>Location</span>
                  <strong>Shaniwar Wada</strong>
                </div>

                <div className="dashboard-stat-row">
                  <span>Reports</span>
                  <strong>32</strong>
                </div>

                <div className="dashboard-stat-row">
                  <span>Status</span>
                  <strong>Open</strong>
                </div>

                <div className="local-request-actions">
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={() =>
                      alert(
                        "Complaint action will be connected to the backend next."
                      )
                    }
                  >
                    Take Action
                  </button>

                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() =>
                      alert(
                        "Complaint assignment will be connected to the backend next."
                      )
                    }
                  >
                    Assign Officer
                  </button>
                </div>
              </div>

              <div className="dashboard-card">
                <p>📝 Complaint Summary</p>
                <h2>Today's Report</h2>

                <div className="dashboard-stat-row">
                  <span>New</span>
                  <strong>11</strong>
                </div>

                <div className="dashboard-stat-row">
                  <span>Under review</span>
                  <strong>7</strong>
                </div>

                <div className="dashboard-stat-row">
                  <span>Resolved</span>
                  <strong>24</strong>
                </div>

                <div className="dashboard-stat-row">
                  <span>Escalated</span>
                  <strong>3</strong>
                </div>
              </div>
            </div>
          )}

          {authorityDashboardSection === "safety" && (
            <div className="dashboard-feature-panel">
              <div className="dashboard-card emergency-alert-card">
                <p>⚠️ ACTIVE SAFETY ALERT</p>

                <h2>High crowd pressure detected</h2>

                <p>
                  Shaniwar Wada has crossed the current
                  monitoring threshold. Review personnel
                  and access controls.
                </p>
              </div>

              <div className="dashboard-card">
                <p>🚔 Police Coordination</p>

                <div className="dashboard-stat-row">
                  <span>Units nearby</span>
                  <strong>4</strong>
                </div>

                <div className="dashboard-stat-row">
                  <span>Available officers</span>
                  <strong>17</strong>
                </div>

                <button
                  type="button"
                  className="primary-btn"
                  onClick={() =>
                    alert(
                      "Police coordination will be connected to the backend next."
                    )
                  }
                >
                  Coordinate Response →
                </button>
              </div>

              <div className="dashboard-card">
                <p>🏥 Emergency Services</p>

                <div className="dashboard-stat-row">
                  <span>Hospitals monitored</span>
                  <strong>8</strong>
                </div>

                <div className="dashboard-stat-row">
                  <span>Ambulances available</span>
                  <strong>12</strong>
                </div>

                <button
                  type="button"
                  className="primary-btn"
                  onClick={() =>
                    alert(
                      "Emergency service coordination will be connected to the backend next."
                    )
                  }
                >
                  View Availability →
                </button>
              </div>
            </div>
          )}

          {authorityDashboardSection === "reports" && (
            <div className="dashboard-feature-panel">
              <div className="dashboard-card">
                <p>📈 Tourism Trends</p>
                <h2>Weekly Visitor Overview</h2>

                <div className="dashboard-stat-row">
                  <span>Monday</span>
                  <strong>10,240</strong>
                </div>

                <div className="dashboard-stat-row">
                  <span>Tuesday</span>
                  <strong>11,180</strong>
                </div>

                <div className="dashboard-stat-row">
                  <span>Wednesday</span>
                  <strong>12,060</strong>
                </div>

                <div className="dashboard-stat-row">
                  <span>Thursday</span>
                  <strong>12,840</strong>
                </div>
              </div>

              <div className="dashboard-card">
                <p>📊 Operational Summary</p>
                <h2>Current Performance</h2>

                <div className="dashboard-stat-row">
                  <span>Alerts resolved</span>
                  <strong>94%</strong>
                </div>

                <div className="dashboard-stat-row">
                  <span>Complaints resolved</span>
                  <strong>88%</strong>
                </div>

                <div className="dashboard-stat-row">
                  <span>Locations healthy</span>
                  <strong>87.5%</strong>
                </div>

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() =>
                    alert(
                      "Report export will be connected to backend analytics next."
                    )
                  }
                >
                  Export Report →
                </button>
              </div>
            </div>
          )}
        </main>

        <footer className="dashboard-footer">
          <span>🏠 Home</span>
          <span>👥 Crowd</span>
          <span>📝 Complaints</span>
          <span>🚨 Safety</span>
          <span>📊 Reports</span>
        </footer>
      </div>
    );
  }

  /* =========================================================
     ADDED: LOCAL PROVIDER DASHBOARD NAVIGATION
  ========================================================= */

  const openLocalDashboardSection = (
    section: string
  ) => {
    setLocalDashboardSection(section);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const logoutLocalProvider = () => {
    setShowLocalDashboard(false);
    setShowLogin(false);

    setTimeout(() => {
      document.getElementById("home")?.scrollIntoView({
        behavior: "smooth",
      });
    }, 100);
  };

  /* =========================================================
     EMAIL / PASSWORD LOGIN
  ========================================================= */

  const handleUserLogin = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!userEmail || !userPassword) {
      alert(
        "Please enter your email and password."
      );
      return;
    }

    try {
      const result =
        await signInWithEmailAndPassword(
          auth,
          userEmail,
          userPassword
        );

      const user = result.user;

      alert(
        `Welcome back to TravelBoost!\nLogged in as ${
          user.email || userEmail
        }`
      );

      console.log(
        "Firebase user:",
        user
      );

      setShowUserLogin(false);
      setShowLogin(false);
      setShowUserDashboard(true);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error(
        "Email login error:",
        error
      );

      const errorCode =
        (
          error as {
            code?: string;
          }
        )?.code;

      if (
        errorCode ===
        "auth/invalid-credential"
      ) {
        alert(
          "Invalid email or password."
        );
      } else if (
        errorCode ===
        "auth/user-not-found"
      ) {
        alert(
          "No account was found with this email."
        );
      } else if (
        errorCode ===
        "auth/wrong-password"
      ) {
        alert(
          "Incorrect password."
        );
      } else if (
        errorCode ===
        "auth/invalid-email"
      ) {
        alert(
          "Please enter a valid email address."
        );
      } else {
        alert(
          "Login failed. Please try again."
        );
      }
    }
  };

  /* =========================================================
     GOOGLE LOGIN
  ========================================================= */

  const handleGoogleLogin =
    async () => {
      try {
        const result =
          await signInWithPopup(
            auth,
            googleProvider
          );

        const user = result.user;

        alert(
          `Welcome to TravelBoost, ${
            user.displayName ||
            user.email ||
            "Traveller"
          }!`
        );

        console.log(
          "Google user:",
          user
        );

        setShowUserLogin(false);
        setShowLogin(false);
        setShowUserDashboard(true);

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } catch (error) {
        console.error(
          "Google login error:",
          error
        );

        const errorCode =
          (
            error as {
              code?: string;
            }
          )?.code;

        if (
          errorCode ===
          "auth/popup-closed-by-user"
        ) {
          return;
        }

        if (
          errorCode ===
          "auth/popup-blocked"
        ) {
          alert(
            "The Google login popup was blocked by your browser. Please allow popups for this site and try again."
          );
          return;
        }

        if (
          errorCode ===
          "auth/cancelled-popup-request"
        ) {
          return;
        }

        alert(
          "Google login failed. Please try again."
        );
      }
    };

  /* =========================================================
     APPLE LOGIN
  ========================================================= */

  const handleAppleLogin =
    async () => {
      try {
        const result =
          await signInWithPopup(
            auth,
            appleProvider
          );

        const user = result.user;

        alert(
          `Welcome to TravelBoost, ${
            user.displayName ||
            user.email ||
            "Traveller"
          }!`
        );

        console.log(
          "Apple user:",
          user
        );
      } catch (error) {
        console.error(
          "Apple login error:",
          error
        );

        const errorCode =
          (
            error as {
              code?: string;
            }
          )?.code;

        if (
          errorCode ===
          "auth/popup-closed-by-user"
        ) {
          return;
        }

        if (
          errorCode ===
          "auth/popup-blocked"
        ) {
          alert(
            "The Apple login popup was blocked by your browser. Please allow popups for this site and try again."
          );
          return;
        }

        if (
          errorCode ===
          "auth/cancelled-popup-request"
        ) {
          return;
        }

        alert(
          "Apple login could not be completed. Please check the Apple provider configuration in Firebase."
        );
      }
    };

  /* =========================================================
     ADDED: USER DASHBOARD NAVIGATION
  ========================================================= */

  const openUserDashboardSection = (
    section: string
  ) => {
    setDashboardSection(section);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const dashboardTitle =
    dashboardSection === "overview"
      ? "Your Travel Overview"
      : dashboardSection === "connect"
      ? "User–Local Connect"
      : dashboardSection === "crowd"
      ? "Crowd Predictor"
      : dashboardSection === "cleanliness"
      ? "Cleanliness"
      : "Emergency";

  /* =========================================================
     ADDED: USER DASHBOARD
  ========================================================= */

  if (showUserDashboard) {
    return (
      <div className="app user-dashboard-page">
        <div className="background-glow glow-one" />
        <div className="background-glow glow-two" />

        <nav className="navbar dashboard-navbar">
          <button
            type="button"
            className="logo logo-button"
            onClick={closeLogin}
            aria-label="Back to TravelBoost home"
          >
            Travel<span>Boost</span>
          </button>

          <div className="dashboard-user-info">
            <span>👤 User</span>
          </div>

          <button
            type="button"
            className="login-btn"
            onClick={closeLogin}
          >
            Logout
          </button>
        </nav>

        <main className="user-dashboard-content">
          <div className="dashboard-nav">
            <button
              type="button"
              className={
                dashboardSection === "overview"
                  ? "dashboard-nav-btn active"
                  : "dashboard-nav-btn"
              }
              onClick={() =>
                openUserDashboardSection(
                  "overview"
                )
              }
            >
              Overview
            </button>

            <button
              type="button"
              className={
                dashboardSection === "connect"
                  ? "dashboard-nav-btn active"
                  : "dashboard-nav-btn"
              }
              onClick={() =>
                openUserDashboardSection(
                  "connect"
                )
              }
            >
              User–Local Connect
            </button>

            <button
              type="button"
              className={
                dashboardSection === "crowd"
                  ? "dashboard-nav-btn active"
                  : "dashboard-nav-btn"
              }
              onClick={() =>
                openUserDashboardSection(
                  "crowd"
                )
              }
            >
              Crowd Predictor
            </button>

            <button
              type="button"
              className={
                dashboardSection === "cleanliness"
                  ? "dashboard-nav-btn active"
                  : "dashboard-nav-btn"
              }
              onClick={() =>
                openUserDashboardSection(
                  "cleanliness"
                )
              }
            >
              Cleanliness
            </button>

            <button
              type="button"
              className={
                dashboardSection === "emergency"
                  ? "dashboard-nav-btn active"
                  : "dashboard-nav-btn"
              }
              onClick={() =>
                openUserDashboardSection(
                  "emergency"
                )
              }
            >
              Emergency
            </button>
          </div>

          <section className="dashboard-heading">
            <p className="section-label">
              TRAVELBOOST • PERSONAL DASHBOARD
            </p>

            <h1>{dashboardTitle}</h1>

            <p>
              Personalized information for your
              journey.
            </p>
          </section>

          {dashboardSection === "overview" && (
            <>
              <div className="dashboard-grid">

                <div className="dashboard-card dashboard-card-wide">
                  <span className="dashboard-card-icon">
                    📍
                  </span>

                  <div>
                    <p>Location</p>

                    <select
                      value={selectedLocation}
                      onChange={(event) =>
                        setSelectedLocation(
                          event.target.value
                        )
                      }
                    >
                      <option>
                        Shaniwar Wada, Pune
                      </option>
                      <option>
                        Aga Khan Palace, Pune
                      </option>
                      <option>
                        Lal Mahal, Pune
                      </option>
                      <option>
                        Sinhagad Fort, Pune
                      </option>
                    </select>
                  </div>
                </div>

                <div className="dashboard-card dashboard-card-wide">
                  <span className="dashboard-card-icon">
                    🕐
                  </span>

                  <div>
                    <p>Time</p>
                    <strong>
                      {new Date().toLocaleTimeString(
                        [],
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </strong>

                    <small>
                      Current visit time
                    </small>
                  </div>
                </div>

                <div className="dashboard-card dashboard-card-wide">
                  <span className="dashboard-card-icon">
                    👥
                  </span>

                  <div>
                    <p>Number of People</p>

                    <strong>
                      {peopleCount.toLocaleString()}
                    </strong>

                    <small>
                      <span className="crowd-low">
                        🟢 Low
                      </span>
                      {" "}
                      <span>
                        🟡 Moderate
                      </span>
                      {" "}
                      <span>
                        🔴 High
                      </span>
                    </small>
                  </div>
                </div>

                <div className="dashboard-card dashboard-card-wide">
                  <span className="dashboard-card-icon">
                    ❤️
                  </span>

                  <div>
                    <p>Your Interests</p>

                    <select
                      value={userInterest}
                      onChange={(event) =>
                        setUserInterest(
                          event.target.value
                        )
                      }
                    >
                      <option>
                        Culture
                      </option>
                      <option>
                        Nature
                      </option>
                      <option>
                        Food
                      </option>
                      <option>
                        Adventure
                      </option>
                      <option>
                        History
                      </option>
                      <option>
                        Shopping
                      </option>
                    </select>
                  </div>
                </div>

                <div className="dashboard-card dashboard-card-wide">
                  <span className="dashboard-card-icon">
                    💰
                  </span>

                  <div>
                    <p>Budget</p>

                    <select
                      value={userBudget}
                      onChange={(event) =>
                        setUserBudget(
                          event.target.value
                        )
                      }
                    >
                      <option>
                        ₹5,000
                      </option>
                      <option>
                        ₹10,000
                      </option>
                      <option>
                        ₹25,000
                      </option>
                      <option>
                        ₹50,000+
                      </option>
                    </select>
                  </div>
                </div>

                <div className="dashboard-card dashboard-card-wide">
                  <span className="dashboard-card-icon">
                    🌤️
                  </span>

                  <div>
                    <p>Weather</p>
                    <strong>
                      27°C • Partly Cloudy
                    </strong>

                    <small>
                      Pleasant conditions
                    </small>
                  </div>
                </div>

              </div>

              <div className="dashboard-card ai-recommendation-card">
                <div className="ai-card-header">
                  <span className="dashboard-card-icon">
                    🤖
                  </span>

                  <div>
                    <p>AI Recommendation</p>

                    <h2>
                      Discover a better way to
                      explore today
                    </h2>
                  </div>
                </div>

                <p className="ai-recommendation-text">
                  Based on your location,
                  interests, budget, and current
                  crowd levels, TravelBoost
                  recommends exploring nearby
                  attractions before visiting the
                  busiest spots.
                </p>

                <div className="ai-recommendation-tags">
                  <span>
                    📍 Nearby
                  </span>

                  <span>
                    👥 Lower Crowd
                  </span>

                  <span>
                    ❤️ {userInterest}
                  </span>

                  <span>
                    💰 {userBudget}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="primary-btn dashboard-plan-btn"
                onClick={() =>
                  alert(
                    "Trip planning tools coming soon!"
                  )
                }
              >
                ✨ Plan / Update My Trip
              </button>
            </>
          )}

          {dashboardSection === "connect" && (
            <div className="dashboard-feature-panel">
              <div className="dashboard-feature-card">
                <span className="dashboard-card-icon">
                  🏠
                </span>

                <h2>
                  Local Homestays
                </h2>

                <p>
                  Find homestays with ratings,
                  prices, availability, images,
                  and local experiences.
                </p>

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() =>
                    alert(
                      "Local homestays are coming next."
                    )
                  }
                >
                  Explore Homestays →
                </button>
              </div>

              <div className="dashboard-feature-card">
                <span className="dashboard-card-icon">
                  🧑‍🤝‍🧑
                </span>

                <h2>
                  Local Guides
                </h2>

                <p>
                  Connect with local guides
                  based on location, language,
                  speciality, rating, and price.
                </p>

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() =>
                    alert(
                      "Local guides are coming next."
                    )
                  }
                >
                  Find Guides →
                </button>
              </div>

              <div className="dashboard-feature-card">
                <span className="dashboard-card-icon">
                  🎭
                </span>

                <h2>
                  Arts & Crafts
                </h2>

                <p>
                  Discover local products,
                  artisans, ratings, prices,
                  durability, and seller details.
                </p>

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() =>
                    alert(
                      "Local arts and crafts are coming next."
                    )
                  }
                >
                  Explore Local Crafts →
                </button>
              </div>
            </div>
          )}

          {dashboardSection === "crowd" && (
            <div className="dashboard-feature-panel">
              <div className="dashboard-card crowd-search-card">
                <div>
                  <p>
                    Search Specific Spot
                  </p>

                  <input
                    type="text"
                    placeholder="Search a tourist spot..."
                    defaultValue={
                      "Shaniwar Wada"
                    }
                  />
                </div>

                <button
                  type="button"
                  className="primary-btn"
                  onClick={() =>
                    alert(
                      "Crowd analysis will be connected to live data next."
                    )
                  }
                >
                  Search
                </button>
              </div>

              <div className="dashboard-card">
                <p>
                  Selected Spot
                </p>

                <h2>
                  📍 Shaniwar Wada, Pune
                </h2>

                <div className="dashboard-stat-row">
                  <span>
                    👥 Current People
                  </span>

                  <strong>
                    {peopleCount.toLocaleString()}
                  </strong>
                </div>

                <div className="dashboard-stat-row">
                  <span>
                    📊 Density
                  </span>

                  <strong>
                    HIGH
                  </strong>
                </div>

                <div className="dashboard-stat-row">
                  <span>
                    📈 Expected
                  </span>

                  <strong>
                    Increasing
                  </strong>
                </div>

                <div className="dashboard-stat-row">
                  <span>
                    ⏱️ Waiting
                  </span>

                  <strong>
                    25 min
                  </strong>
                </div>
              </div>

              <div className="dashboard-card ai-recommendation-card">
                <div className="ai-card-header">
                  <span className="dashboard-card-icon">
                    🤖
                  </span>

                  <div>
                    <p>
                      AI Travel Planner
                    </p>

                    <h2>
                      Try a nearby spot first
                    </h2>
                  </div>
                </div>

                <p>
                  Lal Mahal may provide a
                  lower-crowd alternative
                  nearby before visiting the
                  busiest attraction.
                </p>

                <button
                  type="button"
                  className="primary-btn"
                  onClick={() =>
                    alert(
                      "Route generation will be connected to maps next."
                    )
                  }
                >
                  ✨ Generate My Route
                </button>
              </div>
            </div>
          )}

          {dashboardSection === "cleanliness" && (
            <div className="dashboard-feature-panel">
              <div className="dashboard-card">
                <p>
                  🧹 Community Cleanliness
                </p>

                <h2>
                  Problems reported by
                  travellers
                </h2>

                <div className="problem-preview">
                  <strong>
                    🥇 Overflowing Garbage
                  </strong>

                  <span>
                    📍 Shaniwar Wada
                  </span>

                  <span>
                    👍 248 votes • 🔥 High
                    impact
                  </span>
                </div>

                <div className="problem-preview">
                  <strong>
                    🥈 Dirty Toilets
                  </strong>

                  <span>
                    📍 Tourist Zone
                  </span>

                  <span>
                    👍 186 votes • 🔥 High
                    impact
                  </span>
                </div>

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() =>
                    alert(
                      "The full cleanliness reporting system is coming next."
                    )
                  }
                >
                  View Problems →
                </button>
              </div>

              <div className="dashboard-card">
                <p>
                  ➕ Report New Problem
                </p>

                <input
                  type="text"
                  placeholder="Problem name"
                />

                <input
                  type="text"
                  placeholder="Location"
                />

                <textarea
                  placeholder="Describe the problem..."
                  rows={4}
                />

                <button
                  type="button"
                  className="primary-btn"
                  onClick={() =>
                    alert(
                      "Problem reporting will be connected to Firebase next."
                    )
                  }
                >
                  🚨 Submit Report
                </button>
              </div>
            </div>
          )}

          {dashboardSection === "emergency" && (
            <div className="dashboard-feature-panel">
              <div className="dashboard-card emergency-alert-card">
                <p>
                  ⚠️ Location Warnings
                </p>

                <h2>
                  High crowd activity detected
                </h2>

                <p>
                  Shaniwar Wada currently has
                  approximately{" "}
                  {peopleCount.toLocaleString()}{" "}
                  people.
                </p>
              </div>

              <div className="dashboard-card">
                <p>
                  🏥 Nearby Emergency Services
                </p>

                <div className="emergency-service">
                  <strong>
                    🚔 Police Station
                  </strong>

                  <span>
                    0.8 km • 📞 100
                  </span>
                </div>

                <div className="emergency-service">
                  <strong>
                    🏥 Hospital
                  </strong>

                  <span>
                    1.2 km • 📞 108
                  </span>
                </div>

                <div className="emergency-service">
                  <strong>
                    🚒 Fire Station
                  </strong>

                  <span>
                    2.0 km • 📞 101
                  </span>
                </div>
              </div>

              <div className="dashboard-card">
                <p>
                  🆘 Emergency Contacts
                </p>

                <div className="dashboard-stat-row">
                  <span>
                    Police
                  </span>

                  <strong>
                    100
                  </strong>
                </div>

                <div className="dashboard-stat-row">
                  <span>
                    Ambulance
                  </span>

                  <strong>
                    108
                  </strong>
                </div>

                <div className="dashboard-stat-row">
                  <span>
                    Fire
                  </span>

                  <strong>
                    101
                  </strong>
                </div>

                <div className="dashboard-stat-row">
                  <span>
                    Tourist Helpline
                  </span>

                  <strong>
                    1363
                  </strong>
                </div>

                <button
                  type="button"
                  className="primary-btn"
                  onClick={() =>
                    alert(
                      "Emergency calling will be connected to device services next."
                    )
                  }
                >
                  🚨 Call for Help
                </button>
              </div>
            </div>
          )}
        </main>

        <footer className="dashboard-footer">
          <span>🏠 Home</span>
          <span>🗺️ Explore</span>
          <span>❤️ Saved</span>
          <span>🎫 My Trips</span>
          <span>👤 Profile</span>
        </footer>
      </div>
    );
  }

  /* =========================================================
     ADDED: LOCAL PROVIDER DASHBOARD
  ========================================================= */

  if (showLocalDashboard) {
    return (
      <div className="app local-dashboard-page">
        <div className="background-glow glow-one" />
        <div className="background-glow glow-two" />

        <nav className="navbar dashboard-navbar">
          <button
            type="button"
            className="logo logo-button"
            onClick={logoutLocalProvider}
            aria-label="Back to TravelBoost home"
          >
            Travel<span>Boost</span>
          </button>

          <div className="dashboard-user-info">
            <span>🏡 Local Provider</span>
          </div>

          <button
            type="button"
            className="login-btn"
            onClick={logoutLocalProvider}
          >
            Logout
          </button>
        </nav>

        <main className="local-dashboard-content">
          <div className="dashboard-nav">
            <button
              type="button"
              className={
                localDashboardSection === "profile"
                  ? "dashboard-nav-btn active"
                  : "dashboard-nav-btn"
              }
              onClick={() =>
                openLocalDashboardSection(
                  "profile"
                )
              }
            >
              Profile
            </button>

            <button
              type="button"
              className={
                localDashboardSection === "details"
                  ? "dashboard-nav-btn active"
                  : "dashboard-nav-btn"
              }
              onClick={() =>
                openLocalDashboardSection(
                  "details"
                )
              }
            >
              Details
            </button>

            <button
              type="button"
              className={
                localDashboardSection === "requests"
                  ? "dashboard-nav-btn active"
                  : "dashboard-nav-btn"
              }
              onClick={() =>
                openLocalDashboardSection(
                  "requests"
                )
              }
            >
              Traveller Requests
            </button>

            {providerType !== "Arts & Crafts" && (
              <button
                type="button"
                className={
                  localDashboardSection === "chats"
                    ? "dashboard-nav-btn active"
                    : "dashboard-nav-btn"
                }
                onClick={() =>
                  openLocalDashboardSection(
                    "chats"
                  )
                }
              >
                Chats
              </button>
            )}
          </div>

          <section className="dashboard-heading">
            <p className="section-label">
              TRAVELBOOST • LOCAL PROVIDER
            </p>

            <h1>
              {localDashboardSection ===
              "profile"
                ? "Provider Profile"
                : localDashboardSection ===
                  "details"
                ? "Service Details"
                : localDashboardSection ===
                  "requests"
                ? "Traveller Requests"
                : "Chats"}
            </h1>

            <p>
              Manage your TravelBoost local provider
              profile and traveller activity.
            </p>
          </section>

          {localDashboardSection ===
            "profile" && (
            <div className="local-dashboard-grid">
              <div className="dashboard-card">
                <span className="dashboard-card-icon">
                  👤
                </span>

                <p>
                  Provider Name
                </p>

                <input
                  type="text"
                  value={providerName}
                  onChange={(event) =>
                    setProviderName(
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="dashboard-card">
                <span className="dashboard-card-icon">
                  📍
                </span>

                <p>
                  Location
                </p>

                <input
                  type="text"
                  value={providerLocation}
                  onChange={(event) =>
                    setProviderLocation(
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="dashboard-card">
                <span className="dashboard-card-icon">
                  🏷️
                </span>

                <p>
                  Provider Type
                </p>

                <select
                  value={providerType}
                  onChange={(event) =>
                    setProviderType(
                      event.target.value
                    )
                  }
                >
                  <option>
                    Homestay
                  </option>
                  <option>
                    Guide
                  </option>
                  <option>
                    Arts & Crafts
                  </option>
                </select>
              </div>

              <div className="dashboard-card">
                <span className="dashboard-card-icon">
                  ⭐
                </span>

                <p>
                  Rating
                </p>

                <strong>
                  {providerRating} / 5
                </strong>

                <small>
                  Based on traveller reviews
                </small>
              </div>

              <div className="dashboard-card">
                <span className="dashboard-card-icon">
                  🗣️
                </span>

                <p>
                  Languages
                </p>

                <input
                  type="text"
                  value={providerLanguages}
                  onChange={(event) =>
                    setProviderLanguages(
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="dashboard-card">
                <span className="dashboard-card-icon">
                  📞
                </span>

                <p>
                  Contact
                </p>

                <strong>
                  {userEmail || "Provider contact"}
                </strong>
              </div>
            </div>
          )}

          {localDashboardSection ===
            "details" && (
            <div className="local-dashboard-grid">
              <div className="dashboard-card">
                <span className="dashboard-card-icon">
                  💰
                </span>

                <p>
                  Service Price
                </p>

                <input
                  type="text"
                  value={servicePrice}
                  onChange={(event) =>
                    setServicePrice(
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="dashboard-card">
                <span className="dashboard-card-icon">
                  🟢
                </span>

                <p>
                  Availability
                </p>

                <select
                  value={serviceAvailability}
                  onChange={(event) =>
                    setServiceAvailability(
                      event.target.value
                    )
                  }
                >
                  <option>
                    Available
                  </option>
                  <option>
                    Limited Availability
                  </option>
                  <option>
                    Currently Unavailable
                  </option>
                </select>
              </div>

              <div className="dashboard-card local-service-card">
                <span className="dashboard-card-icon">
                  {providerType ===
                  "Homestay"
                    ? "🏠"
                    : providerType ===
                      "Guide"
                    ? "🧑‍🤝‍🧑"
                    : "🎭"}
                </span>

                <p>
                  {providerType}
                </p>

                <h2>
                  {providerName}
                </h2>

                <p>
                  📍 {providerLocation}
                </p>

                <p>
                  ⭐ {providerRating}
                </p>

                <p>
                  🟢 {serviceAvailability}
                </p>

                <strong>
                  {servicePrice}
                </strong>
              </div>

              <div className="dashboard-card">
                <p>
                  About Your Service
                </p>

                <textarea
                  rows={6}
                  defaultValue={
                    providerType ===
                    "Homestay"
                      ? "Comfortable local stay with a genuine regional experience."
                      : providerType ===
                        "Guide"
                      ? "Local guide offering destination knowledge, culture, food, and heritage experiences."
                      : "Locally made products and authentic craftsmanship for travellers."
                  }
                />

                <button
                  type="button"
                  className="primary-btn"
                  onClick={() =>
                    alert(
                      "Service details saved locally. Backend sync will be connected by your backend team."
                    )
                  }
                >
                  Save Details
                </button>
              </div>
            </div>
          )}

          {localDashboardSection ===
            "requests" && (
            <div className="local-request-list">
              <div className="dashboard-card">
                <p>
                  NEW TRAVELLER REQUEST
                </p>

                <h2>
                  👤 Traveller from Pune
                </h2>

                <div className="dashboard-stat-row">
                  <span>
                    📅 Date
                  </span>

                  <strong>
                    18 Sept 2026
                  </strong>
                </div>

                <div className="dashboard-stat-row">
                  <span>
                    👥 Guests
                  </span>

                  <strong>
                    2
                  </strong>
                </div>

                <div className="dashboard-stat-row">
                  <span>
                    📍 Location
                  </span>

                  <strong>
                    {providerLocation}
                  </strong>
                </div>

                <div className="local-request-actions">
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={() =>
                      alert(
                        "Request accepted. Backend request management will be connected next."
                      )
                    }
                  >
                    Accept
                  </button>

                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() =>
                      alert(
                        "Request declined. Backend request management will be connected next."
                      )
                    }
                  >
                    Decline
                  </button>

                  {providerType !==
                    "Arts & Crafts" && (
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() =>
                        openLocalDashboardSection(
                          "chats"
                        )
                      }
                    >
                      Chat
                    </button>
                  )}
                </div>
              </div>

              <div className="dashboard-card">
                <p>
                  RECENT ACTIVITY
                </p>

                <h2>
                  📊 Provider Summary
                </h2>

                <div className="dashboard-stat-row">
                  <span>
                    Pending requests
                  </span>

                  <strong>
                    3
                  </strong>
                </div>

                <div className="dashboard-stat-row">
                  <span>
                    Accepted this month
                  </span>

                  <strong>
                    12
                  </strong>
                </div>

                <div className="dashboard-stat-row">
                  <span>
                    Traveller rating
                  </span>

                  <strong>
                    ⭐ {providerRating}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {localDashboardSection ===
            "chats" &&
            providerType !==
              "Arts & Crafts" && (
              <div className="local-request-list">
                <div className="dashboard-card">
                  <p>
                    💬 ACTIVE CHAT
                  </p>

                  <h2>
                    Traveller Support Chat
                  </h2>

                  <p>
                    A traveller can contact you
                    here about availability,
                    directions, services, and
                    booking questions.
                  </p>

                  <textarea
                    rows={5}
                    placeholder="Type a message..."
                  />

                  <button
                    type="button"
                    className="primary-btn"
                    onClick={() =>
                      alert(
                        "Message sending will be connected to the backend next."
                      )
                    }
                  >
                    Send Message →
                  </button>
                </div>
              </div>
            )}
        </main>

        <footer className="dashboard-footer">
          <span>🏠 Home</span>
          <span>📊 Dashboard</span>
          <span>⭐ Reviews</span>
          <span>📨 Requests</span>
          {providerType !==
            "Arts & Crafts" && (
            <span>💬 Chats</span>
          )}
        </footer>
      </div>
    );
  }

  /* =========================================================
     AUTHORITY LOGIN PAGE
  ========================================================= */

  if (showAuthorityLogin) {
    return (
      <div className="app login-page user-login-page authority-login-page">
        <div className="background-glow glow-one" />
        <div className="background-glow glow-two" />

        <nav className="navbar login-navbar">
          <button
            type="button"
            className="logo logo-button"
            onClick={closeLogin}
            aria-label="Back to TravelBoost home"
          >
            Travel<span>Boost</span>
          </button>

          <button
            type="button"
            className="login-back-button"
            onClick={backToAuthorityRoleSelection}
          >
            ← Back
          </button>
        </nav>

        <main className="user-login-content">
          <div className="user-login-heading">
            <div className="user-login-icon">
              🛡️
            </div>

            <p className="tag">
              FOR AUTHORITIES
            </p>

            <h1>
              Authority{" "}
              <span>Login.</span>
            </h1>

            <p>
              Secure access to the TravelBoost
              authority portal.
            </p>
          </div>

          <form
            className="user-login-card"
            onSubmit={handleAuthorityLogin}
          >
            <div className="login-input-group">
              <label htmlFor="authority-email">
                Official Email
              </label>

              <input
                id="authority-email"
                type="email"
                placeholder="official@authority.gov"
                value={authorityEmail}
                onChange={(event) =>
                  setAuthorityEmail(
                    event.target.value
                  )
                }
                autoComplete="email"
              />
            </div>

            <div className="login-input-group">
              <label htmlFor="authority-password">
                Password
              </label>

              <input
                id="authority-password"
                type="password"
                placeholder="Enter your password"
                value={authorityPassword}
                onChange={(event) =>
                  setAuthorityPassword(
                    event.target.value
                  )
                }
                autoComplete="current-password"
              />
            </div>

            <div className="login-form-options">
              <label className="remember-option">
                <input
                  type="checkbox"
                  defaultChecked
                />

                <span>
                  Remember me
                </span>
              </label>

              <button
                type="button"
                className="forgot-password"
                onClick={() =>
                  alert(
                    "Authority password recovery will be available soon."
                  )
                }
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="primary-btn user-login-submit"
            >
              Secure Sign In →
            </button>

            <div className="login-divider">
              <span>OR</span>
            </div>

            <button
              type="button"
              className="social-login-btn google-login-btn"
              onClick={
                handleAuthorityGoogleLogin
              }
            >
              <span className="social-login-icon">
                G
              </span>

              <span>
                Continue with Google
              </span>
            </button>

            <p className="login-register-text">
              Authority access is restricted to
              verified TravelBoost partners.
            </p>
          </form>
        </main>
      </div>
    );
  }

  /* =========================================================
     LOCAL LOGIN PAGE
  ========================================================= */

  if (showLocalLogin) {
    return (
      <div className="app login-page user-login-page">
        <div className="background-glow glow-one" />
        <div className="background-glow glow-two" />

        <nav className="navbar login-navbar">
          <button
            type="button"
            className="logo logo-button"
            onClick={closeLogin}
            aria-label="Back to TravelBoost home"
          >
            Travel<span>Boost</span>
          </button>

          <button
            type="button"
            className="login-back-button"
            onClick={backToLocalRoleSelection}
          >
            ← Back
          </button>
        </nav>

        <main className="user-login-content">
          <div className="user-login-heading">
            <div className="user-login-icon">
              🏡
            </div>

            <p className="tag">
              FOR LOCAL PROVIDERS
            </p>

            <h1>
              Welcome back to{" "}
              <span>TravelBoost.</span>
            </h1>

            <p>
              Sign in to manage your local
              provider account.
            </p>
          </div>

          <form
            className="user-login-card"
            onSubmit={handleLocalLogin}
          >
            <div className="login-input-group">
              <label htmlFor="local-email">
                Email Address
              </label>

              <input
                id="local-email"
                type="email"
                placeholder="you@example.com"
                value={localEmail}
                onChange={(event) =>
                  setLocalEmail(
                    event.target.value
                  )
                }
                autoComplete="email"
              />
            </div>

            <div className="login-input-group">
              <label htmlFor="local-password">
                Password
              </label>

              <input
                id="local-password"
                type="password"
                placeholder="Enter your password"
                value={localPassword}
                onChange={(event) =>
                  setLocalPassword(
                    event.target.value
                  )
                }
                autoComplete="current-password"
              />
            </div>

            <div className="login-form-options">
              <label className="remember-option">
                <input
                  type="checkbox"
                  defaultChecked
                />

                <span>
                  Remember me
                </span>
              </label>

              <button
                type="button"
                className="forgot-password"
                onClick={() =>
                  alert(
                    "Password recovery will be available soon."
                  )
                }
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="primary-btn user-login-submit"
            >
              Sign In →
            </button>

            <div className="login-divider">
              <span>OR</span>
            </div>

            <button
              type="button"
              className="social-login-btn google-login-btn"
              onClick={handleLocalGoogleLogin}
            >
              <span className="social-login-icon">
                G
              </span>

              <span>
                Continue with Google
              </span>
            </button>

            <p className="login-register-text">
              Local provider access is reserved
              for registered TravelBoost partners.
            </p>
          </form>
        </main>
      </div>
    );
  }

  /* =========================================================
     USER LOGIN PAGE
  ========================================================= */

  if (showUserLogin) {
    return (
      <div className="app login-page user-login-page">
        <div className="background-glow glow-one" />
        <div className="background-glow glow-two" />

        {/* USER LOGIN NAVBAR */}

        <nav className="navbar login-navbar">
          <button
            type="button"
            className="logo logo-button"
            onClick={closeLogin}
            aria-label="Back to TravelBoost home"
          >
            Travel<span>Boost</span>
          </button>

          <button
            type="button"
            className="login-back-button"
            onClick={backToRoleSelection}
          >
            ← Back
          </button>
        </nav>

        {/* USER LOGIN CONTENT */}

        <main className="user-login-content">
          <div className="user-login-heading">
            <div className="user-login-icon">
              👤
            </div>

            <p className="tag">
              FOR TRAVELLERS
            </p>

            <h1>
              Welcome back to{" "}
              <span>TravelBoost.</span>
            </h1>

            <p>
              Sign in to continue your journey.
            </p>
          </div>

          <form
            className="user-login-card"
            onSubmit={handleUserLogin}
          >
            <div className="login-input-group">
              <label htmlFor="user-email">
                Email Address
              </label>

              <input
                id="user-email"
                type="email"
                placeholder="you@example.com"
                value={userEmail}
                onChange={(event) =>
                  setUserEmail(
                    event.target.value
                  )
                }
                autoComplete="email"
              />
            </div>

            <div className="login-input-group">
              <label htmlFor="user-password">
                Password
              </label>

              <input
                id="user-password"
                type="password"
                placeholder="Enter your password"
                value={userPassword}
                onChange={(event) =>
                  setUserPassword(
                    event.target.value
                  )
                }
                autoComplete="current-password"
              />
            </div>

            <div className="login-form-options">
              <label className="remember-option">
                <input
                  type="checkbox"
                  defaultChecked
                />

                <span>
                  Remember me
                </span>
              </label>

              <button
                type="button"
                className="forgot-password"
                onClick={() =>
                  alert(
                    "Password recovery will be available soon."
                  )
                }
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="primary-btn user-login-submit"
            >
              Sign In →
            </button>

            <div className="login-divider">
              <span>OR</span>
            </div>

            {/* GOOGLE LOGIN */}

            <button
              type="button"
              className="social-login-btn google-login-btn"
              onClick={handleGoogleLogin}
            >
              <span className="social-login-icon">
                G
              </span>

              <span>
                Continue with Google
              </span>
            </button>

            {/* APPLE LOGIN */}

            <button
              type="button"
              className="social-login-btn apple-login-btn"
              onClick={handleAppleLogin}
            >
              <span className="social-login-icon">
                
              </span>

              <span>
                Continue with Apple
              </span>
            </button>

            {/* GUEST LOGIN */}

            <button
              type="button"
              className="secondary-btn guest-login-btn"
              onClick={() =>
                alert(
                  "Guest exploration will be available soon."
                )
              }
            >
              Continue as Guest
            </button>

            <p className="login-register-text">
              New to TravelBoost?{" "}
              <button
                type="button"
                onClick={() =>
                  alert(
                    "Account registration will be available soon."
                  )
                }
              >
                Create an account
              </button>
            </p>
          </form>
        </main>
      </div>
    );
  }

  /* =========================================================
     LOGIN ROLE SELECTION PAGE
  ========================================================= */

  if (showLogin) {
    return (
      <div className="app login-page">
        <div className="background-glow glow-one" />
        <div className="background-glow glow-two" />

        {/* LOGIN NAVBAR */}

        <nav className="navbar login-navbar">
          <button
            type="button"
            className="logo logo-button"
            onClick={closeLogin}
            aria-label="Back to TravelBoost home"
          >
            Travel<span>Boost</span>
          </button>

          <button
            type="button"
            className="login-back-button"
            onClick={closeLogin}
          >
            ← Back
          </button>
        </nav>

        {/* LOGIN CONTENT */}

        <main className="login-content">
          <div className="login-heading">
            <p className="tag">
              TRAVEL • DISCOVER • CONNECT
            </p>

            <h1>
              Welcome to{" "}
              <span>TravelBoost.</span>
            </h1>

            <p>
              Choose how you want to continue.
            </p>
          </div>

          <div className="login-role-grid">

            {/* USER LOGIN */}

            <button
              type="button"
              className="login-role-card"
              onClick={openUserLogin}
            >
              <div className="login-role-icon">
                👤
              </div>

              <div className="login-role-content">
                <span className="login-role-label">
                  FOR TRAVELLERS
                </span>

                <h2>User Login</h2>

                <p>
                  Discover destinations, plan
                  trips, check crowds, and
                  explore local experiences.
                </p>
              </div>

              <span className="login-role-arrow">
                →
              </span>
            </button>

            {/* LOCAL LOGIN */}

            <button
              type="button"
              className="login-role-card"
              onClick={openLocalLogin}
            >
              <div className="login-role-icon">
                🏡
              </div>

              <div className="login-role-content">
                <span className="login-role-label">
                  FOR LOCAL PROVIDERS
                </span>

                <h2>Local Login</h2>

                <p>
                  Manage your homestay, guide
                  profile, local services, and
                  traveller requests.
                </p>
              </div>

              <span className="login-role-arrow">
                →
              </span>
            </button>

            {/* AUTHORITY LOGIN */}

            <button
              type="button"
              className="login-role-card"
              onClick={openAuthorityLogin}
            >
              <div className="login-role-icon">
                🛡️
              </div>

              <div className="login-role-content">
                <span className="login-role-label">
                  FOR AUTHORITIES
                </span>

                <h2>Authority Login</h2>

                <p>
                  Monitor crowds, manage
                  complaints, and oversee
                  tourism and public safety.
                </p>
              </div>

              <span className="login-role-arrow">
                →
              </span>
            </button>

          </div>
        </main>
      </div>
    );
  }

  /* =========================================================
     DESTINATION DETAILS PAGE
  ========================================================= */

  if (selectedDestination) {
    return (
      <div className="app destination-page">
        <nav className="navbar">
          <button
            type="button"
            className="logo logo-button"
            onClick={() =>
              scrollToSection("home")
            }
          >
            Travel<span>Boost</span>
          </button>

          <div className="nav-links">
            <button
              type="button"
              onClick={closeDestination}
            >
              Explore
            </button>
          </div>

          <button
            type="button"
            className="login-btn"
            onClick={closeDestination}
          >
            ← Back
          </button>
        </nav>

        <main className="destination-details">

          <div
            className="destination-hero-image"
            style={{
              backgroundImage: `linear-gradient(
                rgba(7, 19, 33, 0.35),
                rgba(7, 19, 33, 0.85)
              ), url("${selectedDestination.image}")`,
            }}
          >
            <button
              type="button"
              className="back-btn"
              onClick={closeDestination}
              aria-label="Go back to destinations"
            >
              ← Back to destinations
            </button>

            <div className="destination-hero-content">
              <p className="tag">
                ✈ EXPLORE • DISCOVER • EXPERIENCE
              </p>

              <h1>
                {selectedDestination.name}
              </h1>

              <p className="destination-location">
                📍{" "}
                {
                  selectedDestination.location
                }
              </p>
            </div>
          </div>

          <section className="destination-info">
            <div className="destination-main-info">
              <p className="section-label">
                ABOUT THIS DESTINATION
              </p>

              <h2>
                Discover the beauty of{" "}
                {
                  selectedDestination.name
                }
              </h2>

              <p className="destination-description">
                {
                  selectedDestination.description
                }
              </p>

              <div className="destination-stats">

                <div className="stat-card">
                  <span className="stat-icon">
                    📅
                  </span>

                  <div>
                    <p>Best Time</p>

                    <strong>
                      {
                        selectedDestination.bestTime
                      }
                    </strong>
                  </div>
                </div>

                <div className="stat-card">
                  <span className="stat-icon">
                    🕒
                  </span>

                  <div>
                    <p>
                      Recommended Stay
                    </p>

                    <strong>
                      {
                        selectedDestination.duration
                      }
                    </strong>
                  </div>
                </div>

                <div className="stat-card">
                  <span className="stat-icon">
                    ⭐
                  </span>

                  <div>
                    <p>
                      TravelBoost Pick
                    </p>

                    <strong>
                      Highly Recommended
                    </strong>
                  </div>
                </div>

              </div>
            </div>

            <div className="highlights-section">
              <p className="section-label">
                TOP EXPERIENCES
              </p>

              <h2>
                Things you shouldn't miss
              </h2>

              <div className="highlights-grid">
                {selectedDestination.highlights.map(
                  (highlight, index) => (
                    <div
                      className="highlight-card"
                      key={highlight}
                    >
                      <span>
                        {String(
                          index + 1
                        ).padStart(2, "0")}
                      </span>

                      <h3>
                        {highlight}
                      </h3>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="plan-trip-box">
              <div>
                <p className="section-label">
                  READY TO EXPLORE?
                </p>

                <h2>
                  Start planning your{" "}
                  {
                    selectedDestination.name
                  } trip
                </h2>

                <p>
                  Discover attractions,
                  create your itinerary,
                  and make your journey
                  unforgettable.
                </p>
              </div>

              <button
                type="button"
                className="primary-btn"
                onClick={() =>
                  alert(
                    `Your ${selectedDestination.name} trip planner is coming soon!`
                  )
                }
              >
                Plan My Trip →
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  /* =========================================================
     MAIN WEBSITE
  ========================================================= */

  return (
    <div className="app">

      {/* NAVBAR */}

      <nav className="navbar">
        <button
          type="button"
          className="logo logo-button"
          onClick={() =>
            scrollToSection("home")
          }
          aria-label="Go to home"
        >
          Travel<span>Boost</span>
        </button>

        <div className="nav-links">
          <button
            type="button"
            onClick={() =>
              scrollToSection("home")
            }
          >
            Home
          </button>

          <button
            type="button"
            onClick={() =>
              scrollToSection(
                "destinations"
              )
            }
          >
            Explore
          </button>

          <button
            type="button"
            onClick={() =>
              scrollToSection("about")
            }
          >
            About
          </button>
        </div>

        <button
          type="button"
          className="login-btn"
          onClick={openLogin}
        >
          Get Started
        </button>
      </nav>

      {/* HERO SECTION */}

      <main id="home" className="hero">

        <div className="hero-content">
          <p className="tag">
            ✈ PLAN • EXPLORE • EXPERIENCE
          </p>

          <h1>
            Discover the world.
            <br />

            <span>
              One journey at a time.
            </span>
          </h1>

          <p className="description">
            TravelBoost helps you discover
            amazing destinations, plan
            unforgettable trips, and make
            every journey easier.
          </p>

          <div className="hero-buttons">

            <button
              type="button"
              className="primary-btn"
              onClick={() =>
                scrollToSection(
                  "destinations"
                )
              }
            >
              Start Exploring →
            </button>

            <button
              type="button"
              className="secondary-btn"
              onClick={() =>
                scrollToSection("about")
              }
            >
              Learn More
            </button>

          </div>
        </div>

        {/* HERO VISUAL */}

        <div className="hero-card">

          <button
            type="button"
            className="floating-card card-one clickable"
            onClick={() =>
              scrollToSection(
                "destinations"
              )
            }
          >
            📍

            <span>
              Explore Places
            </span>
          </button>

          <div className="globe">
            🌍
          </div>

          <button
            type="button"
            className="floating-card card-two clickable"
            onClick={() =>
              scrollToSection("about")
            }
          >
            ✈

            <span>
              Plan Trips
            </span>
          </button>

        </div>
      </main>

      {/* POPULAR DESTINATIONS */}

      <section
        id="destinations"
        className="destinations"
      >
        <div className="section-heading">

          <p>
            EXPLORE INDIA
          </p>

          <h2>
            Popular Destinations
          </h2>

          <span>
            Discover places worth adding
            to your next adventure.
          </span>

        </div>

        <div className="destination-grid">

          {destinations.map(
            (destination) => (
              <button
                type="button"
                key={destination.id}
                className="destination-card"
                onClick={() =>
                  openDestination(
                    destination
                  )
                }
                style={{
                  backgroundImage: `linear-gradient(
                    to bottom,
                    rgba(7, 19, 33, 0.05) 20%,
                    rgba(7, 19, 33, 0.95) 100%
                  ), url("${destination.image}")`,
                }}
                aria-label={`Explore ${destination.name}`}
              >
                <div className="destination-overlay">

                  <div>
                    <h3>
                      {destination.name}
                    </h3>

                    <p>
                      {
                        destination.location
                      }
                    </p>
                  </div>

                  <span className="destination-btn">
                    →
                  </span>

                </div>
              </button>
            )
          )}

        </div>
      </section>

      {/* FEATURES SECTION */}

      <section
        id="about"
        className="features"
      >

        <button
          type="button"
          className="feature clickable"
          onClick={() =>
            scrollToSection(
              "destinations"
            )
          }
        >
          <div className="feature-icon">
            🗺️
          </div>

          <h3>
            Discover
          </h3>

          <p>
            Find amazing destinations and
            hidden gems.
          </p>
        </button>

        <button
          type="button"
          className="feature clickable"
          onClick={() =>
            alert(
              "Trip planning tools coming soon!"
            )
          }
        >
          <div className="feature-icon">
            📅
          </div>

          <h3>
            Plan
          </h3>

          <p>
            Create your perfect travel
            itinerary effortlessly.
          </p>
        </button>

        <button
          type="button"
          className="feature clickable"
          onClick={() =>
            scrollToSection(
              "destinations"
            )
          }
        >
          <div className="feature-icon">
            🚀
          </div>

          <h3>
            Experience
          </h3>

          <p>
            Make unforgettable memories
            wherever you go.
          </p>
        </button>

      </section>

      {/* FOOTER */}

      <footer className="footer">

        <div className="footer-logo">
          Travel<span>Boost</span>
        </div>

        <p>
          Discover more. Travel better.
          Create unforgettable memories.
        </p>

        <p className="footer-copy">
          © 2026 TravelBoost. Built for
          explorers.
        </p>

      </footer>

    </div>
  );
}

export default App;