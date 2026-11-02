let config = {};

async function init() {
    try {
        const response = await fetch('config.json');
        config = await response.json();
        await fetchTasks();
    } catch (error) {
        showStatus('Failed to load config.json', true);
    }
}

function showStatus(message, isError = false) {
    const statusEl = document.getElementById('status-message');
    statusEl.textContent = message;
    statusEl.style.color = isError ? 'red' : 'green';
    setTimeout(() => statusEl.textContent = '', 3000);
}

function getHeaders() {
    return {
        'apikey': config.supabasePublishableKey,
        'Authorization': `Bearer ${config.supabasePublishableKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };
}

async function fetchTasks() {
    try {
        const res = await fetch(`${config.supabaseUrl}/rest/v1/${config.tableName}?select=*&order=id.asc`, {
            method: 'GET',
            headers: getHeaders()
        });
        const tasks = await res.json();
        renderTasks(tasks);
    } catch (error) {
        showStatus('Failed to fetch tasks', true);
    }
}

function renderTasks(tasks) {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';
    
    tasks.forEach(task => {
        const div = document.createElement('div');
        div.className = 'task-item';
        div.setAttribute('data-id', task.id);
        
        const title = document.createElement('h3');
        title.className = 'task-title';
        title.textContent = task.title;
        if (task.completed) title.style.textDecoration = 'line-through';
        
        const desc = document.createElement('p');
        desc.className = 'task-description';
        desc.textContent = task.description || '';
        
        const status = document.createElement('p');
        status.className = 'task-status';
        status.textContent = task.completed ? 'Completed' : 'Incomplete';
        
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'toggle-task';
        toggleBtn.textContent = task.completed ? 'Mark Incomplete' : 'Mark Complete';
        toggleBtn.onclick = () => toggleTask(task);
        
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-task';
        editBtn.textContent = 'Edit';
        editBtn.onclick = () => editTask(task);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-task';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => deleteTask(task.id);
        
        div.append(title, desc, status, toggleBtn, editBtn, deleteBtn);
        taskList.appendChild(div);
    });
}

document.getElementById('task-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('task-id').value;
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-description').value;
    const taskData = { title, description };
    
    try {
        if (id) {
            await fetch(`${config.supabaseUrl}/rest/v1/${config.tableName}?id=eq.${id}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify(taskData)
            });
            showStatus('Task updated successfully');
        } else {
            await fetch(`${config.supabaseUrl}/rest/v1/${config.tableName}`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(taskData)
            });
            showStatus('Task created successfully');
        }
        document.getElementById('task-form').reset();
        document.getElementById('task-id').value = '';
        await fetchTasks();
    } catch (error) {
        showStatus('Operation failed', true);
    }
});

async function toggleTask(task) {
    await fetch(`${config.supabaseUrl}/rest/v1/${config.tableName}?id=eq.${task.id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ completed: !task.completed })
    });
    await fetchTasks();
}

async function deleteTask(id) {
    await fetch(`${config.supabaseUrl}/rest/v1/${config.tableName}?id=eq.${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    await fetchTasks();
}

function editTask(task) {
    document.getElementById('task-id').value = task.id;
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-description').value = task.description || '';
}

init();
