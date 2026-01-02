// ===================================
// Todo App - Enhanced JavaScript
// All 12 features implemented
// ===================================

// DOM Elements
const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const emptyState = document.getElementById('emptyState');
const taskCount = document.getElementById('taskCount');
const clearCompleted = document.getElementById('clearCompleted');
const themeToggle = document.getElementById('themeToggle');
const filterBtns = document.querySelectorAll('.filter-btn');
const searchInput = document.getElementById('searchInput');
const prioritySelect = document.getElementById('prioritySelect');
const dueDateInput = document.getElementById('dueDateInput');
const categoryInput = document.getElementById('categoryInput');
const categoryList = document.getElementById('categoryList');
const categoryFilter = document.getElementById('categoryFilter');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');
const toastContainer = document.getElementById('toastContainer');
const soundToggle = document.getElementById('soundToggle');
const shortcutsModal = document.getElementById('shortcutsModal');
const closeShortcuts = document.getElementById('closeShortcuts');

// State
let todos = [];
let currentFilter = 'all';
let currentCategory = 'all';
let searchQuery = '';
let lastDeleted = null;
let undoTimeout = null;
let soundEnabled = true;
let draggedItem = null;

// Sound Effects (Web Audio API)
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (!soundEnabled) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch (type) {
        case 'add':
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.15);
            break;
        case 'complete':
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(900, audioContext.currentTime + 0.1);
            oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.25);
            break;
        case 'delete':
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.15);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.15);
            break;
        case 'undo':
            oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
    }
}

// ===================================
// Initialize App
// ===================================
function init() {
    loadTodos();
    loadTheme();
    loadSoundPreference();
    renderTodos();
    updateTaskCount();
    updateCategoryFilter();
    updateCategoryDatalist();

    // Event Listeners
    addBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });

    clearCompleted.addEventListener('click', clearCompletedTodos);
    themeToggle.addEventListener('click', toggleTheme);
    soundToggle.addEventListener('click', toggleSound);

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => setFilter(btn.dataset.filter));
    });

    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderTodos();
    });

    exportBtn.addEventListener('click', exportTodos);
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', importTodos);

    closeShortcuts.addEventListener('click', () => {
        shortcutsModal.classList.remove('visible');
    });

    shortcutsModal.addEventListener('click', (e) => {
        if (e.target === shortcutsModal) {
            shortcutsModal.classList.remove('visible');
        }
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(() => {
            // Service worker registration failed, app still works
        });
    }
}

// ===================================
// Keyboard Shortcuts
// ===================================
function handleKeyboardShortcuts(e) {
    // Don't trigger shortcuts when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') {
            e.target.blur();
        }
        return;
    }

    if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
            case 'f':
                e.preventDefault();
                searchInput.focus();
                break;
            case 'n':
                e.preventDefault();
                todoInput.focus();
                break;
        }
    } else if (e.key === '?') {
        shortcutsModal.classList.add('visible');
    } else if (e.key === 'Escape') {
        shortcutsModal.classList.remove('visible');
    }
}

// ===================================
// Theme Functions
// ===================================
function loadTheme() {
    const savedTheme = localStorage.getItem('todo-theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('todo-theme', newTheme);

    themeToggle.style.transform = 'scale(0.9)';
    setTimeout(() => {
        themeToggle.style.transform = 'scale(1)';
    }, 150);
}

// ===================================
// Sound Functions
// ===================================
function loadSoundPreference() {
    const saved = localStorage.getItem('todo-sound');
    soundEnabled = saved !== 'false';
    updateSoundButton();
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('todo-sound', soundEnabled);
    updateSoundButton();
    if (soundEnabled) playSound('add');
}

function updateSoundButton() {
    soundToggle.classList.toggle('muted', !soundEnabled);
}

// ===================================
// Todo CRUD Functions
// ===================================
function loadTodos() {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
        todos = JSON.parse(savedTodos);
        // Migrate old todos without new fields
        todos = todos.map(todo => ({
            priority: 'low',
            dueDate: null,
            category: null,
            subtasks: [],
            ...todo
        }));
    }
}

