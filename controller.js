import { Model } from "./model.js";
import { View } from "./view.js";

export const Controller = {

    _currentFilter: { subject: "all", status: "all", search: "" },
    _sortBy: "deadline",

    init() {
        this.render();
        this._bindFilters();
        this._bindSort();
        this._bindSearch();
        this._bindEditForm();
        this._bindClearCompleted();
        this._bindExportPDF();
        this._bindThemeToggle();
    },

    addTask(data) {
        if (!data.title || !data.subject || !data.deadline || !data.priority) {
            View.showToast("Please fill in all fields.", "error");
            return;
        }
        const task = {
            id: Date.now(),
            title: data.title.trim(),
            subject: data.subject,
            deadline: data.deadline,
            priority: data.priority,
            notes: data.notes ? data.notes.trim() : "",
            completed: false,
            createdAt: Date.now()
        };
        Model.addTask(task);
        View.showToast("Task added successfully!", "success");
        this.render();
    },

    toggleTask(id) {
        Model.toggleTask(id);
        const tasks = Model.getTasks();
        const task = tasks.find(t => t.id === id);
        View.showToast(task && task.completed ? "Task marked as done!" : "Task marked as pending.", "info");
        this.render();
    },

    confirmDelete(id) {
        const tasks = Model.getTasks();
        const task = tasks.find(t => t.id === id);
        if (!task) return;
        if (!confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
        Model.deleteTask(id);
        View.showToast("Task deleted.", "warning");
        this.render();
    },

    openEditModal(id) {
        const tasks = Model.getTasks();
        const task = tasks.find(t => t.id === id);
        if (!task) return;
        View.populateEditModal(task);
    },

    saveEdit() {
        const id = +document.getElementById("editId").value;
        const title = document.getElementById("editTitle").value.trim();
        const subject = document.getElementById("editSubject").value;
        const deadline = document.getElementById("editDeadline").value;
        const priority = document.getElementById("editPriority").value;
        const notes = document.getElementById("editNotes").value.trim();

        if (!title || !subject || !deadline || !priority) {
            View.showToast("Please fill in all fields.", "error");
            return;
        }

        Model.updateTask(id, { title, subject, deadline, priority, notes });
        View.showToast("Task updated!", "success");

        const modalEl = document.getElementById("editModal");
        bootstrap.Modal.getInstance(modalEl)?.hide();
        this.render();
    },

    clearCompleted() {
        const stats = Model.getStats();
        if (stats.completed === 0) {
            View.showToast("No completed tasks to clear.", "info");
            return;
        }
        if (!confirm(`Clear all ${stats.completed} completed tasks?`)) return;
        Model.clearCompleted();
        View.showToast("Completed tasks cleared.", "warning");
        this.render();
    },

    reorderTasks(ids, fromIdx, toIdx) {
        const tasks = Model.getTasks();
        const idOrder = ids.slice();
        const [moved] = idOrder.splice(fromIdx, 1);
        idOrder.splice(toIdx, 0, moved);
        const reordered = idOrder.map(id => tasks.find(t => t.id === id)).filter(Boolean);
        Model.reorderTasks(reordered);
        this.render();
    },

    render() {
        let tasks = Model.getTasks();
        const f = this._currentFilter;

        if (f.search) {
            const q = f.search.toLowerCase();
            tasks = tasks.filter(t =>
                t.title.toLowerCase().includes(q) ||
                t.subject.toLowerCase().includes(q)
            );
        }
        if (f.subject !== "all") tasks = tasks.filter(t => t.subject === f.subject);
        if (f.status === "active") tasks = tasks.filter(t => !t.completed);
        if (f.status === "done") tasks = tasks.filter(t => t.completed);

        const now = new Date(); now.setHours(0,0,0,0);
        const priorityOrder = { high: 0, medium: 1, low: 2 };

        if (this._sortBy === "deadline") {
            tasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
        } else if (this._sortBy === "priority") {
            tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        } else if (this._sortBy === "status") {
            tasks.sort((a, b) => Number(a.completed) - Number(b.completed));
        }

        View.renderTasks(tasks);
        View.updateStats(Model.getStats());
    },

    _bindFilters() {
        document.getElementById("filterSubject")?.addEventListener("change", e => {
            this._currentFilter.subject = e.target.value;
            this.render();
        });
        document.getElementById("filterStatus")?.addEventListener("change", e => {
            this._currentFilter.status = e.target.value;
            this.render();
        });
    },

    _bindSort() {
        document.querySelectorAll("[data-sort]").forEach(btn => {
            btn.addEventListener("click", () => {
                this._sortBy = btn.dataset.sort;
                document.querySelectorAll("[data-sort]").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                this.render();
            });
        });
    },

    _bindSearch() {
        const input = document.getElementById("searchInput");
        if (!input) return;
        let debounce;
        input.addEventListener("input", () => {
            clearTimeout(debounce);
            debounce = setTimeout(() => {
                this._currentFilter.search = input.value.trim();
                this.render();
            }, 250);
        });
    },

    _bindEditForm() {
        document.getElementById("saveEditBtn")?.addEventListener("click", () => this.saveEdit());
    },

    _bindClearCompleted() {
        document.getElementById("clearCompletedBtn")?.addEventListener("click", () => this.clearCompleted());
    },

    _bindExportPDF() {
        document.getElementById("exportPDFBtn")?.addEventListener("click", () => this._exportPDF());
    },

    _bindThemeToggle() {
        const btn = document.getElementById("themeToggle");
        if (!btn) return;
        const saved = localStorage.getItem("planner_theme") || "dark";
        document.body.dataset.theme = saved;
        btn.innerHTML = saved === "dark"
            ? `<i class="bi bi-sun-fill"></i>`
            : `<i class="bi bi-moon-fill"></i>`;

        btn.addEventListener("click", () => {
            const current = document.body.dataset.theme;
            const next = current === "dark" ? "light" : "dark";
            document.body.dataset.theme = next;
            localStorage.setItem("planner_theme", next);
            btn.innerHTML = next === "dark"
                ? `<i class="bi bi-sun-fill"></i>`
                : `<i class="bi bi-moon-fill"></i>`;
        });
    },

    _exportPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const tasks = Model.getTasks();

        doc.setFontSize(20);
        doc.setTextColor(108, 77, 255);
        doc.text("Student Assignment Planner", 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Exported: ${new Date().toLocaleDateString()}`, 14, 28);

        let y = 38;
        doc.setFontSize(12);
        doc.setTextColor(30);

        tasks.forEach((task, i) => {
            if (y > 270) { doc.addPage(); y = 20; }
            const status = task.completed ? "[DONE]" : "[PENDING]";
            doc.setFont(undefined, "bold");
            doc.text(`${i + 1}. ${task.title} ${status}`, 14, y);
            doc.setFont(undefined, "normal");
            doc.setFontSize(10);
            doc.text(`   Subject: ${task.subject} | Due: ${task.deadline} | Priority: ${task.priority}`, 14, y + 6);
            if (task.notes) doc.text(`   Notes: ${task.notes}`, 14, y + 12);
            y += task.notes ? 20 : 14;
            doc.setFontSize(12);
        });

        doc.save("assignments.pdf");
        View.showToast("PDF exported!", "success");
    }
};