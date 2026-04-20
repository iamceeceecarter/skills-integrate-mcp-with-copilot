document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const loginForm = document.getElementById("login-form");
  const logoutBtn = document.getElementById("logout-btn");
  const authStatus = document.getElementById("auth-status");
  const authMessageDiv = document.getElementById("auth-message");
  const currentUsername = document.getElementById("current-username");
  const currentRole = document.getElementById("current-role");
  const currentEmail = document.getElementById("current-email");
  const emailInput = document.getElementById("email");

  let authToken = localStorage.getItem("authToken") || "";
  let currentUser = null;

  function setAuthMessage(text, type) {
    authMessageDiv.textContent = text;
    authMessageDiv.className = type;
    authMessageDiv.classList.remove("hidden");
  }

  function setActionMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");
  }

  function configureSignupFormForUser() {
    const signupButton = signupForm.querySelector('button[type="submit"]');

    if (!currentUser) {
      signupButton.disabled = true;
      emailInput.readOnly = false;
      emailInput.value = "";
      emailInput.placeholder = "Log in first to sign up";
      return;
    }

    signupButton.disabled = false;
    if (currentUser.role === "student") {
      emailInput.value = currentUser.email;
      emailInput.readOnly = true;
    } else {
      emailInput.readOnly = false;
      emailInput.placeholder = "student-email@mergington.edu";
    }
  }

  function updateAuthUI() {
    if (currentUser) {
      loginForm.classList.add("hidden");
      authStatus.classList.remove("hidden");
      currentUsername.textContent = currentUser.username;
      currentRole.textContent = currentUser.role;
      currentEmail.textContent = currentUser.email;
    } else {
      loginForm.classList.remove("hidden");
      authStatus.classList.add("hidden");
    }

    configureSignupFormForUser();
  }

  async function loadCurrentUser() {
    if (!authToken) {
      currentUser = null;
      updateAuthUI();
      return;
    }

    try {
      const response = await fetch("/auth/me", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        localStorage.removeItem("authToken");
        authToken = "";
        currentUser = null;
      } else {
        currentUser = await response.json();
      }
    } catch (error) {
      currentUser = null;
      console.error("Error loading current user:", error);
    }

    updateAuthUI();
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span>${
                        currentUser &&
                        (currentUser.role === "admin" ||
                          currentUser.role === "advisor" ||
                          currentUser.email === email)
                          ? `<button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button>`
                          : ""
                      }</li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    if (!authToken) {
      setActionMessage("Please log in before unregistering participants.", "error");
      return;
    }

    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        setActionMessage(result.message, "success");

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        setActionMessage(result.detail || "An error occurred", "error");
      }

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      setActionMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json();

      if (!response.ok) {
        setAuthMessage(result.detail || "Login failed", "error");
        return;
      }

      authToken = result.token;
      localStorage.setItem("authToken", authToken);
      currentUser = {
        username: result.username,
        role: result.role,
        email: result.email,
      };
      updateAuthUI();
      fetchActivities();
      loginForm.reset();
      setAuthMessage(`Logged in as ${result.username}`, "success");
    } catch (error) {
      setAuthMessage("Unable to log in right now.", "error");
      console.error("Error logging in:", error);
    }
  });

  logoutBtn.addEventListener("click", async () => {
    try {
      if (authToken) {
        await fetch("/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
      }
    } catch (error) {
      console.error("Error logging out:", error);
    }

    authToken = "";
    currentUser = null;
    localStorage.removeItem("authToken");
    updateAuthUI();
    fetchActivities();
    setAuthMessage("Logged out", "info");
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      if (!authToken) {
        setActionMessage("Please log in before signing up for activities.", "error");
        return;
      }

      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        setActionMessage(result.message, "success");
        signupForm.reset();
        configureSignupFormForUser();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        setActionMessage(result.detail || "An error occurred", "error");
      }

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      setActionMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  loadCurrentUser();
  fetchActivities();
});
