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
    setShowLogin(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const closeLogin = () => {
    setShowLogin(false);
    setShowUserLogin(false);

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
              onClick={() =>
                alert(
                  "Local Login coming next!"
                )
              }
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
              onClick={() =>
                alert(
                  "Authority Login coming next!"
                )
              }
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