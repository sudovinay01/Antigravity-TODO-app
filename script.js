// ===================================
// Todo App - Phase 2 JavaScript
// All features + bug fixes
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
const recurringSelect = document.getElementById('recurringSelect');
const reminderInput = document.getElementById('reminderInput');
const sortSelect = document.getElementById('sortSelect');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');
const toastContainer = document.getElementById('toastContainer');
const soundToggle = document.getElementById('soundToggle');
const shortcutsModal = document.getElementById('shortcutsModal');
const closeShortcuts = document.getElementById('closeShortcuts');
const archiveModal = document.getElementById('archiveModal');
const archiveList = document.getElementById('archiveList');
const archiveEmpty = document.getElementById('archiveEmpty');
const archiveViewBtn = document.getElementById('archiveViewBtn');
const archiveBadge = document.getElementById('archiveBadge');
const closeArchive = document.getElementById('closeArchive');
const trashModal = document.getElementById('trashModal');
const trashList = document.getElementById('trashList');
const trashEmpty = document.getElementById('trashEmpty');
const trashViewBtn = document.getElementById('trashViewBtn');
const trashBadge = document.getElementById('trashBadge');
const closeTrash = document.getElementById('closeTrash');
const emptyTrash = document.getElementById('emptyTrash');

// Add Task Modal Elements
const addTaskModal = document.getElementById('addTaskModal');
const openAddModal = document.getElementById('openAddModal');
const closeAddModal = document.getElementById('closeAddModal');
const cancelAddModal = document.getElementById('cancelAddModal');

// State
let todos = [];
let archivedTodos = [];
let trashedTodos = [];
let currentFilter = 'all';
let currentCategory = 'all';
let currentSort = 'created';
let searchQuery = '';
let lastDeleted = null;
let undoTimeout = null;
let soundEnabled = true;
let draggedItem = null;

// Touch state
let touchStartX = 0;
let touchCurrentX = 0;
let isSwiping = false;

// Sound Effects (Web Audio API)
let audioContext = null;

function getAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

function playSound(type) {
    if (!soundEnabled) return;

    try {
        const ctx = getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        switch (type) {
            case 'add':
                oscillator.frequency.setValueAtTime(800, ctx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.15);
                break;
            case 'complete':
                oscillator.frequency.setValueAtTime(600, ctx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.25);
                break;
            case 'delete':
                oscillator.frequency.setValueAtTime(400, ctx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
                gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.15);
                break;
            case 'undo':
                oscillator.frequency.setValueAtTime(500, ctx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.1);
                break;
        }
    } catch (e) {
        // Audio not available
    }
}

// ===================================
// Initialize App
// ===================================
function init() {
    loadTodos();
    loadTheme();
    loadSoundPreference();
    cleanupTrash();
    checkReminders();
    renderTodos();
    updateTaskCount();
    updateCategoryFilter();
    updateCategoryDatalist();
    updateBadges();

    // Event Listeners
    // Add Task Modal
    openAddModal.addEventListener('click', openAddTaskModal);
    closeAddModal.addEventListener('click', closeAddTaskModal);
    cancelAddModal.addEventListener('click', closeAddTaskModal);
    addTaskModal.addEventListener('click', (e) => {
        if (e.target === addTaskModal) closeAddTaskModal();
    });

    addBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });

    clearCompleted.addEventListener('click', archiveCompletedTodos);
    themeToggle.addEventListener('click', toggleTheme);
    soundToggle.addEventListener('click', toggleSound);

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => setFilter(btn.dataset.filter));
    });

    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderTodos();
    });

    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderTodos();
    });

    exportBtn.addEventListener('click', exportTodos);
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', importTodos);

    // Archive modal
    archiveViewBtn.addEventListener('click', () => {
        renderArchive();
        archiveModal.classList.add('visible');
    });
    closeArchive.addEventListener('click', () => archiveModal.classList.remove('visible'));
    archiveModal.addEventListener('click', (e) => {
        if (e.target === archiveModal) archiveModal.classList.remove('visible');
    });

    // Trash modal
    trashViewBtn.addEventListener('click', () => {
        renderTrash();
        trashModal.classList.add('visible');
    });
    closeTrash.addEventListener('click', () => trashModal.classList.remove('visible'));
    trashModal.addEventListener('click', (e) => {
        if (e.target === trashModal) trashModal.classList.remove('visible');
    });
    emptyTrash.addEventListener('click', emptyTrashBin);

    // Shortcuts modal
    closeShortcuts.addEventListener('click', () => shortcutsModal.classList.remove('visible'));
    shortcutsModal.addEventListener('click', (e) => {
        if (e.target === shortcutsModal) shortcutsModal.classList.remove('visible');
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }

    // Check reminders every minute
    setInterval(checkReminders, 60000);

    // Initialize PWA features
    initPWA();
}

