const defaultApiUrl = 'http://localhost:4000/api';
const apiUrlInput = document.getElementById('serverUrl');
const authView = document.getElementById('authView');
const appView = document.getElementById('appView');
const message = document.getElementById('message');
const authForm = document.getElementById('authForm');
const fullNameField = document.getElementById('fullNameField');
const authTitle = document.getElementById('authTitle');
const authSubmit = document.getElementById('authSubmit');
const authToggle = document.getElementById('authToggle');
const pairingCode = document.getElementById('pairingCode');
const pairingExpiry = document.getElementById('pairingExpiry');

apiUrlInput.value = localStorage.getItem('pb_api_url') || defaultApiUrl;
let token = localStorage.getItem('pb_token') || '';
let authMode = 'login';

function getApiUrl() {
  return apiUrlInput.value.trim().replace(/\/+$/, '');
}

function setMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle('error', isError);
  message.hidden = !text;
}

async function request(endpoint, options = {}) {
  const headers = { Accept: 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${getApiUrl()}${endpoint}`, {
    ...options,
    headers
  });
  const responseText = await response.text();
  const data = responseText ? JSON.parse(responseText) : null;
  if (!response.ok) {
    throw new Error(data?.error?.message || `Request failed (${response.status})`);
  }
  return data;
}

function updateAuthView() {
  authView.hidden = Boolean(token);
  appView.hidden = !token;
  if (token) showTab('inbox');
}

function setAuthMode(mode) {
  authMode = mode;
  const registering = mode === 'register';
  fullNameField.hidden = !registering;
  document.getElementById('fullName').required = registering;
  authTitle.textContent = registering ? 'Create your desktop account' : 'Sign in to PocketBridge';
  authSubmit.textContent = registering ? 'Register' : 'Sign in';
  authToggle.textContent = registering ? 'Already have an account? Sign in' : 'Need an account? Register';
}

function showTab(tabName) {
  document.querySelectorAll('[data-tab]').forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === tabName);
  });
  document.querySelectorAll('[data-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.panel !== tabName;
  });

  if (tabName === 'inbox') loadFiles();
  if (tabName === 'notes') loadNotesAndTasks();
}

function renderMessageRow(tbody, text, colSpan = 4) {
  const row = document.createElement('tr');
  const cell = document.createElement('td');
  cell.colSpan = colSpan;
  cell.textContent = text;
  row.append(cell);
  tbody.replaceChildren(row);
}

async function loadFiles() {
  const tbody = document.getElementById('fileBody');
  renderMessageRow(tbody, 'Loading files...');
  try {
    const files = await request('/files');
    if (!Array.isArray(files)) throw new Error('The server returned an invalid file list');
    if (!files.length) {
      renderMessageRow(tbody, 'No files received yet.');
      return;
    }

    const rows = files.map((file) => {
      const row = document.createElement('tr');
      const name = document.createElement('td');
      const size = document.createElement('td');
      const source = document.createElement('td');
      const actions = document.createElement('td');
      const download = document.createElement('button');

      name.textContent = file.original_name;
      size.textContent = `${(Number(file.size_bytes) / 1024).toFixed(1)} KB`;
      source.textContent = file.source_device_name || 'Mobile';
      download.className = 'btn';
      download.textContent = 'Download';
      download.addEventListener('click', () => downloadFile(file));
      actions.append(download);
      row.append(name, size, source, actions);
      return row;
    });
    tbody.replaceChildren(...rows);
  } catch (error) {
    renderMessageRow(tbody, `Error loading files: ${error.message}`);
  }
}

async function downloadFile(file) {
  try {
    const response = await fetch(`${getApiUrl()}/files/${encodeURIComponent(file.file_id)}/download`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      const responseText = await response.text();
      const data = responseText ? JSON.parse(responseText) : null;
      throw new Error(data?.error?.message || `Download failed (${response.status})`);
    }

    const blobUrl = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = file.original_name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch (error) {
    setMessage(error.message, true);
  }
}

async function generatePairingCode() {
  setMessage('');
  try {
    const data = await request('/pairings', {
      method: 'POST',
      body: JSON.stringify({ serverUrl: getApiUrl() })
    });
    pairingCode.textContent = data.code;
    pairingExpiry.textContent = `Expires ${new Date(data.expiresAt).toLocaleTimeString()}`;
  } catch (error) {
    setMessage(error.message, true);
  }
}

async function loadNotesAndTasks() {
  const notesList = document.getElementById('notesList');
  const tasksList = document.getElementById('tasksList');
  notesList.replaceChildren();
  tasksList.replaceChildren();
  try {
    const [notes, tasks] = await Promise.all([
      request('/notes'),
      request('/tasks')
    ]);

    for (const note of notes) {
      const item = document.createElement('li');
      item.textContent = `${note.title}: ${note.body}`;
      notesList.append(item);
    }
    if (!notes.length) notesList.textContent = 'No notes yet.';

    for (const task of tasks) {
      const item = document.createElement('li');
      item.textContent = `[${task.status}] ${task.title}`;
      tasksList.append(item);
    }
    if (!tasks.length) tasksList.textContent = 'No tasks yet.';
  } catch (error) {
    setMessage(error.message, true);
  }
}

authForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setMessage('');
  localStorage.setItem('pb_api_url', getApiUrl());
  authSubmit.disabled = true;
  try {
    const registering = authMode === 'register';
    const data = await request(`/auth/${registering ? 'register' : 'login'}`, {
      method: 'POST',
      body: JSON.stringify({
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value,
        ...(registering ? { fullName: document.getElementById('fullName').value.trim() } : {}),
        deviceName: 'Desktop Client',
        platform: 'desktop'
      })
    });
    token = data.token;
    localStorage.setItem('pb_token', token);
    updateAuthView();
  } catch (error) {
    setMessage(error.message, true);
  } finally {
    authSubmit.disabled = false;
  }
});

authToggle.addEventListener('click', () => {
  setAuthMode(authMode === 'login' ? 'register' : 'login');
});

document.querySelectorAll('[data-tab]').forEach((button) => {
  button.addEventListener('click', () => showTab(button.dataset.tab));
});

document.getElementById('generatePairing').addEventListener('click', generatePairingCode);
document.getElementById('refreshFiles').addEventListener('click', loadFiles);
document.getElementById('logout').addEventListener('click', () => {
  token = '';
  localStorage.removeItem('pb_token');
  pairingCode.textContent = '';
  pairingExpiry.textContent = '';
  setMessage('');
  updateAuthView();
});

updateAuthView();
