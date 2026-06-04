// Manages LocalStorage data models for users, food logs, weight entries, and custom foods.

export class DietDatabase {
  static getUsers() {
    const usersJson = localStorage.getItem("nutri_users");
    return usersJson ? JSON.parse(usersJson) : [];
  }

  static saveUsers(users) {
    localStorage.setItem("nutri_users", JSON.stringify(users));
  }

  static getUserByEmail(email) {
    if (!email) return null;
    const users = this.getUsers();
    return users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  static getActiveUserId() {
    return localStorage.getItem("nutri_active_user_id");
  }

  static setActiveUserId(userId) {
    localStorage.setItem("nutri_active_user_id", userId);
  }

  static getActiveUser() {
    const activeId = this.getActiveUserId();
    if (!activeId) return null;
    const users = this.getUsers();
    return users.find(u => u.id === activeId) || null;
  }

  static createUser(profile) {
    // profile = { name, gender, age, height, weight, activityLevel, goal, calorieTarget, macroRatio, email }
    const users = this.getUsers();
    if (profile.email && this.getUserByEmail(profile.email)) {
      throw new Error("Email already registered!");
    }
    const newUser = {
      id: "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      createdAt: new Date().toISOString(),
      ...profile
    };
    
    // Auto-calculate calorie target if not explicitly custom set
    if (!newUser.calorieTarget) {
      newUser.calorieTarget = this.calculateTDEE(newUser);
    }
    
    // Default macro ratios if not set (Protein 30%, Carbs 40%, Fat 30%)
    if (!newUser.macroRatio) {
      newUser.macroRatio = { protein: 30, carbs: 40, fat: 30 };
    }

    users.push(newUser);
    this.saveUsers(users);
    this.setActiveUserId(newUser.id);
    
    // Log initial weight
    this.logWeight(newUser.id, newUser.weight, new Date().toISOString().split("T")[0]);

    return newUser;
  }

  static updateUser(userId, updatedData) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updatedData };
      // If weight, height, or activity details change, recalculate targets if they aren't marked custom
      if (updatedData.weight && !updatedData.isCustomCalorie) {
        users[idx].calorieTarget = this.calculateTDEE(users[idx]);
      }
      this.saveUsers(users);
      