// ===================================
// PWA Features
// ===================================
let deferredPrompt = null;
const offlineBanner = document.getElementById('offlineBanner');
const installBanner = document.getElementById('installBanner');
const installBtn = document.getElementById('installBtn');
const dismissInstall = document.getElementById('dismissInstall');

function initPWA() {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then((registration) => {
                console.log('[PWA] Service Worker registered:', registration.scope);

                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            showToast('New version available! Refresh to update.');
                        }
                    });
                });
            })
            .catch((error) => {
                console.log('[PWA] Service Worker registration failed:', error);
            });
    }

    // Offline/Online detection
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    if (!navigator.onLine) {
        handleOffline();
    }

    // Install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;

        // Check if user previously dismissed
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (!dismissed) {
            setTimeout(() => {
                installBanner.classList.add('visible');
            }, 3000); // Show after 3 seconds
        }
    });

    // Install button handler
    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;

            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                showToast('🎉 App installed successfully!');
            }

            deferredPrompt = null;
            installBanner.classList.remove('visible');
        });
    }

    // Dismiss install button (X button)
    if (dismissInstall) {
        dismissInstall.addEventListener('click', () => {
            installBanner.classList.remove('visible');
            localStorage.setItem('pwa-install-dismissed', 'true');
        });
    }

    // Dismiss install button (Not Now button)
    const dismissInstallBtn = document.getElementById('dismissInstallBtn');
    if (dismissInstallBtn) {
        dismissInstallBtn.addEventListener('click', () => {
            installBanner.classList.remove('visible');
            localStorage.setItem('pwa-install-dismissed', 'true');
        });
    }

    // Click outside to close install modal
    if (installBanner) {
        installBanner.addEventListener('click', (e) => {
            if (e.target === installBanner) {
                installBanner.classList.remove('visible');
            }
        });
    }

    // Check if app is installed
    window.addEventListener('appinstalled', () => {
        installBanner.classList.remove('visible');
        deferredPrompt = null;
        showToast('🎉 App installed!');
    });

    // Update app badge when tasks change
    updateAppBadge();
}

function handleOnline() {
    offlineBanner.classList.remove('visible');
    document.body.classList.remove('offline');
    showToast('✅ Back online!');
}

function handleOffline() {
    offlineBanner.classList.add('visible');
    document.body.classList.add('offline');
}

function updateAppBadge() {
    const activeTasks = todos.filter(t => !t.completed).length;

    // Update via service worker
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'UPDATE_BADGE',
            count: activeTasks
        });
    }

    // Direct badge API (if available)
    if ('setAppBadge' in navigator) {
        if (activeTasks > 0) {
            navigator.setAppBadge(activeTasks).catch(() => { });
        } else {
            navigator.clearAppBadge().catch(() => { });
        }
    }
}

// ===================================
// Keyboard Shortcuts
// ===================================
function handleKeyboardShortcuts(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') e.target.blur();
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
                openAddTaskModal();
                break;
        }
    } else if (e.key === '?') {
        shortcutsModal.classList.add('visible');
    } else if (e.key === 'Escape') {
        closeAddTaskModal();
        shortcutsModal.classList.remove('visible');
        archiveModal.classList.remove('visible');
        trashModal.classList.remove('visible');
    }
}

// ===================================
// Add Task Modal Functions
// ===================================
function openAddTaskModal() {
    addTaskModal.classList.add('visible');
    setTimeout(() => todoInput.focus(), 100);
}

function closeAddTaskModal() {
    addTaskModal.classList.remove('visible');
    // Reset form
    todoInput.value = '';
    prioritySelect.value = 'low';
    dueDateInput.value = '';
    categoryInput.value = '';
    recurringSelect.value = '';
    reminderInput.value = '';
}