function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

function addTodo() {
    const text = todoInput.value.trim();

    if (!text) {
        todoInput.style.animation = 'shake 0.3s ease';
        setTimeout(() => {
            todoInput.style.animation = '';
        }, 300);
        return;
    }

    const todo = {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString(),
        priority: prioritySelect.value,
        dueDate: dueDateInput.value || null,
        category: categoryInput.value.trim() || null,
        subtasks: []
    };

    todos.unshift(todo);
    saveTodos();
    renderTodos();
    updateTaskCount();
    updateCategoryFilter();
    updateCategoryDatalist();

    // Reset inputs
    todoInput.value = '';
    prioritySelect.value = 'low';
    dueDateInput.value = '';
    categoryInput.value = '';
    todoInput.focus();

    playSound('add');
}

function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos();
        renderTodos();
        updateTaskCount();
        if (todo.completed) playSound('complete');
    }
}

function deleteTodo(id) {
    const todoIndex = todos.findIndex(t => t.id === id);
    if (todoIndex === -1) return;

    const deletedTodo = todos[todoIndex];
    const todoElement = document.querySelector(`[data-id="${id}"]`);

    // Store for undo
    lastDeleted = { todo: deletedTodo, index: todoIndex };

    // Clear previous undo timeout
    if (undoTimeout) clearTimeout(undoTimeout);

    // Animate out
    if (todoElement) {
        todoElement.style.animation = 'slideOut 0.3s ease forwards';
    }

    setTimeout(() => {
        todos.splice(todoIndex, 1);
        saveTodos();
        renderTodos();
        updateTaskCount();
        updateCategoryFilter();

        // Show undo toast
        showToast('Task deleted', true);

        // Auto-clear undo after 5 seconds
        undoTimeout = setTimeout(() => {
            lastDeleted = null;
        }, 5000);
    }, 280);

    playSound('delete');
}

function undoDelete() {
    if (!lastDeleted) return;

    todos.splice(lastDeleted.index, 0, lastDeleted.todo);
    saveTodos();
    renderTodos();
    updateTaskCount();
    updateCategoryFilter();

    lastDeleted = null;
    if (undoTimeout) clearTimeout(undoTimeout);

    // Highlight restored item
    setTimeout(() => {
        const restored = document.querySelector(`[data-id="${lastDeleted?.todo?.id || todos[0]?.id}"]`);
        if (restored) restored.classList.add('highlight');
    }, 100);

    playSound('undo');
}

function editTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    const todoElement = document.querySelector(`[data-id="${id}"]`);
    const textElement = todoElement.querySelector('.todo-text');
    const currentText = todo.text;

    // Replace text with input
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'todo-edit-input';
    input.value = currentText;

    textElement.replaceWith(input);
    input.focus();
    input.select();

    function saveEdit() {
        const newText = input.value.trim();
        if (newText && newText !== currentText) {
            todo.text = newText;
            saveTodos();
        }
        renderTodos();
    }

    input.addEventListener('blur', saveEdit);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            input.blur();
        } else if (e.key === 'Escape') {
            input.value = currentText;
            input.blur();
        }
    });
}

function clearCompletedTodos() {
    const completedItems = document.querySelectorAll('.todo-item.completed');

    if (completedItems.length === 0) return;

    completedItems.forEach((item, index) => {
        setTimeout(() => {
            item.style.animation = 'slideOut 0.3s ease forwards';
        }, index * 50);
    });

    setTimeout(() => {
        todos = todos.filter(t => !t.completed);
        saveTodos();
        renderTodos();
        updateTaskCount();
        updateCategoryFilter();
        showToast(`${completedItems.length} task(s) cleared`);
    }, completedItems.length * 50 + 280);

    playSound('delete');
}

