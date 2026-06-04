document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const loginForm = document.getElementById("login-form");
  const loginMessage = document.getElementById("login-message");
  const authStatus = document.getElementById("auth-status");
  const logoutButton = document.getElementById("logout-button");
  const currentUser = document.getElementById("current-user");
  const currentRole = document.getElementById("current-role");
  const signupHelp = document.getElementById("signup-help");
  const dashboardContainer = document.getElementById("dashboard-container");
  const dashboardMessage = document.getElementById("dashboard-message");
  const dashboardDetails = document.getElementById("dashboard-details");

  let authToken = null;
  let signedInUser = null;

  function updateAuthUI() {
    const isLoggedIn = Boolean(authToken && signedInUser);
    authStatus.classList.toggle("hidden", !isLoggedIn);
    dashboardContainer.classList.toggle("hidden", !isLoggedIn);
    signupHelp.textContent = isLoggedIn
      ? "You are logged in. Use the form below to sign up for activities." 
      : "You must log in before signing up.";

    if (isLoggedIn) {
      currentUser.textContent = signedInUser.email;
      currentRole.textContent = signedInUser.role;
    } else {
      currentUser.textContent = "";
      currentRole.textContent = "";
    }
  }

  function showMessage(element, text, type) {
    element.textContent = text;
    element.className = `message ${type}`;
    element.classList.remove("hidden");
    setTimeout(() => {
      element.classList.add("hidden");
    }, 5000);
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      activitiesList.innerHTML = "";
      activitySelect.innerHTML = "<option value=\"\">-- Select an activity --</option>";

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
                <h5>Participants:</h5>
                <ul class="participants-list">
                  ${details.participants
                    .map(
                      (email) =>
                        `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
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

        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  async function fetchDashboard() {
    if (!authToken) {
      clearDashboard();
      return;
    }

    try {
      const response = await fetch("/dashboard", {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Failed to load dashboard");
      }

      dashboardMessage.textContent = result.message;
      dashboardDetails.innerHTML = Object.entries(result.activity_summary)
        .map(
          ([name, summary]) =>
            `<div class="activity-card"><h4>${name}</h4><p><strong>Participants</strong>: ${summary.participants}</p><p><strong>Spots left</strong>: ${summary.spots_left}</p></div>`
        )
        .join("");
    } catch (error) {
      clearDashboard();
      console.error("Error fetching dashboard:", error);
    }
  }

  function clearDashboard() {
    dashboardMessage.textContent = "";
    dashboardDetails.innerHTML = "";
  }

  async function handleUnregister(event) {
    if (!authToken) {
      showMessage(messageDiv, "Please log in to unregister a student.", "error");
      return;
    }

    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(messageDiv, result.message, "success");
        await fetchActivities();
        await fetchDashboard();
      } else {
        showMessage(messageDiv, result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage(messageDiv, "Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!authToken) {
      showMessage(messageDiv, "Please log in before signing up.", "error");
      return;
    }

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(messageDiv, result.message, "success");
        signupForm.reset();
        await fetchActivities();
        await fetchDashboard();
      } else {
        showMessage(messageDiv, result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage(messageDiv, "Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {
      const response = await fetch(
        `/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
        { method: "POST" }
      );
      const result = await response.json();

      if (response.ok) {
        authToken = result.token;
        signedInUser = result.user;
        updateAuthUI();
        await fetchActivities();
        await fetchDashboard();
        showMessage(loginMessage, "Login successful.", "success");
        loginForm.reset();
      } else {
        showMessage(loginMessage, result.detail || "Login failed.", "error");
      }
    } catch (error) {
      showMessage(loginMessage, "Failed to log in. Please try again.", "error");
      console.error("Error logging in:", error);
    }
  });

  logoutButton.addEventListener("click", () => {
    authToken = null;
    signedInUser = null;
    clearDashboard();
    updateAuthUI();
    showMessage(loginMessage, "You have logged out.", "info");
  });

  updateAuthUI();
  fetchActivities();
});