// ===================================
// Theme Functions
// ===================================
function loadTheme() {
    // Check for saved preference, then system preference
    const savedTheme = localStorage.getItem('todo-theme');

    if (savedTheme) {
        document.body.setAttribute('data-theme', savedTheme);
    } else {
        // Auto-detect system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.body.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('todo-theme')) {
            document.body.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
    });
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('todo-theme', newTheme);

    themeToggle.style.transform = 'scale(0.9)';
    setTimeout(() => themeToggle.style.transform = 'scale(1)', 150);
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
    const savedArchive = localStorage.getItem('archivedTodos');
    const savedTrash = localStorage.getItem('trashedTodos');

    if (savedTodos) {
        todos = JSON.parse(savedTodos).map(todo => ({
            priority: 'low',
            dueDate: null,
            category: null,
            subtasks: [],
            recurring: null,
            reminderTime: null,
            ...todo
        }));
    }

    if (savedArchive) archivedTodos = JSON.parse(savedArchive);
    if (savedTrash) trashedTodos = JSON.parse(savedTrash);
}

function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
    localStorage.setItem('archivedTodos', JSON.stringify(archivedTodos));
    localStorage.setItem('trashedTodos', JSON.stringify(trashedTodos));

    // Update PWA app badge
    updateAppBadge();
}

function addTodo() {
    const text = todoInput.value.trim();

    if (!text) {
        todoInput.style.animation = 'shake 0.3s ease';
        setTimeout(() => todoInput.style.animation = '', 300);
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
        subtasks: [],
        recurring: recurringSelect.value || null,
        reminderTime: reminderInput.value || null
    };

    todos.unshift(todo);
    saveTodos();
    renderTodos();
    updateTaskCount();
    updateCategoryFilter();
    updateCategoryDatalist();

    // Close modal and reset
    closeAddTaskModal();

    playSound('add');

    // Schedule reminder if set
    if (todo.reminderTime && todo.dueDate) {
        scheduleReminder(todo);
    }
}

function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    // BUG FIX: Don't allow completing if subtasks are incomplete
    if (!todo.completed && todo.subtasks && todo.subtasks.length > 0) {
        const incompleteSubtasks = todo.subtasks.filter(s => !s.completed);
        if (incompleteSubtasks.length > 0) {
            showToast(`Complete all ${incompleteSubtasks.length} subtask(s) first!`, false, 'warning');
            return;
        }
    }

    todo.completed = !todo.completed;

    // Handle recurring tasks
    if (todo.completed && todo.recurring) {
        createRecurringTask(todo);
    }

    saveTodos();
    renderTodos();
    updateTaskCount();
    if (todo.completed) playSound('complete');
}

function createRecurringTask(originalTodo) {
    const newDueDate = getNextRecurringDate(originalTodo.dueDate, originalTodo.recurring);

    const newTodo = {
        ...originalTodo,
        id: Date.now(),
        completed: false,
        createdAt: new Date().toISOString(),
        dueDate: newDueDate,
        subtasks: originalTodo.subtasks.map(s => ({ ...s, completed: false }))
    };

    todos.unshift(newTodo);
    showToast(`Recurring task created for ${formatDate(newDueDate)}`);
}

function getNextRecurringDate(currentDate, recurring) {
    const date = currentDate ? new Date(currentDate) : new Date();

    switch (recurring) {
        case 'daily':
            date.setDate(date.getDate() + 1);
            break;
        case 'weekly':
            date.setDate(date.getDate() + 7);
            break;
        case 'monthly':
            date.setMonth(date.getMonth() + 1);
            break;
    }

    return date.toISOString().split('T')[0];
}

function deleteTodo(id) {
    const todoIndex = todos.findIndex(t => t.id === id);
    if (todoIndex === -1) return;

    const deletedTodo = todos[todoIndex];
    const todoElement = document.querySelector(`[data-id="${id}"]`);

    if (todoElement) {
        todoElement.style.animation = 'slideOut 0.3s ease forwards';
    }

    setTimeout(() => {
        // Move to trash instead of permanent delete
        deletedTodo.deletedAt = new Date().toISOString();
        trashedTodos.unshift(deletedTodo);
        todos.splice(todoIndex, 1);

        saveTodos();
        renderTodos();
        updateTaskCount();
        updateCategoryFilter();
        updateBadges();

        showToast('Task moved to trash', true);
        lastDeleted = { todo: deletedTodo, index: todoIndex };

        if (undoTimeout) clearTimeout(undoTimeout);
        undoTimeout = setTimeout(() => lastDeleted = null, 5000);
    }, 280);

    playSound('delete');
}