// ===================================
// Subtasks
// ===================================
function addSubtask(todoId) {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;

    const text = prompt('Enter subtask:');
    if (!text || !text.trim()) return;

    todo.subtasks.push({
        id: Date.now(),
        text: text.trim(),
        completed: false
    });

    saveTodos();
    renderTodos();
    playSound('add');
}

function toggleSubtask(todoId, subtaskId) {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;

    const subtask = todo.subtasks.find(s => s.id === subtaskId);
    if (subtask) {
        subtask.completed = !subtask.completed;
        saveTodos();
        renderTodos();
        if (subtask.completed) playSound('complete');
    }
}

function deleteSubtask(todoId, subtaskId) {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;

    todo.subtasks = todo.subtasks.filter(s => s.id !== subtaskId);
    saveTodos();
    renderTodos();
}

// ===================================
// Drag and Drop
// ===================================
function handleDragStart(e) {
    draggedItem = e.target.closest('.todo-item');
    draggedItem.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    if (draggedItem) {
        draggedItem.classList.remove('dragging');
        draggedItem = null;
    }
    document.querySelectorAll('.drag-over').forEach(el => {
        el.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    e.preventDefault();
    const item = e.target.closest('.todo-item');
    if (item && item !== draggedItem) {
        item.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    const item = e.target.closest('.todo-item');
    if (item) {
        item.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    const dropTarget = e.target.closest('.todo-item');

    if (!dropTarget || !draggedItem || dropTarget === draggedItem) return;

    const draggedId = parseInt(draggedItem.dataset.id);
    const dropId = parseInt(dropTarget.dataset.id);

    const draggedIndex = todos.findIndex(t => t.id === draggedId);
    const dropIndex = todos.findIndex(t => t.id === dropId);

    if (draggedIndex === -1 || dropIndex === -1) return;

    // Reorder
    const [removed] = todos.splice(draggedIndex, 1);
    todos.splice(dropIndex, 0, removed);

    saveTodos();
    renderTodos();

    dropTarget.classList.remove('drag-over');
}

// ===================================
// Filter Functions
// ===================================
function setFilter(filter) {
    currentFilter = filter;

    filterBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });

    renderTodos();
}

function setCategoryFilter(category) {
    currentCategory = category;

    document.querySelectorAll('.category-pill').forEach(pill => {
        pill.classList.toggle('active', pill.dataset.category === category);
    });

    renderTodos();
}

function getFilteredTodos() {
    let filtered = todos;

    // Status filter
    switch (currentFilter) {
        case 'active':
            filtered = filtered.filter(t => !t.completed);
            break;
        case 'completed':
            filtered = filtered.filter(t => t.completed);
            break;
    }

    // Category filter
    if (currentCategory !== 'all') {
        filtered = filtered.filter(t => t.category === currentCategory);
    }

    // Search filter
    if (searchQuery) {
        filtered = filtered.filter(t =>
            t.text.toLowerCase().includes(searchQuery) ||
            (t.category && t.category.toLowerCase().includes(searchQuery))
        );
    }

    return filtered;
}

// ===================================
// Category Functions
// ===================================
function getCategories() {
    const categories = new Set();
    todos.forEach(todo => {
        if (todo.category) categories.add(todo.category);
    });
    return Array.from(categories).sort();
}

function updateCategoryFilter() {
    const categories = getCategories();

    categoryFilter.innerHTML = '<button class="category-pill active" data-category="all">All</button>';

    categories.forEach(cat => {
        const pill = document.createElement('button');
        pill.className = 'category-pill';
        pill.dataset.category = cat;
        pill.textContent = cat;
        if (cat === currentCategory) {
            pill.classList.add('active');
            categoryFilter.querySelector('[data-category="all"]').classList.remove('active');
        }
        pill.addEventListener('click', () => setCategoryFilter(cat));
        categoryFilter.appendChild(pill);
    });

    categoryFilter.querySelector('[data-category="all"]').addEventListener('click', () => setCategoryFilter('all'));
}

function updateCategoryDatalist() {
    categoryList.innerHTML = '';
    getCategories().forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        categoryList.appendChild(option);
    });
}

