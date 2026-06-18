let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function addTask() {
    const title = document.getElementById("title").value.trim();
    const subject = document.getElementById("subject").value.trim();
    const deadline = document.getElementById("deadline").value;
    const priority = document.getElementById("priority").value;

    // ✅ Better validation messages
    if (!title) return alert("Please enter assignment title");
    if (!subject) return alert("Please enter subject");
    if (!deadline) return alert("Please select a deadline");

    tasks.push({
        id: Date.now(),
        title,
        subject,
        deadline,
        priority,
        completed: false
    });

    saveTasks();

    document.getElementById("title").value = "";
    document.getElementById("subject").value = "";
    document.getElementById("deadline").value = "";

    renderTasks();
}

function toggleTask(id) {
    tasks = tasks.map(task =>
        task.id === id
            ? { ...task, completed: !task.completed }
            : task
    );

    saveTasks();
    renderTasks();
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
}

function getDaysLeft(date) {
    const today = new Date();
    const due = new Date(date);

    today.setHours(0,0,0,0);
    due.setHours(0,0,0,0);

    const diff = due - today;

    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function renderTasks() {
    const list = document.getElementById("taskList");
    list.innerHTML = "";

    if (tasks.length === 0) {
        list.innerHTML = `
            <div style="text-align:center;opacity:0.6;padding:20px;">
                📭 No assignments yet
            </div>
        `;
        updateStats();
        return;
    }

    let html = "";

    tasks.forEach(task => {
        html += `
        <div class="task-card ${task.completed ? "completed" : ""} ${task.priority.toLowerCase()}">

            <h4>${task.title}</h4>
            <p>📚 ${task.subject}</p>
            <p>📅 Due: ${task.deadline}</p>
            <p>⏳ ${getDaysLeft(task.deadline)} days left</p>
            <p>⚡ Priority: <b>${task.priority}</b></p>

            <button onclick="toggleTask(${task.id})">
                ${task.completed ? "Undo" : "Mark Done"}
            </button>

            <button onclick="deleteTask(${task.id})">
                Delete
            </button>

        </div>
        `;
    });

    list.innerHTML = html;
    updateStats();
}
function updateStats() {
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    const pending = total - completed;

    document.getElementById("totalTasks").innerText = total;
    document.getElementById("completedTasks").innerText = completed;
    document.getElementById("pendingTasks").innerText = pending;
}

renderTasks();
