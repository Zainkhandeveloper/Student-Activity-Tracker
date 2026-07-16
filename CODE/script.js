/**
 * ===========================================================
 * Student Task Manager — script.js
 * -----------------------------------------------------------
 * All logic lives inside a single IIFE so nothing leaks into
 * the global scope. The file is organized into small modules:
 *
 *   Storage   - reading/writing localStorage
 *   Utils     - small pure helper functions
 *   State     - the in-memory source of truth
 *   Render    - turns state into DOM
 *   Actions   - functions that mutate state (add/edit/delete/...)
 *   Events    - wires DOM events to Actions
 *   Clock     - the live date/time display
 *   Init      - bootstraps the app on page load
 * ===========================================================
 */
(function () {
  "use strict";

  /* =========================================================
     DOM REFERENCES
     Collected once, at the top, so we never re-query the DOM
     for the same element twice.
  ========================================================= */
  const dom = {
    form: document.getElementById("taskForm"),
    taskInput: document.getElementById("taskInput"),
    priorityInput: document.getElementById("priorityInput"),
    dueDateInput: document.getElementById("dueDateInput"),
    taskList: document.getElementById("taskList"),
    taskItemTemplate: document.getElementById("taskItemTemplate"),

    searchInput: document.getElementById("searchInput"),
    filterButtons: Array.from(document.querySelectorAll(".filter-btn")),

    sortButtons: Array.from(document.querySelectorAll(".sort-btn")),

    message: document.getElementById("message"),
    overdueNotice: document.getElementById("overdueNotice"),

    totalTasks: document.getElementById("totalTasks"),
    completedTasks: document.getElementById("completedTasks"),
    pendingTasks: document.getElementById("pendingTasks"),
    progressRingCircle: document.getElementById("progressRingCircle"),
    progressPercentage: document.getElementById("progressPercentage"),

    clearAllBtn: document.getElementById("clearAllBtn"),

    themeToggleBtn: document.getElementById("themeToggleBtn"),
    themeToggleIcon: document.getElementById("themeToggleIcon"),
    themeToggleLabel: document.getElementById("themeToggleLabel"),

    currentDate: document.getElementById("currentDate"),
    currentTime: document.getElementById("currentTime"),
  };

  const STORAGE_KEY = "studentTasks";
  const PROGRESS_RING_CIRCUMFERENCE = 339.3; // 2 * PI * r(54), matches the SVG in index.html

  /* =========================================================
     STORAGE
     Wraps localStorage so the rest of the app never touches
     it directly (makes it trivial to swap for another backend
     later, and keeps error handling in one place).
  ========================================================= */
  const Storage = {
    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];

        // Normalize saved tasks to the latest schema.
        return (Array.isArray(parsed) ? parsed : []).map((task) => {
          const normalized = {
            id: String(task.id),
            text: typeof task.text === "string" ? task.text : "",
            completed: Boolean(task.completed),
            // New fields (added later):
            priority:
              task.priority === "low" ||
              task.priority === "medium" ||
              task.priority === "high"
                ? task.priority
                : "medium",
            dueDate:
              typeof task.dueDate === "string" && task.dueDate.trim() !== ""
                ? task.dueDate
                : null,
          };
          return normalized;
        });
      } catch (error) {
        console.error("Could not read saved tasks:", error);
        return [];
      }
    },

    save(tasks) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      } catch (error) {
        console.error("Could not save tasks:", error);
      }
    },
  };

  /* =========================================================
     UTILS
  ========================================================= */
  const Utils = {
    /** Escapes HTML-sensitive characters so task text can never
     *  be interpreted as markup (prevents stored XSS). */
    escapeHtml(text) {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    },

    /** Delays calling `fn` until `wait` ms have passed without
     *  it being called again — avoids re-rendering on every
     *  single keystroke while searching. */
    debounce(fn, wait) {
      let timeoutId;
      return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), wait);
      };
    },

    /** Generates an id that is unique even if two tasks are
     *  created within the same millisecond. */
    generateId() {
      return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    },
  };

  /* =========================================================
     STATE
     The single source of truth for the app. Nothing outside
     this module should mutate `tasks` directly.
  ========================================================= */
  const State = {
    tasks: [],
    filter: "all", // "all" | "pending" | "completed"
    searchText: "",
    sortBy: "dueDate", // "dueDate" | "text" | "priority"
    editingTaskId: null,

    setTasks(tasks) {
      this.tasks = tasks;
      Storage.save(this.tasks);
    },
  };

  /* =========================================================
     RENDER
     Pure(ish) functions that read State and update the DOM.
     Splitting render into small functions keeps each DOM
     write targeted instead of re-drawing everything.
  ========================================================= */
  const Render = {
    getVisibleTasks() {
      const query = State.searchText.toLowerCase();

      // Sorting is applied after filter/search.
      const priorityRank = { low: 1, medium: 2, high: 3 };

      const filtered = State.tasks.filter((task) => {
        const matchesSearch =
          typeof task.text === "string" &&
          task.text.toLowerCase().includes(query);
        const matchesFilter =
          State.filter === "all" ||
          (State.filter === "completed" && task.completed) ||
          (State.filter === "pending" && !task.completed);

        return matchesSearch && matchesFilter;
      });

      // Sort is applied after filter/search.
      const sorted = [...filtered].sort((a, b) => {
        if (State.sortBy === "text") {
          return a.text.localeCompare(b.text, undefined, {
            sensitivity: "base",
          });
        }

        if (State.sortBy === "priority") {
          const prA = priorityRank[a.priority] ?? 2;
          const prB = priorityRank[b.priority] ?? 2;
          // Desc so High comes first.
          if (prA !== prB) return prB - prA;
          return a.text.localeCompare(b.text, undefined, {
            sensitivity: "base",
          });
        }

        // Default: dueDate (date) sort.
        const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        // Asc so earliest due comes first.
        if (aTime !== bTime) return aTime - bTime;
        // Tie-breaker: priority desc then alpha.
        const prA = priorityRank[a.priority] ?? 2;
        const prB = priorityRank[b.priority] ?? 2;
        if (prA !== prB) return prB - prA;
        return a.text.localeCompare(b.text, undefined, { sensitivity: "base" });
      });

      return sorted;
    },

    taskList() {
      const visibleTasks = this.getVisibleTasks();
      dom.taskList.innerHTML = "";

      if (visibleTasks.length === 0) {
        dom.taskList.innerHTML = `
          <li class="empty-state">
            <span class="empty-state__icon" aria-hidden="true">📝</span>
            <strong>No tasks found</strong>
            ${
              State.tasks.length === 0
                ? "Add your first task above to get started."
                : "Try a different search or filter."
            }
          </li>`;

        return;
      }

      const fragment = document.createDocumentFragment();
      visibleTasks.forEach((task) => {
        fragment.appendChild(this.buildTaskElement(task));
      });
      dom.taskList.appendChild(fragment);
    },

    /** Builds a single <li> from the <template> in index.html. */
    buildTaskElement(task) {
      const node =
        dom.taskItemTemplate.content.firstElementChild.cloneNode(true);
      const isEditing = State.editingTaskId === task.id;

      node.dataset.id = task.id;
      node.classList.toggle("is-completed", task.completed);
      node.classList.toggle("is-editing", isEditing);

      const checkbox = node.querySelector(".task-checkbox");
      checkbox.checked = task.completed;
      checkbox.id = `task-check-${task.id}`;

      const checkboxLabel = node.querySelector(".task-checkbox-label");
      checkboxLabel.setAttribute("for", checkbox.id);
      checkboxLabel.textContent = `Mark "${task.text}" as ${task.completed ? "not completed" : "completed"}`;

      const textEl = node.querySelector(".task-text");
      textEl.textContent = task.text;
      textEl.classList.toggle("hidden", isEditing);

      // --- New: priority + due date + overdue indicators ---
      const priorityBadge = node.querySelector(".task-priority-badge");
      const dueDateEl = node.querySelector(".task-due-date");
      const overdueBadge = node.querySelector(".task-overdue-badge");

      const priority = task.priority || "medium";
      priorityBadge.textContent = `Priority: ${priority[0].toUpperCase() + priority.slice(1)}`;
      priorityBadge.dataset.priority = priority;

      const dueDateObj = task.dueDate ? new Date(task.dueDate) : null;
      const dueDateText = dueDateObj
        ? dueDateObj.toLocaleDateString()
        : "No due date";
      dueDateEl.textContent = dueDateText;

      // Overdue if: pending + has due date earlier than today (local date).
      const todayStart = new Date(new Date().toDateString()).getTime();
      const isOverdue =
        !task.completed && dueDateObj && dueDateObj.getTime() < todayStart;

      node.classList.toggle("is-overdue", Boolean(isOverdue));
      overdueBadge.classList.toggle("hidden", !isOverdue);

      const editInput = node.querySelector(".task-edit-input");
      editInput.value = task.text;
      editInput.classList.toggle("hidden", !isEditing);

      const displayActions = node.querySelector('[data-view="display"]');
      const editActions = node.querySelector('[data-view="edit"]');
      displayActions.classList.toggle("hidden", isEditing);
      editActions.classList.toggle("hidden", !isEditing);

      node
        .querySelector(".edit-btn")
        .setAttribute("aria-label", `Edit task: ${task.text}`);
      node
        .querySelector(".delete-btn")
        .setAttribute("aria-label", `Delete task: ${task.text}`);

      // Hidden meta nodes (useful for accessibility/future editing).
      node.querySelector(".meta-priority").textContent = priority;
      node.querySelector(".meta-dueDate").textContent = task.dueDate
        ? String(task.dueDate)
        : "";

      if (isEditing) {
        // Autofocus the field as soon as it lands in the DOM.
        requestAnimationFrame(() => {
          editInput.focus();
          editInput.select();
        });
      }

      return node;
    },

    statistics() {
      const total = State.tasks.length;
      const completed = State.tasks.filter((task) => task.completed).length;
      const pending = total - completed;
      const percentage =
        total === 0 ? 0 : Math.round((completed / total) * 100);

      dom.totalTasks.textContent = total;
      dom.completedTasks.textContent = completed;
      dom.pendingTasks.textContent = pending;

      dom.progressPercentage.textContent = percentage;
      const offset = PROGRESS_RING_CIRCUMFERENCE * (1 - percentage / 100);
      dom.progressRingCircle.style.strokeDashoffset = offset;
    },

    all() {
      this.taskList();
      this.statistics();
    },
  };

  /* =========================================================
     MESSAGES
  ========================================================= */
  let messageTimeoutId;
  function showMessage(text, tone = "error") {
    clearTimeout(messageTimeoutId);
    dom.message.textContent = text;
    dom.message.dataset.tone = tone;

    messageTimeoutId = setTimeout(() => {
      dom.message.textContent = "";
      delete dom.message.dataset.tone;
    }, 2500);
  }

  /* =========================================================
     Overdue notifications
  ========================================================= */
  function getTodayStartMs() {
    return new Date(new Date().toDateString()).getTime();
  }

  function computeOverdueCount() {
    const todayStart = getTodayStartMs();
    return State.tasks.filter((task) => {
      if (task.completed) return false;
      if (!task.dueDate) return false;
      const dueMs = new Date(task.dueDate).getTime();
      if (Number.isNaN(dueMs)) return false;
      return dueMs < todayStart;
    }).length;
  }

  function notifyOverdue() {
    // Only notify when there is at least one overdue task.
    const overdueCount = computeOverdueCount();
    if (overdueCount <= 0) {
      if (dom.overdueNotice) dom.overdueNotice.textContent = "";
      return;
    }

    if (dom.overdueNotice) {
      dom.overdueNotice.textContent =
        overdueCount === 1
          ? "1 task is overdue."
          : `${overdueCount} tasks are overdue.`;
    }
  }

  /* =========================================================
     ACTIONS
     Every function here follows the same shape:
     validate -> mutate State -> persist -> re-render -> notify.
  ========================================================= */
  const Actions = {
    addTask(rawText) {
      const text = rawText.trim();
      const priority = dom.priorityInput ? dom.priorityInput.value : "medium";
      const dueDateValue = dom.dueDateInput ? dom.dueDateInput.value : "";
      const dueDate = dueDateValue
        ? new Date(dueDateValue).toISOString().slice(0, 10)
        : null;

      if (text === "") {
        showMessage("Task cannot be empty.");
        return;
      }

      if (dom.priorityInput && !["low", "medium", "high"].includes(priority)) {
        showMessage("Invalid task priority.");
        return;
      }

      const isDuplicate = State.tasks.some(
        (task) => task.text.toLowerCase() === text.toLowerCase(),
      );
      if (isDuplicate) {
        showMessage("That task already exists.");
        return;
      }

      const newTask = {
        id: Utils.generateId(),
        text,
        completed: false,
        priority,
        dueDate,
      };
      State.setTasks([...State.tasks, newTask]);

      Render.all();
      dom.taskInput.value = "";
      if (dom.dueDateInput) dom.dueDateInput.value = "";
      if (dom.priorityInput) dom.priorityInput.value = "medium";
      dom.taskInput.focus();
      showMessage("Task added.", "success");
    },

    toggleComplete(taskId) {
      const updated = State.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              completed: !task.completed,
            }
          : task,
      );
      State.setTasks(updated);
      Render.all();
    },

    startEditing(taskId) {
      State.editingTaskId = taskId;
      Render.taskList();
    },

    cancelEditing() {
      State.editingTaskId = null;
      Render.taskList();
    },

    saveEdit(taskId, rawText) {
      const newText = rawText.trim();

      if (newText === "") {
        showMessage("Task cannot be empty.");
        return;
      }

      const isDuplicate = State.tasks.some(
        (task) =>
          task.id !== taskId &&
          task.text.toLowerCase() === newText.toLowerCase(),
      );
      if (isDuplicate) {
        showMessage("That task already exists.");
        return;
      }

      const updated = State.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              text: newText,
            }
          : task,
      );

      State.setTasks(updated);
      State.editingTaskId = null;

      Render.all();
      showMessage("Task updated.", "success");
    },

    deleteTask(taskId) {
      const task = State.tasks.find((t) => t.id === taskId);
      if (!task) return;

      const confirmed = window.confirm(`Delete "${task.text}"?`);
      if (!confirmed) return;

      State.setTasks(State.tasks.filter((t) => t.id !== taskId));
      Render.all();
      showMessage("Task deleted.", "success");
    },

    clearAll() {
      if (State.tasks.length === 0) {
        showMessage("There are no tasks to clear.");
        return;
      }

      const confirmed = window.confirm(
        "Delete ALL tasks? This cannot be undone.",
      );
      if (!confirmed) return;

      State.setTasks([]);
      Render.all();
      showMessage("All tasks cleared.", "success");
    },

    setFilter(filter) {
      State.filter = filter;

      dom.filterButtons.forEach((button) => {
        const isActive = button.dataset.filter === filter;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });

      Render.all();
    },

    setSort(sortBy) {
      State.sortBy = sortBy;

      dom.sortButtons.forEach((button) => {
        const isActive = button.dataset.sort === sortBy;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });

      Render.all();
    },

    setSearchText(text) {
      State.searchText = text.trim();
      Render.taskList();
    },
  };

  /* =========================================================
     CLOCK
  ========================================================= */
  const Clock = {
    start() {
      this.tick();
      setInterval(() => this.tick(), 1000);
    },

    tick() {
      const now = new Date();

      dom.currentDate.textContent = now.toLocaleDateString("en-PK", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      dom.currentTime.textContent = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      // Keep overdue notifications in sync with the day boundary.
      notifyOverdue();
    },
  };

  /* =========================================================
     EVENTS
     A single delegated listener handles every task row instead
     of attaching listeners per-item — this keeps re-renders
     cheap no matter how many tasks exist.
  ========================================================= */
  function bindEvents() {
    dom.form.addEventListener("submit", (event) => {
      event.preventDefault();
      Actions.addTask(dom.taskInput.value);
    });

    // Sort buttons (date / A-Z / priority)
    dom.sortButtons.forEach((button) => {
      button.addEventListener("click", () =>
        Actions.setSort(button.dataset.sort),
      );
    });

    dom.searchInput.addEventListener(
      "input",
      Utils.debounce((event) => Actions.setSearchText(event.target.value), 150),
    );

    dom.filterButtons.forEach((button) => {
      button.addEventListener("click", () =>
        Actions.setFilter(button.dataset.filter),
      );
    });

    dom.clearAllBtn.addEventListener("click", () => Actions.clearAll());

    // Delegated handlers for dynamically-rendered task rows.
    dom.taskList.addEventListener("click", (event) => {
      const item = event.target.closest(".task-item");
      if (!item) return;
      const taskId = item.dataset.id;

      if (event.target.closest(".edit-btn")) {
        Actions.startEditing(taskId);
      } else if (event.target.closest(".delete-btn")) {
        Actions.deleteTask(taskId);
      } else if (event.target.closest(".save-btn")) {
        const input = item.querySelector(".task-edit-input");
        Actions.saveEdit(taskId, input.value);
      } else if (event.target.closest(".cancel-btn")) {
        Actions.cancelEditing();
      }
    });

    dom.taskList.addEventListener("change", (event) => {
      const item = event.target.closest(".task-item");
      if (!item) return;

      if (event.target.classList.contains("task-checkbox")) {
        Actions.toggleComplete(item.dataset.id);
      }
    });

    // Enter saves an in-progress edit, Escape cancels it.
    dom.taskList.addEventListener("keydown", (event) => {
      const input = event.target.closest(".task-edit-input");
      if (!input) return;
      const item = event.target.closest(".task-item");

      if (event.key === "Enter") {
        event.preventDefault();
        Actions.saveEdit(item.dataset.id, input.value);
      } else if (event.key === "Escape") {
        event.preventDefault();
        Actions.cancelEditing();
      }
    });

    // Power-user shortcut: Ctrl/Cmd + Shift + Delete clears everything.
    document.addEventListener("keydown", (event) => {
      const wantsClearAll =
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key === "Delete";
      if (wantsClearAll) {
        event.preventDefault();
        Actions.clearAll();
      }
    });

    // Belt-and-braces: make sure the latest state is flushed on exit.
    window.addEventListener("beforeunload", () => Storage.save(State.tasks));

    // Initial overdue notification.
    notifyOverdue();
  }

  /* =========================================================
     INIT
  ========================================================= */
  function init() {
    State.tasks = Storage.load();

    Render.all();
    Clock.start();
    bindEvents();

    dom.taskInput.focus();
  }

  document.addEventListener("DOMContentLoaded", init);

  // Theme (Dark/Light Mode) is initialized separately to keep logic clear.
  /* =========================================================
     Theme (Dark/Light Mode)
  ========================================================= */

  function getSavedTheme() {
    try {
      return localStorage.getItem("theme") || null;
    } catch {
      return null;
    }
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    const isDark = theme === "dark";
    root.dataset.theme = isDark ? "dark" : "light";
  }

  function toggleTheme() {
    const root = document.documentElement;
    const current = root.dataset.theme === "dark" ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";

    applyTheme(next);

    try {
      localStorage.setItem("theme", next);
    } catch {}

    if (dom.themeToggleBtn && dom.themeToggleIcon && dom.themeToggleLabel) {
      const isDark = next === "dark";
      dom.themeToggleBtn.setAttribute("aria-pressed", String(isDark));
      dom.themeToggleIcon.textContent = isDark ? "☀️" : "🌙";
      dom.themeToggleLabel.textContent = isDark ? "Light mode" : "Dark mode";
    }
  }

  // Hook theme toggle once the IIFE has executed and DOM is ready.
  document.addEventListener("DOMContentLoaded", () => {
    const saved = getSavedTheme();
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(saved || (prefersDark ? "dark" : "light"));

    if (dom.themeToggleBtn) {
      const isDarkNow = document.documentElement.dataset.theme === "dark";
      dom.themeToggleBtn.setAttribute("aria-pressed", String(isDarkNow));
      dom.themeToggleIcon.textContent = isDarkNow ? "☀️" : "🌙";
      dom.themeToggleLabel.textContent = isDarkNow ? "Light mode" : "Dark mode";

      dom.themeToggleBtn.addEventListener("click", toggleTheme);
    }
  });
})();
