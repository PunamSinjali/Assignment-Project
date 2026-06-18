import { Controller } from "./controller.js";

window.app = Controller;

Controller.init();

// Form handler
document.getElementById("addBtn")?.addEventListener("click", () => {
    const title    = document.getElementById("taskTitle").value.trim();
    const subject  = document.getElementById("taskSubject").value;
    const deadline = document.getElementById("taskDate").value;
    const priority = document.getElementById("taskPriority").value;
    const notes    = document.getElementById("taskNotes")?.value || "";

    Controller.addTask({ title, subject, deadline, priority, notes });

    if (subject && deadline && priority && title) {
        document.getElementById("taskTitle").value    = "";
        document.getElementById("taskSubject").value  = "";
        document.getElementById("taskDate").value     = "";
        document.getElementById("taskPriority").value = "";
        const notesEl = document.getElementById("taskNotes");
        if (notesEl) notesEl.value = "";
    }
});

// Allow pressing Enter in title field
document.getElementById("taskTitle")?.addEventListener("keydown", e => {
    if (e.key === "Enter") document.getElementById("addBtn")?.click();
});