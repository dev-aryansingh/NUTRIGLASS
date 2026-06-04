// Main application controller. Hooks up all DOM events, routes tabs, 
// updates charts, and connects database models.

import { DietDatabase } from "./database.js";
import { FoodSearchApi } from "./api.js";

// Global Application State
const state = {
  activeUser: null,
  activeDate: new Date().toISOString().split("T")[0],
  currentView: "dashboard",
  activeSearchInterval: "Breakfast",
  selectedFoodItem: null,
  charts: {
    calories: null,
    macros: null,
    weight: null
  },
  searchDebounceTimer: null
};

// On Page Load
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initApp();
});

function initTheme() {
  const savedTheme = localStorage.getItem("nutri_theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
  
  const themeSwitch = document.getElementById("theme-toggle-switch");
  if (themeSwitch) {
    themeSwitch.checked = (savedTheme === "dark");
    themeSwitch.addEventListener("change", (e) => {
      const targetTheme = e.target.checked ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", targetTheme);
      localStorage.setItem("nutri_theme", targetTheme);
    });
  }
}

function initApp() {
  // Set Current Date in Header
  updateDateHeader();

  // Check user profile status
  state.activeUser = DietDatabase.getActiveUser();
  
  // Set up event listeners once on page load
  setupAppEventListeners();

  if (!state.activeUser) {
    showOnboarding();
  } else {
    refreshView();
  }
}

function updateDateHeader() {
  const options = { weekday: 'long', month: 'long', day: 'numeric' };
  const today = new Date();
  document.getElementById("current-date-lbl").textContent = today.toLocaleDateString('en-US', options).toUpperCase();
}

/* ==========================================================================
   Onboarding Flow
   ========================================================================== */
function showOnboarding() {
  const overlay = document.getElementById("onboarding-overlay");
  overlay.style.display = "flex";
  overlay.style.opacity = 1;

  // Segment toggle setup inside onboarding
  setupSegments("ob-gender-segment");
  setupSegments("ob-goal-segment");

  // Toggle between Sign Up and Login views in onboarding
  const typeSegment = document.getElementById("onboarding-type-segment");
  if (typeSegment) {
    const segmentItems = typeSegment.querySelectorAll(".segment-item");
    segmentItems.forEach(item => {
      item.onclick = () => {
        segmentItems.forEach(i => i.classList.remove("active"));
        item.classList.add("active");
        
        const type = item.getAttribute("data-val");
        document.getElementById("onboarding-register-view").style.display = (type === "register" ? "block" : "none");
        document.getElementById("onboarding-login-view").style.display = (type === "login" ? "block" : "none");
      };
    });
  }

  // Handle Registration Form Submit
  const form = document.getElementById("onboarding-form");
  form.onsubmit = (e) => {
    e.preventDefault();
    
    const email = document.getElementById("ob-email").value.trim();
    const name = document.getElementById("ob-name").value.trim();
    const age = parseInt(document.getElementById("ob-age").value);
    const height = parseInt(document.getElementById("ob-height").value);
    const weight = parseFloat(document.getElementById("ob-weight").value);
    const activityLevel = document.getElementById("ob-activity").value;
    
    const genderSegment = document.querySelector("#ob-gender-segment .segment-item.active");
    const gender = genderSegment ? genderSegment.getAttribute("data-val") : "male";
    
    const goalSegment = document.querySelector("#ob-goal-segment .segment-item.active");
    const goal = goalSegment ? goalSegment.getAttribute("data-val") : "maintain";

    try {
      // Create User (BMR/TDEE and default macros calculated automatically)
      state.activeUser = DietDatabase.createUser({
        email,
        name,
        gender,
        age,
        height,
        weight,
        activityLevel,
        goal
      });

      // Hide overlay and initialize application
      overlay.style.opacity = 0;
      setTimeout(() => {
        overlay.style.display = "none";
        refreshView();
        
        // Tiny confetti blast to celebrate starting
        triggerConfetti();
      }, 500);
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Login Form Submit
  const loginForm = document.getElementById("onboarding-login-form");
  loginForm.onsubmit = (e) => {
    e.preventDefault();
    
    const email = document.getElementById("login-email").value.trim();
    const user = DietDatabase.getUserByEmail(email);

    if (user) {
      DietDatabase.setActiveUserId(user.id);
      state.activeUser = user;
      
      overlay.style.opacity = 0;
      setTimeout(() => {
        overlay.style.display = "none";
        refreshView();
        triggerConfetti();
      }, 500);
    } else {
      alert("No profile found with this email. Please check your spelling or choose 'Create Profile' to sign up.");
    }
  };
}

function setupSegments(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const items = container.querySelectorAll(".segment-item");
  
  items.forEach(item => {
    item.onclick = () => {
      items.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
    };
  });
}

/* ==========================================================================
   Navigation and Routing
   ========================================================================== */
function setupAppEventListeners() {
  // 1. Navigation Tab Switches
  const tabs = document.querySelectorAll(".tabbar .tab-item");
  tabs.forEach(tab => {
    tab.onclick = () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      
      const targetView = tab.getAttribute("data-view");
      switchView(targetView);
    };
  });

  // 2. User Switcher Header click
  document.getElementById("header-user-badge").onclick = () => {
    openModal("user-switcher-modal");
    renderUserSwitcherList();
  };

  // 3. Inline Add Food Buttons
  document.getElementById("inline-add-food-btn").onclick = () => {
    switchView("search");
    // Update active tab in bottom bar
    document.querySelectorAll(".tabbar .tab-item").forEach(t => {
      t.classList.toggle("active", t.getAttribute("data-view") === "search");
    });
  };

  // Accordion Toggles for Meal intervals
  document.querySelectorAll(".meal-header").forEach(header => {
    header.onclick = () => {
      const card = header.closest(".meal-interval-card");
      card.classList.toggle("expanded");
    };
  });

  // 4. Search input event (debounced)
  const searchInput = document.getElementById("food-search-input");
  searchInput.addEventListener("input", (e) => {
    const val = e.target.value;
    document.getElementById("clear-search-btn").style.display = val.length > 0 ? "block" : "none";
    
    clearTimeout(state.searchDebounceTimer);
    state.searchDebounceTimer = setTimeout(() => {
      performFoodSearch(val);
    }, 300);
  });

  document.getElementById("clear-search-btn").onclick = () => {
    searchInput.value = "";
    document.getElementById("clear-search-btn").style.display = "none";
    performFoodSearch("");
  };

  // 5. Workout Tracker Log Button
  document.getElementById("inline-add-workout-btn").onclick = () => {
    openModal("exercise-modal");
    document.getElementById("ex-date").value = state.activeDate;
    document.getElementById("exercise-form").reset();
    document.getElementById("ex-custom-name-container").style.display = "none";
  };

  // Workout Type Select trigger to show custom name if custom selected
  const workoutSelect = document.getElementById("ex-name");
  workoutSelect.onchange = (e) => {
    const customContainer = document.getElementById("ex-custom-name-container");
    customContainer.style.display = e.target.value === "Custom Activity" ? "block" : "none";
  };

  // Exercise Form submit
  document.getElementById("exercise-form").onsubmit = (e) => {
    e.preventDefault();
    saveExerciseLog();
  };

  // Presets Quick Add event listeners
  document.querySelectorAll("#presets-container .preset-btn").forEach(btn => {
    btn.onclick = () => {
      const combo = btn.getAttribute("data-combo");
      logPresetCombo(combo);
    };
  });

  // Voice Search / Logging button webkitSpeechRecognition
  const voiceBtn = document.getElementById("voice-search-btn");
  voiceBtn.onclick = () => {
    toggleVoiceLogging();
  };

  // 6. Set Targets form and toggle logic
  document.getElementById("set-target-calories-btn").onclick = () => {
    openModal("targets-modal");
    populateTargetsForm();
  };
  
  const calorieToggle = document.getElementById("custom-calorie-toggle");
  const calorieValInput = document.getElementById("target-calories-val-input");
  calorieToggle.addEventListener("change", (e) => {
    calorieValInput.disabled = !e.target.checked;
    if (!e.target.checked && state.activeUser) {
      // Show default calculated calorie target
      calorieValInput.value = DietDatabase.calculateTDEE(state.activeUser);
    }
  });

  document.getElementById("targets-form").onsubmit = (e) => {
    e.preventDefault();
    saveTargets();
  };

  // 7. Profile Edit Modal bindings
  document.getElementById("edit-profile-btn").onclick = () => {
    openModal("profile-edit-modal");
    populateProfileEditForm();
  };
  document.getElementById("profile-edit-form").onsubmit = (e) => {
    e.preventDefault();
    saveProfileEdits();
  };

  // 8. Weight Logger Bindings
  document.getElementById("add-weight-shortcut-btn").onclick = () => {
    openModal("weight-modal");
    const dateInput = document.getElementById("wl-date");
    dateInput.value = state.activeDate;
    document.getElementById("wl-weight").value = state.activeUser ? state.activeUser.weight : "";
  };
  document.getElementById("weight-log-form").onsubmit = (e) => {
    e.preventDefault();
    saveWeightLog();
  };

  // 9. Custom Food Add button triggers
  document.getElementById("trigger-custom-food-btn").onclick = () => {
    openModal("custom-food-modal");
  };
  
  document.getElementById("custom-food-form").onsubmit = (e) => {
    e.preventDefault();
    saveCustomFood();
  };

  // 10. Custom Foods Manager triggers
  document.getElementById("manage-custom-foods-btn").onclick = () => {
    openModal("custom-foods-manager-modal");
    renderCustomFoodsManagerList();
  };
  document.getElementById("manager-create-custom-btn").onclick = () => {
    closeModal("custom-foods-manager-modal");
    openModal("custom-food-modal");
  };

  // 11. Profile creation trigger inside switcher
  document.getElementById("trigger-create-user-btn").onclick = () => {
    closeModal("user-switcher-modal");
    showOnboarding();
  };

  // Switch User Profile Button click
  const switchBtn = document.getElementById("switch-user-btn");
  if (switchBtn) {
    switchBtn.onclick = () => {
      openModal("user-switcher-modal");
      renderUserSwitcherList();
    };
  }

  // Log Out button click
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      if (confirm("Are you sure you want to log out of your profile?")) {
        localStorage.removeItem("nutri_active_user_id");
        state.activeUser = null;
        
        // Reset dashboard widgets
        document.getElementById("summary-cals-left").textContent = "0";
        document.getElementById("stats-target-cals").textContent = "0";
        document.getElementById("stats-eaten-cals").textContent = "0";
        document.getElementById("stats-remaining-cals").textContent = "0";
        
        showOnboarding();
      }
    };
  }

  // 12. Modal overlay closing triggers
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeModal(overlay.id);
      }
    });
  });

  document.getElementById("close-log-details-btn").onclick = () => closeModal("log-details-modal");
  document.getElementById("close-custom-food-btn").onclick = () => closeModal("custom-food-modal");
  document.getElementById("close-user-switcher-btn").onclick = () => closeModal("user-switcher-modal");
  document.getElementById("close-targets-btn").onclick = () => closeModal("targets-modal");
  document.getElementById("close-profile-edit-btn").onclick = () => closeModal("profile-edit-modal");
  document.getElementById("close-weight-btn").onclick = () => closeModal("weight-modal");
  document.getElementById("close-custom-manager-btn").onclick = () => closeModal("custom-foods-manager-modal");
  document.getElementById("close-exercise-btn").onclick = () => closeModal("exercise-modal");

  // 13. System Database Reset handler
  document.getElementById("reset-database-btn").onclick = () => {
    if (confirm("🚨 WARNING: Are you sure you want to delete ALL users, food logs, and databases? This action is permanent!")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // 14. Add food log submit
  document.getElementById("add-to-log-submit-btn").onclick = () => submitFoodLog();

  // Log Modal quantity recalculation binding
  const ldQuantity = document.getElementById("ld-quantity");
  const ldUnit = document.getElementById("ld-unit");
  const recalculateFn = () => {
    if (state.selectedFoodItem) {
      updateLogDetailsNutrientPreview(state.selectedFoodItem, parseFloat(ldQuantity.value) || 0, ldUnit.value);
    }
  };
  ldQuantity.addEventListener("input", recalculateFn);
  ldUnit.addEventListener("change", recalculateFn);
}

function switchView(viewName) {
  state.currentView = viewName;
  
  // Toggle view-panels
  document.querySelectorAll(".view-panel").forEach(panel => {
    panel.classList.toggle("active", panel.id === `${viewName}-view`);
  });

  // Set title
  const viewTitle = document.getElementById("view-title");
  if (viewName === "dashboard") viewTitle.textContent = "Dashboard";
  else if (viewName === "search") viewTitle.textContent = "Log Food";
  else if (viewName === "analytics") viewTitle.textContent = "Trends";
  else if (viewName === "settings") viewTitle.textContent = "Settings";

  // Refresh target view content
  refreshView();
}

function refreshView() {
  if (!state.activeUser) return;
  
  // Header details updates
  document.getElementById("header-user-name").textContent = state.activeUser.name;
  document.getElementById("header-user-avatar").textContent = state.activeUser.name.charAt(0).toUpperCase();

  if (state.currentView === "dashboard") {
    renderDashboard();
  } else if (state.currentView === "search") {
    // Fill search suggestions initially
    const searchInput = document.getElementById("food-search-input");
    performFoodSearch(searchInput.value);
  } else if (state.currentView === "analytics") {
    renderAnalyticsCharts();
  } else if (state.currentView === "settings") {
    renderSettingsView();
  }
}

/* ==========================================================================
   Modals Engine
   ========================================================================== */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.add("active");
  // Active animation feedback for iOS sheets
  document.querySelector(".app-container").style.filter = "blur(4px) brightness(0.9)";
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.remove("active");
  document.querySelector(".app-container").style.filter = "none";
}