function undoDelete() {
    if (!lastDeleted) return;

    // Remove from trash and restore
    const trashIndex = trashedTodos.findIndex(t => t.id === lastDeleted.todo.id);
    if (trashIndex !== -1) {
        trashedTodos.splice(trashIndex, 1);
    }

    delete lastDeleted.todo.deletedAt;
    todos.splice(lastDeleted.index, 0, lastDeleted.todo);

    saveTodos();
    renderTodos();
    updateTaskCount();
    updateCategoryFilter();
    updateBadges();

    lastDeleted = null;
    if (undoTimeout) clearTimeout(undoTimeout);

    playSound('undo');
}

function archiveTodo(id) {
    const todoIndex = todos.findIndex(t => t.id === id);
    if (todoIndex === -1) return;

    const todo = todos[todoIndex];
    todo.archivedAt = new Date().toISOString();
    archivedTodos.unshift(todo);
    todos.splice(todoIndex, 1);

    saveTodos();
    renderTodos();
    updateTaskCount();
    updateBadges();

    showToast('Task archived');
}

function restoreFromArchive(id) {
    const index = archivedTodos.findIndex(t => t.id === id);
    if (index === -1) return;

    const todo = archivedTodos[index];
    delete todo.archivedAt;
    todo.completed = false;
    todos.unshift(todo);
    archivedTodos.splice(index, 1);

    saveTodos();
    renderTodos();
    renderArchive();
    updateTaskCount();
    updateBadges();

    showToast('Task restored');
}

function restoreFromTrash(id) {
    const index = trashedTodos.findIndex(t => t.id === id);
    if (index === -1) return;

    const todo = trashedTodos[index];
    delete todo.deletedAt;
    todos.unshift(todo);
    trashedTodos.splice(index, 1);

    saveTodos();
    renderTodos();
    renderTrash();
    updateTaskCount();
    updateBadges();

    showToast('Task restored');
}

function permanentlyDelete(id) {
    const index = trashedTodos.findIndex(t => t.id === id);
    if (index !== -1) {
        trashedTodos.splice(index, 1);
        saveTodos();
        renderTrash();
        updateBadges();
    }
}

function emptyTrashBin() {
    if (trashedTodos.length === 0) return;

    if (confirm('Permanently delete all items in trash?')) {
        trashedTodos = [];
        saveTodos();
        renderTrash();
        updateBadges();
        showToast('Trash emptied');
    }
}

function cleanupTrash() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    trashedTodos = trashedTodos.filter(todo => {
        return new Date(todo.deletedAt) > thirtyDaysAgo;
    });

    saveTodos();
}

function editTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    const todoElement = document.querySelector(`[data-id="${id}"]`);
    const textElement = todoElement.querySelector('.todo-text');
    const currentText = todo.text;

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
        if (e.key === 'Enter') input.blur();
        else if (e.key === 'Escape') {
            input.value = currentText;
            input.blur();
        }
    });
}

function archiveCompletedTodos() {
    const completedTodos = todos.filter(t => t.completed);

    if (completedTodos.length === 0) return;

    completedTodos.forEach(todo => {
        todo.archivedAt = new Date().toISOString();
        archivedTodos.unshift(todo);
    });

    todos = todos.filter(t => !t.completed);

    saveTodos();
    renderTodos();
    updateTaskCount();
    updateCategoryFilter();
    updateBadges();

    showToast(`${completedTodos.length} task(s) archived`);
    playSound('delete');
}