      // If weight is updated, log it for history
      if (updatedData.weight) {
        this.logWeight(userId, updatedData.weight, new Date().toISOString().split("T")[0]);
      }
      return users[idx];
    }
    return null;
  }

  static deleteUser(userId) {
    let users = this.getUsers();
    users = users.filter(u => u.id !== userId);
    this.saveUsers(users);

    // Clean up associated logs
    localStorage.removeItem(`nutri_logs_${userId}`);
    localStorage.removeItem(`nutri_weight_${userId}`);
    localStorage.removeItem(`nutri_custom_foods_${userId}`);

    // Adjust active user if deleted active user
    if (this.getActiveUserId() === userId) {
      if (users.length > 0) {
        this.setActiveUserId(users[0].id);
      } else {
        localStorage.removeItem("nutri_active_user_id");
      }
    }
  }

  // Calculate BMR and TDEE using Mifflin-St Jeor Equation
  static calculateTDEE({ gender, weight, height, age, activityLevel, goal }) {
    // weight in kg, height in cm, age in years
    let bmr = 0;
    if (gender === "male") {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Activity Multiplier
    // sedentary (little/no exercise): 1.2
    // lightly_active (light exercise 1-3 days/wk): 1.375
    // moderately_active (moderate exercise 3-5 days/wk): 1.55
    // very_active (hard exercise 6-7 days/wk): 1.725
    let multiplier = 1.2;
    switch (activityLevel) {
      case "sedentary": multiplier = 1.2; break;
      case "lightly_active": multiplier = 1.375; break;
      case "moderately_active": multiplier = 1.55; break;
      case "very_active": multiplier = 1.725; break;
    }

    let tdee = Math.round(bmr * multiplier);

    // Goal adjustment
    // lose_weight: -500 kcal
    // maintain: 0 kcal
    // gain_weight: +400 kcal
    if (goal === "lose_weight") {
      tdee -= 500;
    } else if (goal === "gain_weight") {
      tdee += 400;
    }

    // Minimum safety limit
    return Math.max(tdee, 1200);
  }

  // --- Food Logging ---
  static getLogs(userId, dateStr) {
    // dateStr in YYYY-MM-DD
    const logs = this.getAllLogs(userId);
    return logs.filter(l => l.date === dateStr);
  }

  static getAllLogs(userId) {
    const logsJson = localStorage.getItem(`nutri_logs_${userId}`);
    return logsJson ? JSON.parse(logsJson) : [];
  }

  static saveAllLogs(userId, logs) {
    localStorage.setItem(`nutri_logs_${userId}`, JSON.stringify(logs));
  }

  static logFood(userId, logEntry) {
    // logEntry = { foodName, calories, protein, carbs, fat, quantity, servingUnit, loggedWeightGrams, interval, date }
    const logs = this.getAllLogs(userId);
    const newLog = {
      id: "log_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      timestamp: Date.now(),
      ...logEntry
    };
    logs.push(newLog);
    this.saveAllLogs(userId, logs);
    return newLog;
  }

  static removeLog(userId, logId) {
    let logs = this.getAllLogs(userId);
    logs = logs.filter(l => l.id !== logId);
    this.saveAllLogs(userId, logs);
  }

  // --- Weight History ---
  static getWeightHistory(userId) {
    const historyJson = localStorage.getItem(`nutri_weight_${userId}`);
    return historyJson ? JSON.parse(historyJson) : [];
  }

  static logWeight(userId, weight, dateStr) {
    const history = this.getWeightHistory(userId);
    const existingIdx = history.findIndex(w => w.date === dateStr);
    
    if (existingIdx !== -1) {
      history[existingIdx].weight = parseFloat(weight);
    } else {
      history.push({ date: dateStr, weight: parseFloat(weight) });
    }
    
    // Sort chronologically
    history.sort((a, b) => new Date(a.date) - new Date(b.date));
    localStorage.setItem(`nutri_weight_${userId}`, JSON.stringify(history));

    // Also sync standard weight in user profile if it's the latest date
    const users = this.getUsers();
    const userIdx = users.findIndex(u => u.id === userId);
    if (userIdx !== -1) {
      const latest = history[history.length - 1];
      if (latest.date === dateStr || new Date(latest.date) >= new Date(users[userIdx].lastWeightUpdate || 0)) {
        users[userIdx].weight = parseFloat(weight);
        users[userIdx].lastWeightUpdate = dateStr;
        
        // Recalculate daily calorie goal if not set custom
        if (!users[userIdx].isCustomCalorie) {
          users[userIdx].calorieTarget = this.calculateTDEE(users[userIdx]);
        }
        this.saveUsers(users);
      }
    }
  }

  // --- Custom User Foods Database ---
  static getCustomFoods(userId) {
    const customJson = localStorage.getItem(`nutri_custom_foods_${userId}`);
    return customJson ? JSON.parse(customJson) : [];
  }

  static addCustomFood(userId, foodItem) {
    // foodItem = { name, calories, protein, carbs, fat, defaultServingSize, servingUnit }
    const customFoods = this.getCustomFoods(userId);
    const newFood = {
      id: "custom_" + Date.now(),
      isCustom: true,
      ...foodItem
    };
    customFoods.push(newFood);
    localStorage.setItem(`nutri_custom_foods_${userId}`, JSON.stringify(customFoods));
    return newFood;
  }
  // --- Exercise Logs Database ---
  static getExercises(userId, dateStr) {
    const exercises = this.getAllExercises(userId);
    return exercises.filter(ex => ex.date === dateStr);
  }

  static getAllExercises(userId) {
    const exJson = localStorage.getItem(`nutri_exercises_${userId}`);
    return exJson ? JSON.parse(exJson) : [];
  }

  static saveAllExercises(userId, exercises) {
    localStorage.setItem(`nutri_exercises_${userId}`, JSON.stringify(exercises));
  }

  static logExercise(userId, exerciseEntry) {
    // exerciseEntry = { name, caloriesBurnt, duration, date }
    const exercises = this.getAllExercises(userId);
    const newEx = {
      id: "ex_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      timestamp: Date.now(),
      ...exerciseEntry
    };
    exercises.push(newEx);
    this.saveAllExercises(userId, exercises);
    return newEx;
  }

  static removeExercise(userId, exId) {
    let exercises = this.getAllExercises(userId);
    exercises = exercises.filter(ex => ex.id !== exId);
    this.saveAllExercises(userId, exercises);
  }

  // --- Streak Tracker ---
  static calculateStreak(userId) {
    const logsJson = localStorage.getItem(`nutri_logs_${userId}`);
    if (!logsJson) return 0;
    
    const logs = JSON.parse(logsJson);
    if (logs.length === 0) return 0;
    
    // Extract unique dates that have logs
    const logDates = [...new Set(logs.map(log => log.date))].sort((a, b) => new Date(b) - new Date(a));
    
    if (logDates.length === 0) return 0;

    const todayStr = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // If the latest log is older than yesterday, streak is broken
    if (logDates[0] !== todayStr && logDates[0] !== yesterdayStr) {
      return 0;
    }

    let streak = 1;
    let currentIdxDate = new Date(logDates[0]);

    for (let i = 1; i < logDates.length; i++) {
      const nextLogDate = new Date(logDates[i]);
      const diffTime = Math.abs(currentIdxDate - nextLogDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        streak++;
        currentIdxDate = nextLogDate;
      } else if (diffDays > 1) {
        break; // Streak broken
      }
    }

    return streak;
  }
}