/* ==========================================================================
   Dashboard Renderer (Meals & Progress rings)
   ========================================================================== */
function renderDashboard() {
  const userId = state.activeUser.id;
  const dateStr = state.activeDate;

  // Render Streak Badge
  const streak = DietDatabase.calculateStreak(userId);
  document.getElementById("streak-count").textContent = streak;

  // 1. Gather all logged items for today
  const breakfastLogs = DietDatabase.getLogs(userId, dateStr).filter(l => l.interval === "Breakfast");
  const lunchLogs = DietDatabase.getLogs(userId, dateStr).filter(l => l.interval === "Lunch");
  const dinnerLogs = DietDatabase.getLogs(userId, dateStr).filter(l => l.interval === "Dinner");
  const snacksLogs = DietDatabase.getLogs(userId, dateStr).filter(l => l.interval === "Snacks");

  // Sum calories per interval
  const sumCals = (logs) => logs.reduce((sum, item) => sum + item.calories, 0);
  const bfCals = sumCals(breakfastLogs);
  const lnCals = sumCals(lunchLogs);
  const dnCals = sumCals(dinnerLogs);
  const snCals = sumCals(snacksLogs);

  // Update interval calorie labels
  document.getElementById("cals-breakfast").textContent = `${bfCals} kcal`;
  document.getElementById("cals-lunch").textContent = `${lnCals} kcal`;
  document.getElementById("cals-dinner").textContent = `${dnCals} kcal`;
  document.getElementById("cals-snacks").textContent = `${snCals} kcal`;

  // 2. Populate lists in accordions
  populateMealAccordionList("list-breakfast", breakfastLogs, "Breakfast");
  populateMealAccordionList("list-lunch", lunchLogs, "Lunch");
  populateMealAccordionList("list-dinner", dinnerLogs, "Dinner");
  populateMealAccordionList("list-snacks", snacksLogs, "Snacks");

  // 3. Compute Active Exercises Burnt Calories
  const exercises = DietDatabase.getExercises(userId, dateStr);
  const activeBurntCals = exercises.reduce((sum, ex) => sum + ex.caloriesBurnt, 0);
  document.getElementById("exercise-summary-cals").textContent = `${activeBurntCals} kcal active`;
  populateExerciseList(exercises, userId);

  // 4. Compute Macro & Calorie Targets vs Eaten (Adjusted by active workouts)
  const totalEatenCals = bfCals + lnCals + dnCals + snCals;
  const baseTargetCals = state.activeUser.calorieTarget;
  const adjustedTargetCals = baseTargetCals + activeBurntCals;
  const remainingCals = Math.max(adjustedTargetCals - totalEatenCals, 0);

  // Animate Calorie Circle
  const progressRing = document.getElementById("calorie-progress-ring");
  const pct = Math.min(totalEatenCals / adjustedTargetCals, 1.0);
  const ringOffset = 377 - (377 * pct); // circumference is 2 * PI * 60 (approx 377)
  progressRing.style.strokeDashoffset = ringOffset;
  
  // Set progress gradient stroke property based on status percentage
  if (pct >= 1.0) {
    progressRing.setAttribute("stroke", "url(#calGradientComplete)");
  } else if (pct > 0.85) {
    progressRing.setAttribute("stroke", "url(#calGradientOver)");
  } else {
    progressRing.setAttribute("stroke", "url(#calGradient)");
  }

  // Set numerical readouts
  document.getElementById("summary-cals-left").textContent = remainingCals;
  document.getElementById("stats-target-cals").textContent = baseTargetCals;
  document.getElementById("stats-eaten-cals").textContent = totalEatenCals;
  document.getElementById("stats-remaining-cals").textContent = remainingCals;

  // Celeberate with confetti if they hit exactly target range (98% - 102%)
  const hasCelebratedKey = `celebrated_${userId}_${dateStr}`;
  if (pct >= 0.98 && !localStorage.getItem(hasCelebratedKey)) {
    triggerConfetti();
    localStorage.setItem(hasCelebratedKey, "true");
  }

  // 5. Summarize and render Macros
  const allLogs = DietDatabase.getLogs(userId, dateStr);
  const totalProtein = Math.round(allLogs.reduce((sum, item) => sum + item.protein, 0));
  const totalCarbs = Math.round(allLogs.reduce((sum, item) => sum + item.carbs, 0));
  const totalFat = Math.round(allLogs.reduce((sum, item) => sum + item.fat, 0));

  // Targets grams based on user goal split settings (macro splits calculated on adjusted target)
  const ratio = state.activeUser.macroRatio; // e.g. { protein: 30, carbs: 40, fat: 30 }
  const targetProteinGrams = Math.round((adjustedTargetCals * (ratio.protein / 100)) / 4);
  const targetCarbsGrams = Math.round((adjustedTargetCals * (ratio.carbs / 100)) / 4);
  const targetFatGrams = Math.round((adjustedTargetCals * (ratio.fat / 100)) / 9);

  // Update macro text targets
  document.getElementById("summary-protein-val").textContent = `${totalProtein}g / ${targetProteinGrams}g`;
  document.getElementById("summary-carbs-val").textContent = `${totalCarbs}g / ${targetCarbsGrams}g`;
  document.getElementById("summary-fat-val").textContent = `${totalFat}g / ${targetFatGrams}g`;

  // Update progress bars widths
  document.getElementById("protein-progress-bar").style.width = `${Math.min((totalProtein / targetProteinGrams) * 100, 100)}%`;
  document.getElementById("carbs-progress-bar").style.width = `${Math.min((totalCarbs / targetCarbsGrams) * 100, 100)}%`;
  document.getElementById("fat-progress-bar").style.width = `${Math.min((totalFat / targetFatGrams) * 100, 100)}%`;

  // 6. Render dashboard mini calorie trend chart
  renderDashboardWeeklyChart(userId);
}

