const STORAGE_KEY = "planner_tasks_v2";

let tasks = [];

function load() {
    try {
        tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
        tasks = [];
    }
}

function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

load();

export const Model = {

    getTasks() {
        return [...tasks];
    },

    addTask(task) {
        tasks.push(task);
        save();
    },

    updateTask(id, changes) {
        tasks = tasks.map(t => t.id === id ? { ...t, ...changes } : t);
        save();
    },

    toggleTask(id) {
        tasks = tasks.map(t =>
            t.id === id ? { ...t, completed: !t.completed } : t
        );
        save();
    },

    deleteTask(id) {
        tasks = tasks.filter(t => t.id !== id);
        save();
    },

    clearCompleted() {
        tasks = tasks.filter(t => !t.completed);
        save();
    },

    reorderTasks(newOrder) {
        tasks = newOrder;
        save();
    },

    getStats() {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const pending = tasks.filter(t => !t.completed).length;
        const now = new Date(); now.setHours(0,0,0,0);
        const overdue = tasks.filter(t => {
            if (t.completed) return false;
            const d = new Date(t.deadline); d.setHours(0,0,0,0);
            return d < now;
        }).length;
        return { total, completed, pending, overdue };
    }
};