// ===================================
// Export/Import
// ===================================
function exportTodos() {
    const data = {
        todos: todos,
        exportDate: new Date().toISOString(),
        version: '2.0'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `todos-${new Date().toISOString().split('T')[0]}.json`;
    a.click();

    URL.revokeObjectURL(url);
    showToast('Todos exported successfully!');
}

function importTodos(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);

            if (data.todos && Array.isArray(data.todos)) {
                // Merge with existing todos
                const existingIds = new Set(todos.map(t => t.id));
                const newTodos = data.todos.filter(t => !existingIds.has(t.id));

                todos = [...newTodos, ...todos];
                saveTodos();
                renderTodos();
                updateTaskCount();
                updateCategoryFilter();
                updateCategoryDatalist();

                showToast(`Imported ${newTodos.length} new task(s)!`);
            } else {
                throw new Error('Invalid format');
            }
        } catch (err) {
            showToast('Failed to import. Invalid file format.');
        }
    };
    reader.readAsText(file);

    // Reset file input
    e.target.value = '';
}

// ===================================
// Toast Notifications
// ===================================
function showToast(message, showUndo = false) {
    // Remove existing toasts
    toastContainer.querySelectorAll('.toast').forEach(toast => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    });

    const toast = document.createElement('div');
    toast.className = 'toast';

    toast.innerHTML = `
        <span class="toast-icon">${showUndo ? '↩️' : 'ℹ️'}</span>
        <span class="toast-message">${escapeHtml(message)}</span>
        ${showUndo ? '<button class="toast-undo">Undo</button>' : ''}
        <button class="toast-close">×</button>
    `;

    toastContainer.appendChild(toast);

    // Event listeners
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    });

    if (showUndo) {
        const undoBtn = toast.querySelector('.toast-undo');
        undoBtn.addEventListener('click', () => {
            undoDelete();
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), 300);
        });
    }

    // Auto dismiss
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), 300);
        }
    }, showUndo ? 5000 : 3000);
}

// ===================================
// Render Functions
// ===================================
function renderTodos() {
    const filteredTodos = getFilteredTodos();

    todoList.innerHTML = '';

    if (filteredTodos.length === 0) {
        emptyState.classList.add('visible');
        todoList.style.display = 'none';
    } else {
        emptyState.classList.remove('visible');
        todoList.style.display = 'flex';

        filteredTodos.forEach((todo, index) => {
            const li = createTodoElement(todo);
            li.style.animationDelay = `${index * 0.03}s`;
            todoList.appendChild(li);
        });
    }
}