function populateMealAccordionList(listId, logs, interval) {
  const container = document.getElementById(listId);
  container.innerHTML = "";

  if (logs.length === 0) {
    container.innerHTML = `<li class="empty-meal-state">No foods logged for ${interval}. Tap '+' to log.</li>`;
    return;
  }

  logs.forEach(log => {
    const li = document.createElement("li");
    li.className = "logged-food-item";
    
    // Calculate standard display description
    let servingDesc = `${log.quantity} ${log.servingUnit}`;
    if (log.loggedWeightGrams && log.servingUnit !== "grams") {
      servingDesc += ` (${log.loggedWeightGrams}g)`;
    }

    li.innerHTML = `
      <div class="logged-food-info">
        <span class="logged-food-name">${log.foodName}</span>
        <span class="logged-food-desc">${servingDesc}</span>
        <div class="logged-food-macros">
          <span class="macro-mini p">P: ${Math.round(log.protein)}g</span>
          <span class="macro-mini c">C: ${Math.round(log.carbs)}g</span>
          <span class="macro-mini f">F: ${Math.round(log.fat)}g</span>
        </div>
      </div>
      <div class="logged-food-right">
        <span class="logged-food-cals">${log.calories} kcal</span>
        <button class="delete-log-btn" data-logid="${log.id}">✕</button>
      </div>
    `;

    // Hook up individual log item delete button
    li.querySelector(".delete-log-btn").onclick = (e) => {
      e.stopPropagation();
      if (confirm(`Remove "${log.foodName}" from today's log?`)) {
        DietDatabase.removeLog(state.activeUser.id, log.id);
        renderDashboard();
      }
    };

    container.appendChild(li);
  });
}

