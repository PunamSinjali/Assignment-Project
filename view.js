function getDaysLeft(dateStr) {
    const today = new Date(); today.setHours(0,0,0,0);
    const due = new Date(dateStr); due.setHours(0,0,0,0);
    return Math.ceil((due - today) / 86400000);
}

function formatDate(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function priorityIcon(p) {
    return p === "high" ? "🔴" : p === "medium" ? "🟡" : "🟢";
}

export const View = {

    showToast(message, type = "success") {
        const container = document.getElementById("toastContainer");
        const id = "toast_" + Date.now();
        const icon = type === "success" ? "bi-check-circle-fill" :
                     type === "error" ? "bi-x-circle-fill" :
                     type === "info" ? "bi-info-circle-fill" : "bi-exclamation-triangle-fill";
        const colorClass = type === "success" ? "toast-success" :
                           type === "error" ? "toast-error" :
                           type === "info" ? "toast-info" : "toast-warning";

        const el = document.createElement("div");
        el.id = id;
        el.className = `toast-item ${colorClass}`;
        el.innerHTML = `<i class="bi ${icon}"></i> ${message}`;
        container.appendChild(el);

        setTimeout(() => el.classList.add("show"), 10);
        setTimeout(() => {
            el.classList.remove("show");
            setTimeout(() => el.remove(), 400);
        }, 3000);
    },

    renderTasks(tasks) {
        const list = document.getElementById("taskList");
        if (!list) return;

        if (tasks.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <h5>No tasks found</h5>
                    <p>Add an assignment above to get started.</p>
                </div>`;
            return;
        }

        list.innerHTML = tasks.map(task => {
            const days = getDaysLeft(task.deadline);
            const isOverdue = days < 0 && !task.completed;
            const isDueSoon = days >= 0 && days <= 2 && !task.completed;

            let daysLabel = "";
            if (task.completed) daysLabel = `<span class="badge-done">Completed</span>`;
            else if (days < 0) daysLabel = `<span class="badge-overdue">⚠ ${Math.abs(days)}d overdue</span>`;
            else if (days === 0) daysLabel = `<span class="badge-due-soon">Due today!</span>`;
            else if (days <= 2) daysLabel = `<span class="badge-due-soon">${days}d left</span>`;
            else daysLabel = `<span class="badge-days">${days}d left</span>`;

            return `
            <div class="task-card ${task.priority} ${task.completed ? "completed" : ""} ${isOverdue ? "overdue" : ""}"
                 data-id="${task.id}" draggable="true">
                <div class="task-check">
                    <button class="check-btn ${task.completed ? "checked" : ""}"
                        onclick="app.toggleTask(${task.id})" title="${task.completed ? "Mark pending" : "Mark done"}">
                        <i class="bi ${task.completed ? "bi-check-circle-fill" : "bi-circle"}"></i>
                    </button>
                </div>
                <div class="task-body">
                    <div class="task-top">
                        <h5 class="task-title ${task.completed ? "strikethrough" : ""}">${task.title}</h5>
                        <div class="task-badges">
                            <span class="badge-subject">${task.subject}</span>
                            <span class="badge-priority ${task.priority}">${priorityIcon(task.priority)} ${task.priority}</span>
                        </div>
                    </div>
                    <div class="task-meta">
                        <span><i class="bi bi-calendar3"></i> ${formatDate(task.deadline)}</span>
                        ${daysLabel}
                    </div>
                    ${task.notes ? `<p class="task-notes">${task.notes}</p>` : ""}
                </div>
                <div class="task-actions">
                    <button class="action-btn edit-btn" onclick="app.openEditModal(${task.id})" title="Edit">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="app.confirmDelete(${task.id})" title="Delete">
                        <i class="bi bi-trash3"></i>
                    </button>
                    <div class="drag-handle" title="Drag to reorder">
                        <i class="bi bi-grip-vertical"></i>
                    </div>
                </div>
            </div>`;
        }).join("");

        this._initDragDrop();
    },

    updateStats(stats) {
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set("totalTasks", stats.total);
        set("completedTasks", stats.completed);
        set("pendingTasks", stats.pending);
        set("overdueTasks", stats.overdue);

        const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
        const bar = document.getElementById("progressBar");
        const pctLabel = document.getElementById("progressPct");
        if (bar) bar.style.width = pct + "%";
        if (pctLabel) pctLabel.textContent = pct + "%";
    },

    populateEditModal(task) {
        document.getElementById("editId").value = task.id;
        document.getElementById("editTitle").value = task.title;
        document.getElementById("editSubject").value = task.subject;
        document.getElementById("editDeadline").value = task.deadline;
        document.getElementById("editPriority").value = task.priority;
        document.getElementById("editNotes").value = task.notes || "";

        const modal = new bootstrap.Modal(document.getElementById("editModal"));
        modal.show();
    },

    _initDragDrop() {
        const cards = document.querySelectorAll(".task-card[draggable]");
        let dragSrc = null;

        cards.forEach(card => {
            card.addEventListener("dragstart", e => {
                dragSrc = card;
                card.classList.add("dragging");
                e.dataTransfer.effectAllowed = "move";
            });
            card.addEventListener("dragend", () => {
                card.classList.remove("dragging");
                document.querySelectorAll(".task-card").forEach(c => c.classList.remove("drag-over"));
            });
            card.addEventListener("dragover", e => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (card !== dragSrc) {
                    document.querySelectorAll(".task-card").forEach(c => c.classList.remove("drag-over"));
                    card.classList.add("drag-over");
                }
            });
            card.addEventListener("drop", e => {
                e.preventDefault();
                if (dragSrc && dragSrc !== card) {
                    const ids = [...document.querySelectorAll(".task-card")].map(c => +c.dataset.id);
                    const srcIdx = ids.indexOf(+dragSrc.dataset.id);
                    const dstIdx = ids.indexOf(+card.dataset.id);
                    if (srcIdx !== -1 && dstIdx !== -1) {
                        window.app.reorderTasks(ids, srcIdx, dstIdx);
                    }
                }
            });
        });
    }
};