function createTodoElement(todo) {
    const li = document.createElement('li');
    li.className = `todo-item${todo.completed ? ' completed' : ''}`;
    li.setAttribute('data-id', todo.id);
    li.setAttribute('draggable', 'true');

    // Due date formatting
    let dueDateHtml = '';
    if (todo.dueDate) {
        const dueDate = new Date(todo.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);

        const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        let dateClass = '';
        let dateText = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        if (daysDiff < 0 && !todo.completed) {
            dateClass = 'overdue';
            dateText = 'Overdue';
        } else if (daysDiff === 0) {
            dateClass = 'today';
            dateText = 'Today';
        } else if (daysDiff === 1) {
            dateText = 'Tomorrow';
        }

        dueDateHtml = `<span class="due-date-badge ${dateClass}">📅 ${dateText}</span>`;
    }

    // Subtasks HTML
    let subtasksHtml = '';
    if (todo.subtasks && todo.subtasks.length > 0) {
        const completedSubtasks = todo.subtasks.filter(s => s.completed).length;
        subtasksHtml = `
            <div class="subtasks-container">
                ${todo.subtasks.map(subtask => `
                    <div class="subtask-item ${subtask.completed ? 'completed' : ''}" data-subtask-id="${subtask.id}">
                        <input type="checkbox" class="subtask-checkbox" ${subtask.completed ? 'checked' : ''}>
                        <span class="subtask-text">${escapeHtml(subtask.text)}</span>
                        <button class="subtask-delete">×</button>
                    </div>
                `).join('')}
                <button class="add-subtask-btn">+ Add subtask</button>
            </div>
        `;
    } else {
        subtasksHtml = `
            <div class="subtasks-container" style="display: none;">
                <button class="add-subtask-btn">+ Add subtask</button>
            </div>
        `;
    }

    // Subtask progress
    let progressHtml = '';
    if (todo.subtasks && todo.subtasks.length > 0) {
        const completed = todo.subtasks.filter(s => s.completed).length;
        progressHtml = `<span class="subtask-progress">${completed}/${todo.subtasks.length}</span>`;
    }

    li.innerHTML = `
        <label class="todo-checkbox">
            <input type="checkbox" ${todo.completed ? 'checked' : ''}>
            <span class="checkmark"></span>
        </label>
        <div class="todo-content">
            <div class="todo-main">
                <span class="todo-text">${escapeHtml(todo.text)}</span>
                ${progressHtml}
            </div>
            <div class="todo-meta">
                <span class="priority-badge ${todo.priority}">${todo.priority}</span>
                ${dueDateHtml}
                ${todo.category ? `<span class="category-badge">${escapeHtml(todo.category)}</span>` : ''}
            </div>
            ${subtasksHtml}
        </div>
        <div class="todo-actions">
            <button class="todo-action-btn expand" title="Toggle subtasks">▼</button>
            <button class="todo-action-btn delete" title="Delete">×</button>
        </div>
    `;

    // Event Listeners
    const checkbox = li.querySelector('.todo-checkbox input');
    const textEl = li.querySelector('.todo-text');
    const deleteBtn = li.querySelector('.todo-action-btn.delete');
    const expandBtn = li.querySelector('.todo-action-btn.expand');
    const subtasksContainer = li.querySelector('.subtasks-container');
    const addSubtaskBtn = li.querySelector('.add-subtask-btn');

    checkbox.addEventListener('change', () => toggleTodo(todo.id));
    textEl.addEventListener('dblclick', () => editTodo(todo.id));
    deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

    expandBtn.addEventListener('click', () => {
        const isHidden = subtasksContainer.style.display === 'none';
        subtasksContainer.style.display = isHidden ? 'block' : 'none';
        expandBtn.textContent = isHidden ? '▲' : '▼';
    });

    addSubtaskBtn.addEventListener('click', () => addSubtask(todo.id));

    // Subtask event listeners
    li.querySelectorAll('.subtask-item').forEach(item => {
        const subtaskId = parseInt(item.dataset.subtaskId);
        const subtaskCheckbox = item.querySelector('.subtask-checkbox');
        const subtaskDelete = item.querySelector('.subtask-delete');

        subtaskCheckbox.addEventListener('change', () => toggleSubtask(todo.id, subtaskId));
        subtaskDelete.addEventListener('click', () => deleteSubtask(todo.id, subtaskId));
    });

    // Drag and drop
    li.addEventListener('dragstart', handleDragStart);
    li.addEventListener('dragend', handleDragEnd);
    li.addEventListener('dragover', handleDragOver);
    li.addEventListener('dragleave', handleDragLeave);
    li.addEventListener('drop', handleDrop);

    return li;
}

function updateTaskCount() {
    const activeTodos = todos.filter(t => !t.completed);
    const count = activeTodos.length;
    taskCount.textContent = `${count} task${count !== 1 ? 's' : ''} remaining`;
}

// ===================================
// Utility Functions
// ===================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===================================
// Start App
// ===================================
document.addEventListener('DOMContentLoaded', init);