function renderDashboardWeeklyChart(userId) {
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push(d.toISOString().split("T")[0]);
  }

  const calorieData = last7Days.map(dateStr => {
    const logs = DietDatabase.getLogs(userId, dateStr);
    return logs.reduce((sum, item) => sum + item.calories, 0);
  });

  const chartLabels = last7Days.map(dateStr => {
    const parts = dateStr.split("-");
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString("en-US", { weekday: "short" });
  });

  const ctx = document.getElementById("dashboard-weekly-chart").getContext("2d");
  
  // Destroy previous instance to prevent visual glitching
  if (state.charts.dashboardWeekly) {
    state.charts.dashboardWeekly.destroy();
  }

  const chartGradient = ctx.createLinearGradient(0, 0, 0, 100);
  chartGradient.addColorStop(0, "rgba(10, 132, 255, 0.45)");
  chartGradient.addColorStop(1, "rgba(10, 132, 255, 0.0)");

  state.charts.dashboardWeekly = new Chart(ctx, {
    type: "line",
    data: {
      labels: chartLabels,
      datasets: [{
        label: "Calories",
        data: calorieData,
        borderColor: "#0a84ff",
        backgroundColor: chartGradient,
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointBackgroundColor: "#0a84ff",
        pointRadius: 2,
        pointHoverRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true }
      },
      scales: {
        y: {
          display: false,
          grid: { display: false }
        },
        x: {
          grid: { display: false },
          ticks: { color: "#e4e4e7", font: { family: "Plus Jakarta Sans", size: 10 } }
        }
      }
    }
  });
}

/* ==========================================================================
   Food Search Module
   ========================================================================== */
async function performFoodSearch(query) {
  const listContainer = document.getElementById("search-results-list");
  const statusMsg = document.getElementById("search-status-message");
  
  // If empty query, show standard curated suggest lists (top 15 local items)
  if (!query || query.trim().length === 0) {
    statusMsg.style.display = "none";
    const localSuggestions = await FoodSearchApi.search("roti", state.activeUser.id);
    const commonSuggestions = await FoodSearchApi.search("apple", state.activeUser.id);
    // Combine standard favorites
    const suggestions = [...localSuggestions.slice(0, 5), ...commonSuggestions.slice(0, 5)];
    renderSearchResults(suggestions);
    return;
  }

  statusMsg.style.display = "block";
  statusMsg.textContent = "Querying databases...";

  const results = await FoodSearchApi.search(query, state.activeUser.id);
  
  statusMsg.style.display = "none";
  renderSearchResults(results);
}

function renderSearchResults(results) {
  const container = document.getElementById("search-results-list");
  container.innerHTML = "";

  if (results.length === 0) {
    container.innerHTML = `<li class="text-center" style="padding: 30px; font-size:14px; color:var(--text-secondary);">No food matches found. Try creating a Custom Food item below!</li>`;
    return;
  }

  results.forEach(food => {
    const li = document.createElement("li");
    li.className = "search-result-item";
    
    // Create standard badge text color layout
    const sourceClass = food.source; // 'local', 'custom', 'online'
    const portionDesc = `${food.defaultServingSize}${food.servingUnit === 'grams' ? 'g' : ' ' + food.servingUnit}`;

    li.innerHTML = `
      <div class="result-main">
        <div class="result-name-row">
          <span class="result-name">${food.name}</span>
          <span class="badge-source ${sourceClass}">${sourceClass}</span>
        </div>
        <div class="result-details">
          <span>Portion: ${portionDesc}</span>
          <span>P: ${food.protein}g | C: ${food.carbs}g | F: ${food.fat}g</span>
        </div>
      </div>
      <div class="result-right">
        <span class="result-calories">${Math.round(food.calories * food.defaultServingSize / 100)} kcal</span>
        <span class="result-arrow">▶</span>
      </div>
    `;

    li.onclick = () => {
      triggerLogFoodDetailsModal(food);
    };

    container.appendChild(li);
  });
}

function triggerLogFoodDetailsModal(food) {
  state.selectedFoodItem = food;
  
  // Set details inside modal overlay
  document.getElementById("ld-title").textContent = `Log ${food.name}`;
  
  // Reset input inputs
  document.getElementById("ld-quantity").value = 1;
  document.getElementById("ld-date").value = state.activeDate;
  
  // Configure Select dropdown units
  const unitSelect = document.getElementById("ld-unit");
  unitSelect.innerHTML = "";
  
  // If custom unit exists, offer it
  if (food.servingUnit && food.servingUnit !== "grams") {
    unitSelect.innerHTML = `
      <option value="serving" selected>${food.servingUnit} (${food.defaultServingSize}g)</option>
      <option value="grams">grams (g)</option>
    `;
  } else {
    unitSelect.innerHTML = `<option value="grams" selected>grams (g)</option>`;
  }

  // Pre-select current interval based on current time of day
  const intervalSelect = document.getElementById("ld-interval");
  const currentHour = new Date().getHours();
  let defaultInterval = "Breakfast";
  if (currentHour >= 11 && currentHour < 16) defaultInterval = "Lunch";
  else if (currentHour >= 16 && currentHour < 19) defaultInterval = "Snacks";
  else if (currentHour >= 19) defaultInterval = "Dinner";
  intervalSelect.value = defaultInterval;

  // Initialize preview numbers
  updateLogDetailsNutrientPreview(food, 1, unitSelect.value);
  
  openModal("log-details-modal");
}

