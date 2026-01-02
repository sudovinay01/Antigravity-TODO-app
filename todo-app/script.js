// ===================================
// Todo App - JavaScript
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

// State
let todos = [];
let currentFilter = 'all';

// ===================================
// Initialize App
// ===================================
function init() {
    loadTodos();
    loadTheme();
    renderTodos();
    updateTaskCount();
    
    // Event Listeners
    addBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });
    clearCompleted.addEventListener('click', clearCompletedTodos);
    themeToggle.addEventListener('click', toggleTheme);
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            setFilter(btn.dataset.filter);
        });
    });
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
    
    // Add a little animation feedback
    themeToggle.style.transform = 'scale(0.9)';
    setTimeout(() => {
        themeToggle.style.transform = 'scale(1)';
    }, 150);
}

// ===================================
// Todo CRUD Functions
// ===================================
function loadTodos() {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
        todos = JSON.parse(savedTodos);
    }
}

function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

function addTodo() {
    const text = todoInput.value.trim();
    
    if (!text) {
        // Shake animation for empty input
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
        createdAt: new Date().toISOString()
    };
    
    todos.unshift(todo);
    saveTodos();
    renderTodos();
    updateTaskCount();
    
    todoInput.value = '';
    todoInput.focus();
}

function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos();
        renderTodos();
        updateTaskCount();
    }
}

function deleteTodo(id) {
    const todoElement = document.querySelector(`[data-id="${id}"]`);
    
    if (todoElement) {
        // Animate out
        todoElement.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => {
            todos = todos.filter(t => t.id !== id);
            saveTodos();
            renderTodos();
            updateTaskCount();
        }, 280);
    }
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
    }, completedItems.length * 50 + 280);
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

function getFilteredTodos() {
    switch (currentFilter) {
        case 'active':
            return todos.filter(t => !t.completed);
        case 'completed':
            return todos.filter(t => t.completed);
        default:
            return todos;
    }
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
            li.style.animationDelay = `${index * 0.05}s`;
            todoList.appendChild(li);
        });
    }
}

function createTodoElement(todo) {
    const li = document.createElement('li');
    li.className = `todo-item${todo.completed ? ' completed' : ''}`;
    li.setAttribute('data-id', todo.id);
    
    li.innerHTML = `
        <label class="todo-checkbox">
            <input type="checkbox" ${todo.completed ? 'checked' : ''}>
            <span class="checkmark"></span>
        </label>
        <span class="todo-text">${escapeHtml(todo.text)}</span>
        <button class="delete-btn" aria-label="Delete todo">×</button>
    `;
    
    // Event Listeners
    const checkbox = li.querySelector('input[type="checkbox"]');
    const deleteBtn = li.querySelector('.delete-btn');
    
    checkbox.addEventListener('change', () => toggleTodo(todo.id));
    deleteBtn.addEventListener('click', () => deleteTodo(todo.id));
    
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

// Add CSS for shake and slideOut animations dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    
    @keyframes slideOut {
        to {
            opacity: 0;
            transform: translateX(20px);
        }
    }
`;
document.head.appendChild(style);

// ===================================
// Start App
// ===================================
document.addEventListener('DOMContentLoaded', init);