// ===================================
// Subtasks
// ===================================
function showSubtaskInput(todoId, containerElement) {
    const todo = todos.find(t => t.id === todoId);

    // BUG FIX: Don't allow adding subtasks to completed tasks
    if (todo && todo.completed) {
        showToast('Cannot add subtasks to completed task');
        return;
    }

    if (containerElement.querySelector('.subtask-input-wrapper')) return;

    const addBtn = containerElement.querySelector('.add-subtask-btn');

    const wrapper = document.createElement('div');
    wrapper.className = 'subtask-input-wrapper';
    wrapper.innerHTML = `
        <input type="text" class="subtask-input" placeholder="Enter subtask..." autofocus>
        <button class="subtask-input-btn save">Add</button>
        <button class="subtask-input-btn cancel">✕</button>
    `;

    addBtn.parentNode.insertBefore(wrapper, addBtn);

    const input = wrapper.querySelector('.subtask-input');
    const saveBtn = wrapper.querySelector('.save');
    const cancelBtn = wrapper.querySelector('.cancel');

    input.focus();

    function saveSubtask() {
        const text = input.value.trim();
        if (text) {
            addSubtaskToTodo(todoId, text);
        } else {
            wrapper.remove();
        }
    }

    function cancelInput() {
        wrapper.remove();
    }

    saveBtn.addEventListener('click', saveSubtask);
    cancelBtn.addEventListener('click', cancelInput);

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveSubtask();
        else if (e.key === 'Escape') cancelInput();
    });
}

function addSubtaskToTodo(todoId, text) {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;

    todo.subtasks.push({
        id: Date.now(),
        text: text,
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

function editSubtask(todoId, subtaskId) {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;

    const subtask = todo.subtasks.find(s => s.id === subtaskId);
    if (!subtask) return;

    const subtaskElement = document.querySelector(`[data-subtask-id="${subtaskId}"]`);
    const textElement = subtaskElement.querySelector('.subtask-text');
    const currentText = subtask.text;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'subtask-edit-input';
    input.value = currentText;

    textElement.replaceWith(input);
    input.focus();
    input.select();

    function saveEdit() {
        const newText = input.value.trim();
        if (newText && newText !== currentText) {
            subtask.text = newText;
            saveTodos();
        }
        renderTodos();
    }

    input.addEventListener('blur', saveEdit);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') input.blur();
        else if (e.key === 'Escape') {
            input.value = currentText;
            input.blur();
        }
    });
}

// ===================================
// Reminders
// ===================================
function checkReminders() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const currentDate = now.toISOString().split('T')[0];

    todos.forEach(todo => {
        if (!todo.completed && todo.reminderTime && todo.dueDate === currentDate) {
            if (todo.reminderTime === currentTime && !todo.reminded) {
                showNotification(todo);
                todo.reminded = true;
                saveTodos();
            }
        }
    });
}

function showNotification(todo) {
    if (Notification.permission === 'granted') {
        new Notification('Todo Reminder', {
            body: todo.text,
            icon: '✨',
            tag: `todo-${todo.id}`
        });
    }
}

function scheduleReminder(todo) {
    // Reminders are handled by the interval check
    showToast(`Reminder set for ${todo.reminderTime}`);
}

// ===================================
// Touch Gestures (Swipe)
// ===================================
function handleTouchStart(e, todoId) {
    touchStartX = e.touches[0].clientX;
    isSwiping = false;
}

function handleTouchMove(e, element) {
    if (!touchStartX) return;

    touchCurrentX = e.touches[0].clientX;
    const diff = touchCurrentX - touchStartX;

    if (Math.abs(diff) > 30) {
        isSwiping = true;
        element.classList.add('swiping');

        const swipeContent = element.querySelector('.swipe-content');
        const maxSwipe = 80;
        const swipeAmount = Math.max(-maxSwipe, Math.min(maxSwipe, diff));

        if (swipeContent) {
            swipeContent.style.transform = `translateX(${swipeAmount}px)`;
        }
    }
}

function handleTouchEnd(e, todoId, element) {
    if (!isSwiping) {
        touchStartX = 0;
        return;
    }

    const diff = touchCurrentX - touchStartX;
    const swipeContent = element.querySelector('.swipe-content');

    if (diff > 80) {
        // Swipe right - complete
        toggleTodo(todoId);
    } else if (diff < -80) {
        // Swipe left - delete
        deleteTodo(todoId);
    }

    // Reset
    element.classList.remove('swiping');
    if (swipeContent) {
        swipeContent.style.transform = '';
    }
    touchStartX = 0;
    touchCurrentX = 0;
    isSwiping = false;
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
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
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
    if (item) item.classList.remove('drag-over');
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

    const [removed] = todos.splice(draggedIndex, 1);
    todos.splice(dropIndex, 0, removed);

    saveTodos();
    renderTodos();

    dropTarget.classList.remove('drag-over');
}