function updateLogDetailsNutrientPreview(food, quantity, unitType) {
  let multiplier = 1.0;
  
  if (unitType === "serving") {
    // standard servings logic: nutrients per portion
    multiplier = (quantity * food.defaultServingSize) / 100;
  } else {
    // grams entry logic: nutrients per gram input
    multiplier = quantity / 100;
  }

  const calVal = Math.round(food.calories * multiplier);
  const proteinVal = Math.round(food.protein * multiplier * 10) / 10;
  const carbsVal = Math.round(food.carbs * multiplier * 10) / 10;
  const fatVal = Math.round(food.fat * multiplier * 10) / 10;

  document.getElementById("ld-nutr-cals").textContent = calVal;
  document.getElementById("ld-nutr-protein").textContent = `${proteinVal}g`;
  document.getElementById("ld-nutr-carbs").textContent = `${carbsVal}g`;
  document.getElementById("ld-nutr-fat").textContent = `${fatVal}g`;
}

function submitFoodLog() {
  if (!state.selectedFoodItem || !state.activeUser) return;

  const quantity = parseFloat(document.getElementById("ld-quantity").value) || 0;
  const unit = document.getElementById("ld-unit").value;
  const interval = document.getElementById("ld-interval").value;
  const logDate = document.getElementById("ld-date").value;

  if (quantity <= 0) {
    alert("Please enter a valid quantity greater than zero.");
    return;
  }

  const food = state.selectedFoodItem;
  let loggedWeightGrams = 0;
  let multiplier = 1.0;

  if (unit === "serving") {
    loggedWeightGrams = Math.round(quantity * food.defaultServingSize);
    multiplier = loggedWeightGrams / 100;
  } else {
    loggedWeightGrams = Math.round(quantity);
    multiplier = loggedWeightGrams / 100;
  }

  // Create clean log structure
  const logEntry = {
    foodName: food.name,
    calories: Math.round(food.calories * multiplier),
    protein: Math.round(food.protein * multiplier * 10) / 10,
    carbs: Math.round(food.carbs * multiplier * 10) / 10,
    fat: Math.round(food.fat * multiplier * 10) / 10,
    quantity: quantity,
    servingUnit: unit === "serving" ? food.servingUnit : "grams",
    loggedWeightGrams: loggedWeightGrams,
    interval: interval,
    date: logDate
  };

  DietDatabase.logFood(state.activeUser.id, logEntry);

  closeModal("log-details-modal");
  
  // Reset search box and go to Dashboard
  document.getElementById("food-search-input").value = "";
  document.getElementById("clear-search-btn").style.display = "none";
  
  // Set date to the logged date so they can see it added immediately!
  state.activeDate = logDate;
  
  switchView("dashboard");
  // Set dashboard active in nav bar
  document.querySelectorAll(".tabbar .tab-item").forEach(t => {
    t.classList.toggle("active", t.getAttribute("data-view") === "dashboard");
  });
}

function saveCustomFood() {
  if (!state.activeUser) return;

  const name = document.getElementById("cf-name").value;
  const calories = parseInt(document.getElementById("cf-cals").value);
  const protein = parseFloat(document.getElementById("cf-protein").value);
  const carbs = parseFloat(document.getElementById("cf-carbs").value);
  const fat = parseFloat(document.getElementById("cf-fat").value);
  const servingSize = parseInt(document.getElementById("cf-serving-size").value);
  const servingUnit = document.getElementById("cf-serving-unit").value;

  const newFood = {
    name,
    calories,
    protein,
    carbs,
    fat,
    defaultServingSize: servingSize,
    servingUnit
  };

  DietDatabase.addCustomFood(state.activeUser.id, newFood);

  // Close and reset form
  closeModal("custom-food-modal");
  document.getElementById("custom-food-form").reset();
  
  // Alert and refresh active search
  alert(`"${name}" has been saved to your custom food database!`);
  performFoodSearch(document.getElementById("food-search-input").value);
}

/* ==========================================================================
   Trends & Analytics Charts Generator
   ========================================================================== */