// ===================================
// Filter & Sort Functions
// ===================================
function setFilter(filter) {
    currentFilter = filter;
    filterBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.filter === filter));
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

    // Sort
    filtered = sortTodos(filtered);

    return filtered;
}

function sortTodos(todosArray) {
    const sorted = [...todosArray];

    switch (currentSort) {
        case 'dueDate':
            sorted.sort((a, b) => {
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            });
            break;
        case 'priority':
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
            break;
        case 'alpha':
            sorted.sort((a, b) => a.text.localeCompare(b.text));
            break;
        case 'created':
        default:
            // Already in creation order (newest first)
            break;
    }

    return sorted;
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

function updateBadges() {
    archiveBadge.textContent = archivedTodos.length;
    trashBadge.textContent = trashedTodos.length;
}

// ===================================
// Export/Import
// ===================================
function exportTodos() {
    const data = {
        todos,
        archivedTodos,
        trashedTodos,
        exportDate: new Date().toISOString(),
        version: '3.0'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `todos-${new Date().toISOString().split('T')[0]}.json`;
    a.click();

    URL.revokeObjectURL(url);
    showToast('Todos exported!');
}

function importTodos(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);

            if (data.todos && Array.isArray(data.todos)) {
                const existingIds = new Set(todos.map(t => t.id));
                const newTodos = data.todos.filter(t => !existingIds.has(t.id));

                todos = [...newTodos, ...todos];

                if (data.archivedTodos) {
                    archivedTodos = [...data.archivedTodos, ...archivedTodos];
                }

                saveTodos();
                renderTodos();
                updateTaskCount();
                updateCategoryFilter();
                updateCategoryDatalist();
                updateBadges();

                showToast(`Imported ${newTodos.length} task(s)!`);
            } else {
                throw new Error('Invalid format');
            }
        } catch (err) {
            showToast('Failed to import. Invalid file.');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

// ===================================
// Toast Notifications
// ===================================
function showToast(message, showUndo = false, type = 'info') {
    toastContainer.querySelectorAll('.toast').forEach(toast => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    });

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        info: 'ℹ️',
        warning: '⚠️',
        success: '✅',
        error: '❌'
    };
    const icon = showUndo ? '↩️' : (icons[type] || 'ℹ️');

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${escapeHtml(message)}</span>
        ${showUndo ? '<button class="toast-undo">Undo</button>' : ''}
        <button class="toast-close">×</button>
    `;

    toastContainer.appendChild(toast);

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
        let dateText = formatDate(todo.dueDate);

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

    // Recurring badge
    let recurringHtml = '';
    if (todo.recurring) {
        const recurringLabels = { daily: '🔄 Daily', weekly: '🔄 Weekly', monthly: '🔄 Monthly' };
        recurringHtml = `<span class="recurring-badge">${recurringLabels[todo.recurring]}</span>`;
    }

    // Reminder badge
    let reminderHtml = '';
    if (todo.reminderTime) {
        reminderHtml = `<span class="reminder-badge">⏰ ${todo.reminderTime}</span>`;
    }

    // Subtasks HTML
    let subtasksHtml = '';
    const isCompleted = todo.completed;

    if (todo.subtasks && todo.subtasks.length > 0) {
        subtasksHtml = `
            <div class="subtasks-container">
                ${todo.subtasks.map(subtask => `
                    <div class="subtask-item ${subtask.completed ? 'completed' : ''}" data-subtask-id="${subtask.id}">
                        <input type="checkbox" class="subtask-checkbox" ${subtask.completed ? 'checked' : ''}>
                        <span class="subtask-text">${escapeHtml(subtask.text)}</span>
                        <button class="subtask-delete">×</button>
                    </div>
                `).join('')}
                <button class="add-subtask-btn ${isCompleted ? 'disabled' : ''}">+ Add subtask</button>
            </div>
        `;
    } else {
        subtasksHtml = `
            <div class="subtasks-container">
                <button class="add-subtask-btn ${isCompleted ? 'disabled' : ''}">+ Add subtask</button>
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
                ${recurringHtml}
                ${reminderHtml}
                ${todo.category ? `<span class="category-badge">${escapeHtml(todo.category)}</span>` : ''}
            </div>
            ${subtasksHtml}
        </div>
        <div class="todo-actions">
            <button class="todo-action-btn archive" title="Archive">📦</button>
            <button class="todo-action-btn delete" title="Delete">🗑️</button>
        </div>
    `;

    // Event Listeners
    const checkbox = li.querySelector('.todo-checkbox input');
    const textEl = li.querySelector('.todo-text');
    const subtasksContainer = li.querySelector('.subtasks-container');
    const addSubtaskBtn = li.querySelector('.add-subtask-btn');
    const deleteBtn = li.querySelector('.todo-action-btn.delete');
    const archiveBtn = li.querySelector('.todo-action-btn.archive');

    checkbox.addEventListener('click', (e) => {
        e.preventDefault();
        toggleTodo(todo.id);
    });
    textEl.addEventListener('dblclick', () => editTodo(todo.id));
    deleteBtn.addEventListener('click', () => deleteTodo(todo.id));
    archiveBtn.addEventListener('click', () => archiveTodo(todo.id));

    // Show subtasks if they exist
    if (todo.subtasks && todo.subtasks.length > 0) {
        subtasksContainer.style.display = 'block';
    }

    if (!isCompleted && addSubtaskBtn) {
        addSubtaskBtn.addEventListener('click', () => showSubtaskInput(todo.id, subtasksContainer));
    }

    // Subtask event listeners
    li.querySelectorAll('.subtask-item').forEach(item => {
        const subtaskId = parseInt(item.dataset.subtaskId);
        const subtaskCheckbox = item.querySelector('.subtask-checkbox');
        const subtaskDelete = item.querySelector('.subtask-delete');
        const subtaskText = item.querySelector('.subtask-text');

        subtaskCheckbox.addEventListener('change', () => toggleSubtask(todo.id, subtaskId));
        subtaskDelete.addEventListener('click', () => deleteSubtask(todo.id, subtaskId));
        subtaskText.addEventListener('dblclick', () => editSubtask(todo.id, subtaskId));
    });

    // Touch gestures
    li.addEventListener('touchstart', (e) => handleTouchStart(e, todo.id), { passive: true });
    li.addEventListener('touchmove', (e) => handleTouchMove(e, li), { passive: true });
    li.addEventListener('touchend', (e) => handleTouchEnd(e, todo.id, li));

    // Drag and drop
    li.addEventListener('dragstart', handleDragStart);
    li.addEventListener('dragend', handleDragEnd);
    li.addEventListener('dragover', handleDragOver);
    li.addEventListener('dragleave', handleDragLeave);
    li.addEventListener('drop', handleDrop);

    return li;
}

function renderArchive() {
    archiveList.innerHTML = '';

    if (archivedTodos.length === 0) {
        archiveEmpty.classList.add('visible');
        archiveList.style.display = 'none';
    } else {
        archiveEmpty.classList.remove('visible');
        archiveList.style.display = 'flex';

        archivedTodos.forEach(todo => {
            const li = document.createElement('li');
            li.className = 'archive-item';
            li.innerHTML = `
                <span class="archive-item-text">${escapeHtml(todo.text)}</span>
                <span class="archive-item-date">${formatDate(todo.archivedAt)}</span>
                <button class="restore-btn">Restore</button>
            `;

            li.querySelector('.restore-btn').addEventListener('click', () => restoreFromArchive(todo.id));
            archiveList.appendChild(li);
        });
    }
}

function renderTrash() {
    trashList.innerHTML = '';

    if (trashedTodos.length === 0) {
        trashEmpty.classList.add('visible');
        trashList.style.display = 'none';
    } else {
        trashEmpty.classList.remove('visible');
        trashList.style.display = 'flex';

        trashedTodos.forEach(todo => {
            const li = document.createElement('li');
            li.className = 'trash-item';
            li.innerHTML = `
                <span class="trash-item-text">${escapeHtml(todo.text)}</span>
                <span class="trash-item-date">${formatDate(todo.deletedAt)}</span>
                <button class="restore-btn">Restore</button>
                <button class="delete-permanent-btn">Delete</button>
            `;

            li.querySelector('.restore-btn').addEventListener('click', () => restoreFromTrash(todo.id));
            li.querySelector('.delete-permanent-btn').addEventListener('click', () => permanentlyDelete(todo.id));
            trashList.appendChild(li);
        });
    }
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

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ===================================
// Start App
// ===================================
document.addEventListener('DOMContentLoaded', init);