function renderAnalyticsCharts() {
  const userId = state.activeUser.id;
  
  // 1. Chart 1: Calories Past 7 Days
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push(d.toISOString().split("T")[0]);
  }

  const calorieData = last7Days.map(dateStr => {
    const logs = DietDatabase.getLogs(userId, dateStr);
    return logs.reduce((sum, item) => sum + item.calories, 0);
  });

  const chartLabels = last7Days.map(dateStr => {
    const parts = dateStr.split("-");
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString("en-US", { weekday: "short" });
  });

  const ctxCals = document.getElementById("calories-history-chart").getContext("2d");
  if (state.charts.calories) state.charts.calories.destroy();
  
  state.charts.calories = new Chart(ctxCals, {
    type: "bar",
    data: {
      labels: chartLabels,
      datasets: [{
        label: "Calories Consumed",
        data: calorieData,
        backgroundColor: "rgba(0, 122, 255, 0.4)",
        borderColor: "#007aff",
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          grid: { color: "rgba(255, 255, 255, 0.08)" },
          ticks: { color: "#e4e4e7", font: { family: "Plus Jakarta Sans" } }
        },
        x: {
          grid: { display: false },
          ticks: { color: "#e4e4e7", font: { family: "Plus Jakarta Sans" } }
        }
      }
    }
  });

  // 2. Chart 2: Today's Macro Distribution Doughnut
  const todayLogs = DietDatabase.getLogs(userId, state.activeDate);
  const pSum = todayLogs.reduce((sum, item) => sum + item.protein, 0);
  const cSum = todayLogs.reduce((sum, item) => sum + item.carbs, 0);
  const fSum = todayLogs.reduce((sum, item) => sum + item.fat, 0);

  const ctxMacros = document.getElementById("macro-distribution-chart").getContext("2d");
  if (state.charts.macros) state.charts.macros.destroy();

  if (pSum === 0 && cSum === 0 && fSum === 0) {
    // Empty dataset indicator
    state.charts.macros = new Chart(ctxMacros, {
      type: "doughnut",
      data: {
        labels: ["No Logs Eaten"],
        datasets: [{
          data: [1],
          backgroundColor: ["rgba(150, 150, 150, 0.15)"],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "75%",
        plugins: {
          legend: { display: true, position: "bottom", labels: { color: "#e4e4e7", font: { family: "Plus Jakarta Sans" } } }
        }
      }
    });
  } else {
    state.charts.macros = new Chart(ctxMacros, {
      type: "doughnut",
      data: {
        labels: [`Protein (${Math.round(pSum)}g)`, `Carbs (${Math.round(cSum)}g)`, `Fats (${Math.round(fSum)}g)`],
        datasets: [{
          data: [pSum, cSum, fSum],
          backgroundColor: [
            "rgba(255, 45, 85, 0.65)", // pink
            "rgba(90, 200, 250, 0.65)", // teal
            "rgba(255, 149, 0, 0.65)"  // orange
          ],
          borderColor: [
            "#ff2d55",
            "#5ac8fa",
            "#ff9500"
          ],
          borderWidth: 1.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",
        plugins: {
          legend: { display: true, position: "right", labels: { color: "#e4e4e7", font: { family: "Plus Jakarta Sans", weight: 600 } } }
        }
      }
    });
  }

  // 3. Chart 3: Weight Tracker progression
  const weightHistory = DietDatabase.getWeightHistory(userId);
  const wtLabels = weightHistory.map(w => {
    const parts = w.date.split("-");
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });
  const wtValues = weightHistory.map(w => w.weight);

  const ctxWeight = document.getElementById("weight-history-chart").getContext("2d");
  if (state.charts.weight) state.charts.weight.destroy();

  state.charts.weight = new Chart(ctxWeight, {
    type: "line",
    data: {
      labels: wtLabels,
      datasets: [{
        label: "Weight (kg)",
        data: wtValues,
        borderColor: "#af52de", // purple
        backgroundColor: "rgba(175, 82, 222, 0.1)",
        fill: true,
        tension: 0.35,
        borderWidth: 3,
        pointBackgroundColor: "#af52de",
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          grid: { color: "rgba(255, 255, 255, 0.08)" },
          ticks: { color: "#e4e4e7", font: { family: "Plus Jakarta Sans" } }
        },
        x: {
          grid: { display: false },
          ticks: { color: "#e4e4e7", font: { family: "Plus Jakarta Sans" } }
        }
      }
    }
  });
}

function saveWeightLog() {
  if (!state.activeUser) return;
  const weight = parseFloat(document.getElementById("wl-weight").value);
  const dateStr = document.getElementById("wl-date").value;

  if (weight <= 0) {
    alert("Please enter a valid weight.");
    return;
  }

  DietDatabase.logWeight(state.activeUser.id, weight, dateStr);
  closeModal("weight-modal");
  
  // Reload settings & analytics if on those views
  state.activeUser = DietDatabase.getActiveUser(); // re-sync weight changes
  refreshView();
  alert(`Weight logged: ${weight} kg for ${dateStr}`);
}

/* ==========================================================================
   Settings Views
   ========================================================================== */
function renderSettingsView() {
  const user = state.activeUser;
  document.getElementById("settings-profile-name").textContent = user.name;
  document.getElementById("settings-profile-email").textContent = user.email || "No Email Associated";
  
  const avatarEl = document.getElementById("settings-user-avatar");
  if (avatarEl) {
    avatarEl.textContent = user.name.charAt(0).toUpperCase();
  }
  
  // Clean readable goal text
  let goalText = "Maintain Weight";
  if (user.goal === "lose_weight") goalText = "Lose Weight";
  else if (user.goal === "gain_weight") goalText = "Gain Weight";

  document.getElementById("settings-profile-meta").textContent = 
    `Goal: ${goalText} | Weight: ${user.weight}kg | Height: ${user.height}cm`;

  document.getElementById("settings-target-cals-val").textContent = `${user.calorieTarget} kcal`;
}

function populateTargetsForm() {
  const user = state.activeUser;
  if (!user) return;

  const calorieToggle = document.getElementById("custom-calorie-toggle");
  const calorieValInput = document.getElementById("target-calories-val-input");

  calorieToggle.checked = !!user.isCustomCalorie;
  calorieValInput.disabled = !user.isCustomCalorie;
  calorieValInput.value = user.calorieTarget;

  // Macro splits
  document.getElementById("target-pct-protein").value = user.macroRatio?.protein || 30;
  document.getElementById("target-pct-carbs").value = user.macroRatio?.carbs || 40;
  document.getElementById("target-pct-fat").value = user.macroRatio?.fat || 30;
}

function saveTargets() {
  if (!state.activeUser) return;

  const isCustomCal = document.getElementById("custom-calorie-toggle").checked;
  const calorieTarget = parseInt(document.getElementById("target-calories-val-input").value);
  const p = parseInt(document.getElementById("target-pct-protein").value);
  const c = parseInt(document.getElementById("target-pct-carbs").value);
  const f = parseInt(document.getElementById("target-pct-fat").value);

  // Validate percentages add up to 100
  if (p + c + f !== 100) {
    document.getElementById("target-macro-error").style.display = "block";
    return;
  }
  document.getElementById("target-macro-error").style.display = "none";

  const updatedData = {
    isCustomCalorie: isCustomCal,
    macroRatio: { protein: p, carbs: c, fat: f }
  };

  if (isCustomCal) {
    updatedData.calorieTarget = calorieTarget;
  } else {
    // If auto-calculated, calculate based on profile BMR/TDEE
    updatedData.calorieTarget = DietDatabase.calculateTDEE(state.activeUser);
  }

  state.activeUser = DietDatabase.updateUser(state.activeUser.id, updatedData);
  closeModal("targets-modal");
  refreshView();
  alert("Targets updated successfully!");
}

function populateProfileEditForm() {
  const user = state.activeUser;
  if (!user) return;

  document.getElementById("pe-name").value = user.name;
  document.getElementById("pe-age").value = user.age;
  document.getElementById("pe-height").value = user.height;
  document.getElementById("pe-activity").value = user.activityLevel;
  document.getElementById("pe-goal").value = user.goal;
}

function saveProfileEdits() {
  if (!state.activeUser) return;

  const name = document.getElementById("pe-name").value;
  const age = parseInt(document.getElementById("pe-age").value);
  const height = parseInt(document.getElementById("pe-height").value);
  const activityLevel = document.getElementById("pe-activity").value;
  const goal = document.getElementById("pe-goal").value;

  const updatedUser = DietDatabase.updateUser(state.activeUser.id, {
    name,
    age,
    height,
    activityLevel,
    goal
  });

  state.activeUser = updatedUser;
  closeModal("profile-edit-modal");
  refreshView();
  alert("Profile settings saved!");
}

/* ==========================================================================
   User Profile Switcher List
   ========================================================================== */
function renderUserSwitcherList() {
  const container = document.getElementById("profiles-list-container");
  container.innerHTML = "";

  const users = DietDatabase.getUsers();
  const activeId = DietDatabase.getActiveUserId();

  users.forEach(user => {
    const div = document.createElement("div");
    div.className = `profile-select-item ${user.id === activeId ? 'active' : ''}`;
    
    let goalText = "Maintenance";
    if (user.goal === "lose_weight") goalText = "Weight Loss";
    else if (user.goal === "gain_weight") goalText = "Weight Gain";

    div.innerHTML = `
      <div>
        <div class="profile-item-name">${user.name}</div>
        <div class="profile-item-meta">${user.weight}kg | Goal: ${goalText}</div>
      </div>
      ${user.id === activeId ? '<span>Active ✔</span>' : `<button class="btn-secondary" style="padding: 4px 10px; font-size:12px;" data-userid="${user.id}">Select</button>`}
    `;

    // Hook click to swap user
    const selectBtn = div.querySelector("button");
    if (selectBtn) {
      selectBtn.onclick = (e) => {
        e.stopPropagation();
        const userId = selectBtn.getAttribute("data-userid");
        DietDatabase.setActiveUserId(userId);
        state.activeUser = DietDatabase.getActiveUser();
        closeModal("user-switcher-modal");
        
        // Return to Dashboard and refresh
        switchView("dashboard");
        // Reset nav bar tabs selection
        document.querySelectorAll(".tabbar .tab-item").forEach(t => {
          t.classList.toggle("active", t.getAttribute("data-view") === "dashboard");
        });
      };
    }

    container.appendChild(div);
  });
}

/* ==========================================================================
   Custom Foods Manager List
   ========================================================================== */
function renderCustomFoodsManagerList() {
  const container = document.getElementById("custom-foods-manager-list");
  container.innerHTML = "";

  const customFoods = DietDatabase.getCustomFoods(state.activeUser.id);

  if (customFoods.length === 0) {
    container.innerHTML = `<li class="empty-meal-state" style="padding:20px;">No custom foods created yet. Tap the button above to add one.</li>`;
    return;
  }

  customFoods.forEach(food => {
    const li = document.createElement("li");
    li.className = "logged-food-item";
    
    li.innerHTML = `
      <div class="logged-food-info">
        <span class="logged-food-name">${food.name}</span>
        <span class="logged-food-desc">Portion: ${food.defaultServingSize}${food.servingUnit} | Cals: ${food.calories}kcal/100g</span>
        <div class="logged-food-macros">
          <span class="macro-mini p">P: ${food.protein}g</span>
          <span class="macro-mini c">C: ${food.carbs}g</span>
          <span class="macro-mini f">F: ${food.fat}g</span>
        </div>
      </div>
      <div class="logged-food-right">
        <button class="delete-log-btn" style="opacity:1;" data-foodid="${food.id}">✕</button>
      </div>
    `;

    li.querySelector(".delete-log-btn").onclick = () => {
      if (confirm(`Delete custom food "${food.name}"? This cannot be undone.`)) {
        deleteCustomFood(food.id);
      }
    };

    container.appendChild(li);
  });
}

function deleteCustomFood(foodId) {
  const userId = state.activeUser.id;
  let custom = DietDatabase.getCustomFoods(userId);
  custom = custom.filter(f => f.id !== foodId);
  localStorage.setItem(`nutri_custom_foods_${userId}`, JSON.stringify(custom));
  renderCustomFoodsManagerList();
}

/* ==========================================================================
   Confetti Engine
   ========================================================================== */
function triggerConfetti() {
  if (window.confetti) {
    window.confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
}

/* ==========================================================================
   Workout Log Helper Functions
   ========================================================================== */
function saveExerciseLog() {
  if (!state.activeUser) return;
  const userId = state.activeUser.id;
  
  const typeSelect = document.getElementById("ex-name").value;
  const customName = document.getElementById("ex-custom-name").value;
  const duration = parseInt(document.getElementById("ex-duration").value) || 0;
  const calories = parseInt(document.getElementById("ex-calories").value) || 0;
  const dateStr = document.getElementById("ex-date").value;

  const workoutName = typeSelect === "Custom Activity" ? (customName || "Custom Workout") : typeSelect;

  DietDatabase.logExercise(userId, {
    name: workoutName,
    duration: duration,
    caloriesBurnt: calories,
    date: dateStr
  });

  closeModal("exercise-modal");
  renderDashboard();
  alert(`Workout logged: Burnt ${calories} kcal doing ${workoutName}!`);
}

function populateExerciseList(exercises, userId) {
  const container = document.getElementById("dashboard-exercise-list");
  container.innerHTML = "";

  if (exercises.length === 0) {
    container.innerHTML = `<li class="empty-meal-state" style="padding:12px;">No workouts logged today.</li>`;
    return;
  }

  exercises.forEach(ex => {
    const li = document.createElement("li");
    li.className = "logged-food-item";
    li.innerHTML = `
      <div class="logged-food-info">
        <span class="logged-food-name">${ex.name}</span>
        <span class="logged-food-desc">Duration: ${ex.duration} mins</span>
      </div>
      <div class="logged-food-right">
        <span class="logged-food-cals" style="color: var(--ios-green); font-weight:800;">-${ex.caloriesBurnt} kcal</span>
        <button class="delete-log-btn" data-exid="${ex.id}">✕</button>
      </div>
    `;

    li.querySelector(".delete-log-btn").onclick = (e) => {
      e.stopPropagation();
      if (confirm(`Remove workout "${ex.name}"?`)) {
        DietDatabase.removeExercise(userId, ex.id);
        renderDashboard();
      }
    };

    container.appendChild(li);
  });
}

/* ==========================================================================
   Preset Combo Helper Functions
   ========================================================================== */
function logPresetCombo(combo) {
  if (!state.activeUser) return;
  const userId = state.activeUser.id;
  const dateStr = state.activeDate;

  // Determine meal interval based on current time
  const currentHour = new Date().getHours();
  let defaultInterval = "Breakfast";
  if (currentHour >= 11 && currentHour < 16) defaultInterval = "Lunch";
  else if (currentHour >= 16 && currentHour < 19) defaultInterval = "Snacks";
  else if (currentHour >= 19) defaultInterval = "Dinner";

  let itemsToLog = [];
  let alertMsg = "";

  if (combo === "north-indian") {
    // 2 Roti + Dal Tadka + Paneer Butter Masala
    itemsToLog = [
      { name: "Roti (Whole Wheat Chapati)", qty: 2, unit: "roti", weight: 60, cals: 158, protein: 5.4, carbs: 33.6, fat: 0.6 },
      { name: "Yellow Dal Tadka", qty: 1, unit: "bowl", weight: 150, cals: 135, protein: 7.5, carbs: 21, fat: 2.3 },
      { name: "Paneer Butter Masala", qty: 1, unit: "bowl", weight: 150, cals: 297, protein: 11.3, carbs: 12, fat: 23.3 }
    ];
    alertMsg = "Logged North Indian Combo to today's list!";
  } else if (combo === "south-indian") {
    // 2 Idli + Sambar + Coconut Chutney
    itemsToLog = [
      { name: "Idli (Rice & Lentil Cake)", qty: 2, unit: "idli", weight: 90, cals: 101, protein: 2.9, carbs: 21.2, fat: 0.5 },
      { name: "Sambar", qty: 1, unit: "bowl", weight: 120, cals: 78, protein: 3, carbs: 12, fat: 1.8 },
      { name: "Coconut Chutney", qty: 2, unit: "tablespoon", weight: 60, cals: 132, protein: 1.8, carbs: 5.1, fat: 12 }
    ];
    alertMsg = "Logged South Indian Combo to today's list!";
  } else if (combo === "gym-diet") {
    // Whey Protein + Banana + 2 Eggs
    itemsToLog = [
      { name: "Whey Protein Powder", qty: 1, unit: "scoop", weight: 30, cals: 117, protein: 24, carbs: 1.8, fat: 1.5 },
      { name: "Banana", qty: 1, unit: "banana", weight: 120, cals: 107, protein: 1.3, carbs: 27.4, fat: 0.4 },
      { name: "Boiled Egg", qty: 2, unit: "egg", weight: 100, cals: 155, protein: 12.6, carbs: 1.1, fat: 10.6 }
    ];
    alertMsg = "Logged Gym Fuel Combo to today's list!";
  }

  itemsToLog.forEach(item => {
    DietDatabase.logFood(userId, {
      foodName: item.name,
      calories: item.cals,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      quantity: item.qty,
      servingUnit: item.unit,
      loggedWeightGrams: item.weight,
      interval: defaultInterval,
      date: dateStr
    });
  });

  renderDashboard();
  triggerConfetti();
  alert(alertMsg);
}

/* ==========================================================================
   Voice Recognition & Natural Language Parsing
   ========================================================================== */
let recognition = null;

function toggleVoiceLogging() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Voice recognition is not supported in this browser. Please type to search.");
    return;
  }

  const voiceBtn = document.getElementById("voice-search-btn");

  if (recognition) {
    recognition.stop();
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "en-IN"; // Optimize for Indian English accents
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    voiceBtn.classList.add("recording");
    voiceBtn.textContent = "🛑";
  };

  recognition.onend = () => {
    voiceBtn.classList.remove("recording");
    voiceBtn.textContent = "🎙️";
    recognition = null;
  };

  recognition.onerror = (e) => {
    console.error("Speech recognition error:", e);
    voiceBtn.classList.remove("recording");
    voiceBtn.textContent = "🎙️";
    recognition = null;
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    document.getElementById("food-search-input").value = transcript;
    
    // Auto redirect to search log view
    if (state.currentView !== "search") {
      switchView("search");
      document.querySelectorAll(".tabbar .tab-item").forEach(t => {
        t.classList.toggle("active", t.getAttribute("data-view") === "search");
      });
    }

    performFoodSearch(transcript);
    parseVoiceTranscript(transcript);
  };

  recognition.start();
}

function parseVoiceTranscript(text) {
  const lower = text.toLowerCase();
  
  // Extract quantity values if present
  let qty = 1;
  const numMatches = lower.match(/(\d+(?:\.\d+)?)/);
  if (numMatches && numMatches[1]) {
    qty = parseFloat(numMatches[1]);
  } else {
    if (lower.includes("one")) qty = 1;
    else if (lower.includes("two")) qty = 2;
    else if (lower.includes("three")) qty = 3;
    else if (lower.includes("four")) qty = 4;
    else if (lower.includes("five")) qty = 5;
  }

  // Pre-seed dictionary matchers
  const commonIndianFoods = [
    { keywords: ["roti", "chapati", "phulka"], match: "Roti (Whole Wheat Chapati)" },
    { keywords: ["rice", "chawal"], match: "Basmati Rice (Cooked)" },
    { keywords: ["dal", "tadka", "makhani"], match: "Yellow Dal Tadka" },
    { keywords: ["paneer"], match: "Paneer Butter Masala" },
    { keywords: ["biryani"], match: "Chicken Biryani" },
    { keywords: ["dosa"], match: "Masala Dosa" },
    { keywords: ["idli"], match: "Idli (Rice & Lentil Cake)" },
    { keywords: ["egg", "eggs"], match: "Boiled Egg" },
    { keywords: ["samosa"], match: "Samosa" },
    { keywords: ["tea", "chai"], match: "Masala Chai (with milk & sugar)" },
    { keywords: ["apple"], match: "Apple" },
    { keywords: ["banana"], match: "Banana" }
  ];

  let matchedFoodName = "";
  for (const item of commonIndianFoods) {
    if (item.keywords.some(keyword => lower.includes(keyword))) {
      matchedFoodName = item.match;
      break;
    }
  }

  if (matchedFoodName) {
    // Dynamically retrieve portion metrics and trigger Modal logging
    import("./foodData.js").then(module => {
      const db = module.foodDatabase;
      const foodObj = db.find(f => f.name === matchedFoodName);
      if (foodObj) {
        setTimeout(() => {
          triggerLogFoodDetailsModal(foodObj);
          document.getElementById("ld-quantity").value = qty;
          
          // Match interval text tags
          const intervalSelect = document.getElementById("ld-interval");
          if (lower.includes("breakfast")) intervalSelect.value = "Breakfast";
          else if (lower.includes("lunch")) intervalSelect.value = "Lunch";
          else if (lower.includes("dinner")) intervalSelect.value = "Dinner";
          else if (lower.includes("snack") || lower.includes("coffee") || lower.includes("tea")) intervalSelect.value = "Snacks";
          
          const unitSelect = document.getElementById("ld-unit");
          updateLogDetailsNutrientPreview(foodObj, qty, unitSelect.value);
        }, 600);
      }
    });
  }
}

export default state;
