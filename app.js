// ===== SCAI - Sistema de Control de Asistencias Inteligente =====
// Prototipo funcional con localStorage

// ===== DEFAULT DATA =====
const DEFAULT_USERS = [
    { username: 'admin', password: 'admin123', role: 'admin', name: 'Administrador' },
    { username: 'maestro1', password: 'pass123', role: 'maestro', name: 'Janeth Caballero Piña' },
    { username: 'maestro2', password: 'pass123', role: 'maestro', name: 'Uriel A. Romero Rodríguez' }
];

const DEFAULT_GROUPS = [
    { id: 'g1', name: 'DS02SM-24' },
    { id: 'g2', name: 'DS01SM-24' }
];

const DEFAULT_STUDENTS = [
    // Grupo DS02SM-24
    { id: 'MAT001', name: 'García López, Ana María', groupId: 'g1' },
    { id: 'MAT002', name: 'Hernández Ruiz, Carlos Eduardo', groupId: 'g1' },
    { id: 'MAT003', name: 'Martínez Flores, Diana Paola', groupId: 'g1' },
    { id: 'MAT004', name: 'Rodríguez Sánchez, José Luis', groupId: 'g1' },
    { id: 'MAT005', name: 'López Torres, María Fernanda', groupId: 'g1' },
    // Grupo DS01SM-24
    { id: 'MAT006', name: 'Pérez Gómez, Roberto', groupId: 'g2' },
    { id: 'MAT007', name: 'Ramírez Díaz, Lucía', groupId: 'g2' },
    { id: 'MAT008', name: 'Jiménez Morales, Pedro Alberto', groupId: 'g2' },
    { id: 'MAT009', name: 'Castro Vega, Sofía', groupId: 'g2' },
    { id: 'MAT010', name: 'Mendoza Cruz, Andrés', groupId: 'g2' }
];

// ===== STATE =====
let currentUser = null;
let pinSession = null;
let pinTimerInterval = null;

// ===== STORAGE HELPERS =====
function getData(key, defaultVal) {
    const d = localStorage.getItem('scai_' + key);
    return d ? JSON.parse(d) : defaultVal;
}
function setData(key, val) {
    localStorage.setItem('scai_' + key, JSON.stringify(val));
}

// Initialize data if first run
function initData() {
    if (!localStorage.getItem('scai_initialized')) {
        setData('users', DEFAULT_USERS);
        setData('groups', DEFAULT_GROUPS);
        setData('students', DEFAULT_STUDENTS);
        setData('records', []);
        localStorage.setItem('scai_initialized', 'true');
    }
}

// ===== UTILITY =====
function getToday() {
    return new Date().toISOString().split('T')[0];
}
function getNow() {
    return new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}
function generatePin() {
    return String(Math.floor(1000 + Math.random() * 9000));
}

// ===== TOAST =====
function showToast(msg) {
    const t = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = msg;
    t.classList.remove('hidden');
    t.classList.add('show');
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.classList.add('hidden'), 300); }, 2500);
}

// ===== NAVIGATION =====
function hideAllScreens() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
}

function navigateTo(screen) {
    hideAllScreens();
    const navbar = document.getElementById('navbar');

    if (screen === 'login') {
        document.getElementById('loginScreen').classList.add('active');
        navbar.classList.add('hidden');
        return;
    }
    if (screen === 'studentPin') {
        document.getElementById('studentPinScreen').classList.add('active');
        navbar.classList.add('hidden');
        return;
    }

    navbar.classList.remove('hidden');
    const screenMap = {
        'dashboard': 'dashboardScreen',
        'attendance': 'attendanceScreen',
        'pin': 'pinScreen',
        'history': 'historyScreen',
        'reports': 'reportsScreen',
        'admin': 'adminScreen'
    };

    const targetId = screenMap[screen];
    if (targetId) {
        document.getElementById(targetId).classList.add('active');
    }

    // Update nav active state
    document.querySelectorAll('.nav-links button').forEach(b => b.classList.remove('active'));
    const navBtn = document.querySelector(`.nav-links button[data-screen="${screen}"]`);
    if (navBtn) navBtn.classList.add('active');

    // Load data for specific screens
    if (screen === 'dashboard') refreshDashboard();
    if (screen === 'attendance') setupAttendance();
    if (screen === 'pin') setupPin();
    if (screen === 'history') setupHistory();
    if (screen === 'reports') setupReports();
    if (screen === 'admin') refreshAdmin();
}

// ===== AUTH =====
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value;
    const users = getData('users', []);
    const found = users.find(u => u.username === user && u.password === pass);

    if (found) {
        currentUser = found;
        document.getElementById('loginError').classList.add('hidden');
        setupNav();
        navigateTo('dashboard');
    } else {
        document.getElementById('loginError').classList.remove('hidden');
    }
});

document.getElementById('logoutBtn').addEventListener('click', function() {
    currentUser = null;
    if (pinTimerInterval) clearInterval(pinTimerInterval);
    pinSession = null;
    document.getElementById('loginUser').value = '';
    document.getElementById('loginPass').value = '';
    navigateTo('login');
});

// ===== SETUP NAV =====
function setupNav() {
    const links = document.getElementById('navLinks');
    document.getElementById('navUserName').textContent = currentUser.name;

    let items = [];
    if (currentUser.role === 'admin') {
        items = [
            { screen: 'dashboard', label: '📊 Dashboard' },
            { screen: 'attendance', label: '✅ Asistencia' },
            { screen: 'pin', label: '🔑 PIN' },
            { screen: 'history', label: '📜 Historial' },
            { screen: 'reports', label: '📈 Reportes' },
            { screen: 'admin', label: '⚙️ Admin' }
        ];
    } else {
        items = [
            { screen: 'dashboard', label: '📊 Dashboard' },
            { screen: 'attendance', label: '✅ Asistencia' },
            { screen: 'pin', label: '🔑 PIN' },
            { screen: 'history', label: '📜 Historial' },
            { screen: 'reports', label: '📈 Reportes' }
        ];
    }

    links.innerHTML = items.map(i =>
        `<button data-screen="${i.screen}" onclick="navigateTo('${i.screen}')">${i.label}</button>`
    ).join('');
}

// ===== POPULATE SELECTS =====
function populateGroupSelect(selectId, includeAll = false) {
    const sel = document.getElementById(selectId);
    const groups = getData('groups', []);
    sel.innerHTML = (includeAll ? '<option value="">Todos</option>' : '') +
        groups.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
}

// ===== DASHBOARD =====
function refreshDashboard() {
    const groups = getData('groups', []);
    const students = getData('students', []);
    const records = getData('records', []);
    const today = getToday();
    const todayRecords = records.filter(r => r.date === today);

    document.getElementById('statGroups').textContent = groups.length;
    document.getElementById('statStudents').textContent = students.length;
    document.getElementById('statToday').textContent = todayRecords.length;
    document.getElementById('statSession').textContent = pinSession ? pinSession.pin : '—';
}

// ===== ATTENDANCE (MANUAL) =====
function setupAttendance() {
    populateGroupSelect('attGroup');
    document.getElementById('attDate').value = getToday();
}

function loadAttendanceList() {
    const groupId = document.getElementById('attGroup').value;
    const date = document.getElementById('attDate').value;
    if (!groupId || !date) { showToast('Selecciona grupo y fecha'); return; }

    const students = getData('students', []).filter(s => s.groupId === groupId);
    const records = getData('records', []);
    const container = document.getElementById('attendanceList');

    if (students.length === 0) {
        container.innerHTML = '<p class="empty-state">No hay alumnos en este grupo</p>';
        document.getElementById('attendanceActions').classList.add('hidden');
        return;
    }

    container.innerHTML = students.map((s, i) => {
        // Check existing record
        const existing = records.find(r => r.studentId === s.id && r.date === date);
        const status = existing ? existing.status : '';
        return `
            <div class="att-row" data-student="${s.id}">
                <span class="att-num">${i + 1}</span>
                <span class="att-name">${s.name}</span>
                <span class="att-id">${s.id}</span>
                <div class="att-buttons">
                    <button class="att-btn ${status === 'P' ? 'selected-p' : ''}" onclick="setStatus(this, '${s.id}', 'P')">Presente</button>
                    <button class="att-btn ${status === 'R' ? 'selected-r' : ''}" onclick="setStatus(this, '${s.id}', 'R')">Retardo</button>
                    <button class="att-btn ${status === 'F' ? 'selected-f' : ''}" onclick="setStatus(this, '${s.id}', 'F')">Falta</button>
                </div>
            </div>`;
    }).join('');

    document.getElementById('attendanceActions').classList.remove('hidden');
}

function setStatus(btn, studentId, status) {
    const row = btn.closest('.att-row');
    row.querySelectorAll('.att-btn').forEach(b => b.className = 'att-btn');
    btn.classList.add('att-btn', `selected-${status.toLowerCase()}`);
    row.dataset.status = status;
}

function markAllPresent() {
    document.querySelectorAll('.att-row').forEach(row => {
        const btn = row.querySelector('.att-btn');
        row.querySelectorAll('.att-btn').forEach(b => b.className = 'att-btn');
        btn.classList.add('selected-p');
        row.dataset.status = 'P';
    });
    showToast('Todos marcados como presente');
}

function saveAttendance() {
    const date = document.getElementById('attDate').value;
    const groupId = document.getElementById('attGroup').value;
    const rows = document.querySelectorAll('.att-row');
    let records = getData('records', []);
    let saved = 0;

    rows.forEach(row => {
        const studentId = row.dataset.student;
        const status = row.dataset.status;
        if (!status) return;

        // Remove existing record for same student/date
        records = records.filter(r => !(r.studentId === studentId && r.date === date));

        records.push({
            studentId,
            date,
            groupId,
            status,
            time: getNow(),
            method: 'manual',
            registeredBy: currentUser.username
        });
        saved++;
    });

    if (saved === 0) {
        showToast('No se marcó ningún alumno');
        return;
    }

    setData('records', records);
    showToast(`✅ ${saved} registros guardados`);
    refreshDashboard();
}

// ===== PIN SESSION =====
function setupPin() {
    populateGroupSelect('pinGroup');
    if (pinSession) {
        showPinSession();
    } else {
        document.getElementById('pinDisplay').classList.add('hidden');
        document.getElementById('pinStudentsList').classList.add('hidden');
        document.getElementById('btnCreatePin').disabled = false;
    }
}

function createPinSession() {
    const groupId = document.getElementById('pinGroup').value;
    const duration = parseInt(document.getElementById('pinDuration').value);
    const groups = getData('groups', []);
    const group = groups.find(g => g.id === groupId);

    if (!group) { showToast('Selecciona un grupo'); return; }

    pinSession = {
        pin: generatePin(),
        groupId,
        groupName: group.name,
        startTime: Date.now(),
        duration: duration * 60 * 1000,
        registered: []
    };

    showPinSession();
    showToast(`🔑 Sesión PIN creada: ${pinSession.pin}`);
}

function showPinSession() {
    document.getElementById('pinDisplay').classList.remove('hidden');
    document.getElementById('pinStudentsList').classList.remove('hidden');
    document.getElementById('btnCreatePin').disabled = true;
    document.getElementById('pinCode').textContent = pinSession.pin;
    document.getElementById('pinGroupName').textContent = pinSession.groupName;
    updatePinCount();
    startPinTimer();
}

function startPinTimer() {
    if (pinTimerInterval) clearInterval(pinTimerInterval);
    pinTimerInterval = setInterval(() => {
        if (!pinSession) { clearInterval(pinTimerInterval); return; }
        const elapsed = Date.now() - pinSession.startTime;
        const remaining = Math.max(0, pinSession.duration - elapsed);

        if (remaining <= 0) {
            closePinSession();
            showToast('⏰ La sesión PIN ha expirado');
            return;
        }

        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        document.getElementById('pinTimer').textContent =
            `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }, 1000);
}

function updatePinCount() {
    if (!pinSession) return;
    document.getElementById('pinCount').textContent = pinSession.registered.length;
    const body = document.getElementById('pinStudentsBody');
    body.innerHTML = pinSession.registered.map((r, i) =>
        `<tr><td>${i + 1}</td><td>${r.studentId}</td><td>${r.studentName}</td><td>${r.time}</td></tr>`
    ).join('');
}

function closePinSession() {
    if (pinSession && pinSession.registered.length > 0) {
        // Save all registered students as Present
        let records = getData('records', []);
        const date = getToday();
        pinSession.registered.forEach(r => {
            records = records.filter(rec => !(rec.studentId === r.studentId && rec.date === date));
            records.push({
                studentId: r.studentId,
                date,
                groupId: pinSession.groupId,
                status: 'P',
                time: r.time,
                method: 'pin',
                registeredBy: 'PIN: ' + pinSession.pin
            });
        });

        // Mark absent those who didn't register
        const students = getData('students', []).filter(s => s.groupId === pinSession.groupId);
        students.forEach(s => {
            if (!pinSession.registered.find(r => r.studentId === s.id)) {
                const alreadyRecorded = records.find(rec => rec.studentId === s.id && rec.date === date);
                if (!alreadyRecorded) {
                    records.push({
                        studentId: s.id,
                        date,
                        groupId: pinSession.groupId,
                        status: 'F',
                        time: getNow(),
                        method: 'pin-auto',
                        registeredBy: 'Sistema (no registrado)'
                    });
                }
            }
        });

        setData('records', records);
        showToast(`💾 Asistencia guardada para ${pinSession.registered.length} alumnos`);
    }

    if (pinTimerInterval) clearInterval(pinTimerInterval);
    pinSession = null;
    document.getElementById('pinDisplay').classList.add('hidden');
    document.getElementById('pinStudentsList').classList.add('hidden');
    document.getElementById('btnCreatePin').disabled = false;
    document.getElementById('pinStudentsBody').innerHTML = '';
}

// ===== STUDENT PIN REGISTRATION =====
document.getElementById('studentPinForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const studentId = document.getElementById('studentId').value.trim().toUpperCase();
    const pin = document.getElementById('studentPin').value.trim();
    const errorEl = document.getElementById('studentPinError');
    const successEl = document.getElementById('studentPinSuccess');
    errorEl.classList.add('hidden');
    successEl.classList.add('hidden');

    // Validate PIN session exists
    if (!pinSession) {
        errorEl.textContent = 'No hay ninguna sesión activa en este momento';
        errorEl.classList.remove('hidden');
        return;
    }

    // Validate PIN
    if (pin !== pinSession.pin) {
        errorEl.textContent = 'Código PIN incorrecto';
        errorEl.classList.remove('hidden');
        return;
    }

    // Check session not expired
    const elapsed = Date.now() - pinSession.startTime;
    if (elapsed > pinSession.duration) {
        errorEl.textContent = 'La sesión PIN ha expirado';
        errorEl.classList.remove('hidden');
        return;
    }

    // Validate student exists in the group
    const students = getData('students', []);
    const student = students.find(s => s.id === studentId && s.groupId === pinSession.groupId);
    if (!student) {
        errorEl.textContent = 'Matrícula no encontrada en el grupo ' + pinSession.groupName;
        errorEl.classList.remove('hidden');
        return;
    }

    // Check not already registered
    if (pinSession.registered.find(r => r.studentId === studentId)) {
        errorEl.textContent = 'Ya registraste tu asistencia';
        errorEl.classList.remove('hidden');
        return;
    }

    // Register!
    pinSession.registered.push({
        studentId,
        studentName: student.name,
        time: getNow()
    });

    successEl.textContent = `✅ ¡Asistencia registrada! Bienvenido/a, ${student.name}`;
    successEl.classList.remove('hidden');
    document.getElementById('studentId').value = '';
    document.getElementById('studentPin').value = '';

    // Update teacher view
    updatePinCount();
});

// ===== HISTORY =====
function setupHistory() {
    populateGroupSelect('histGroup', true);
    document.getElementById('histDateFrom').value = getToday();
    document.getElementById('histDateTo').value = getToday();
}

function loadHistory() {
    const groupId = document.getElementById('histGroup').value;
    const from = document.getElementById('histDateFrom').value;
    const to = document.getElementById('histDateTo').value;
    let records = getData('records', []);
    const students = getData('students', []);
    const groups = getData('groups', []);

    // Filter
    if (groupId) records = records.filter(r => r.groupId === groupId);
    if (from) records = records.filter(r => r.date >= from);
    if (to) records = records.filter(r => r.date <= to);

    const container = document.getElementById('historyResults');
    if (records.length === 0) {
        container.innerHTML = '<p class="empty-state">No se encontraron registros</p>';
        return;
    }

    // Sort by date desc, then name
    records.sort((a, b) => b.date.localeCompare(a.date) || a.studentId.localeCompare(b.studentId));

    const statusBadge = (s) => {
        const labels = { P: 'Presente', R: 'Retardo', F: 'Falta' };
        return `<span class="badge badge-${s.toLowerCase()}">${labels[s] || s}</span>`;
    };

    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr><th>Fecha</th><th>Matrícula</th><th>Alumno</th><th>Grupo</th><th>Estado</th><th>Hora</th><th>Método</th></tr>
            </thead>
            <tbody>
                ${records.map(r => {
                    const student = students.find(s => s.id === r.studentId);
                    const group = groups.find(g => g.id === r.groupId);
                    return `<tr>
                        <td>${r.date}</td>
                        <td>${r.studentId}</td>
                        <td>${student ? student.name : '—'}</td>
                        <td>${group ? group.name : '—'}</td>
                        <td>${statusBadge(r.status)}</td>
                        <td>${r.time}</td>
                        <td>${r.method === 'manual' ? '📝 Manual' : '🔑 PIN'}</td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>`;
}

// ===== REPORTS =====
function setupReports() {
    populateGroupSelect('repGroup');
}

function generateReport() {
    const groupId = document.getElementById('repGroup').value;
    if (!groupId) { showToast('Selecciona un grupo'); return; }

    const groups = getData('groups', []);
    const students = getData('students', []).filter(s => s.groupId === groupId);
    const records = getData('records', []).filter(r => r.groupId === groupId);
    const group = groups.find(g => g.id === groupId);

    if (students.length === 0) {
        document.getElementById('reportResults').innerHTML = '<p class="empty-state">No hay alumnos en este grupo</p>';
        return;
    }

    // Get unique dates
    const dates = [...new Set(records.map(r => r.date))].sort();
    const totalDays = dates.length;

    if (totalDays === 0) {
        document.getElementById('reportResults').innerHTML = '<p class="empty-state">No hay registros de asistencia para este grupo</p>';
        return;
    }

    // Stats per student
    const stats = students.map(s => {
        const studentRecords = records.filter(r => r.studentId === s.id);
        const present = studentRecords.filter(r => r.status === 'P').length;
        const late = studentRecords.filter(r => r.status === 'R').length;
        const absent = studentRecords.filter(r => r.status === 'F').length;
        const pct = totalDays > 0 ? Math.round(((present + late * 0.5) / totalDays) * 100) : 0;
        return { ...s, present, late, absent, pct };
    });

    // Group totals
    const totalPresent = stats.reduce((a, s) => a + s.present, 0);
    const totalLate = stats.reduce((a, s) => a + s.late, 0);
    const totalAbsent = stats.reduce((a, s) => a + s.absent, 0);
    const avgPct = Math.round(stats.reduce((a, s) => a + s.pct, 0) / stats.length);

    document.getElementById('reportResults').innerHTML = `
        <div class="report-summary">
            <div class="report-stat">
                <span class="stat-value">${group.name}</span>
                <span class="stat-label">Grupo</span>
            </div>
            <div class="report-stat">
                <span class="stat-value">${totalDays}</span>
                <span class="stat-label">Días Registrados</span>
            </div>
            <div class="report-stat">
                <span class="stat-value" style="color:var(--success)">${avgPct}%</span>
                <span class="stat-label">Asistencia Promedio</span>
            </div>
            <div class="report-stat">
                <span class="stat-value">${students.length}</span>
                <span class="stat-label">Alumnos</span>
            </div>
        </div>
        <table class="data-table" id="reportTable">
            <thead>
                <tr>
                    <th>#</th><th>Matrícula</th><th>Alumno</th>
                    <th>Presentes</th><th>Retardos</th><th>Faltas</th><th>% Asistencia</th>
                </tr>
            </thead>
            <tbody>
                ${stats.map((s, i) => `
                    <tr>
                        <td>${i + 1}</td>
                        <td>${s.id}</td>
                        <td>${s.name}</td>
                        <td style="color:var(--success)">${s.present}</td>
                        <td style="color:var(--warning)">${s.late}</td>
                        <td style="color:var(--danger)">${s.absent}</td>
                        <td><strong>${s.pct}%</strong></td>
                    </tr>`).join('')}
            </tbody>
        </table>`;
}

function exportCSV() {
    const table = document.getElementById('reportTable');
    if (!table) { showToast('Genera un reporte primero'); return; }

    let csv = [];
    const rows = table.querySelectorAll('tr');
    rows.forEach(row => {
        const cols = row.querySelectorAll('th, td');
        const rowData = Array.from(cols).map(c => '"' + c.textContent.trim() + '"');
        csv.push(rowData.join(','));
    });

    const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reporte_asistencia_${getToday()}.csv`;
    link.click();
    showToast('📥 CSV descargado');
}

// ===== ADMIN =====
function switchAdminTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`admin${capitalize(tab)}Tab`).classList.add('active');
    event.target.classList.add('active');
    refreshAdmin();
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function refreshAdmin() {
    refreshAdminGroups();
    refreshAdminStudents();
    refreshAdminUsers();
}

function refreshAdminGroups() {
    const groups = getData('groups', []);
    const students = getData('students', []);
    document.getElementById('adminGroupsBody').innerHTML = groups.map(g => {
        const count = students.filter(s => s.groupId === g.id).length;
        return `<tr>
            <td><strong>${g.name}</strong></td>
            <td>${count}</td>
            <td><button class="btn btn-sm btn-danger" onclick="deleteGroup('${g.id}')">Eliminar</button></td>
        </tr>`;
    }).join('');
}

function refreshAdminStudents() {
    populateGroupSelect('adminStudentGroup');
    const students = getData('students', []);
    const groups = getData('groups', []);
    document.getElementById('adminStudentsBody').innerHTML = students.map(s => {
        const group = groups.find(g => g.id === s.groupId);
        return `<tr>
            <td>${s.id}</td>
            <td>${s.name}</td>
            <td>${group ? group.name : '—'}</td>
            <td><button class="btn btn-sm btn-danger" onclick="deleteStudent('${s.id}')">Eliminar</button></td>
        </tr>`;
    }).join('');
}

function refreshAdminUsers() {
    const users = getData('users', []);
    document.getElementById('adminUsersBody').innerHTML = users.map(u => `
        <tr>
            <td>${u.username}</td>
            <td><span class="badge ${u.role === 'admin' ? 'badge-p' : 'badge-r'}">${u.role}</span></td>
            <td>${u.username === 'admin' ? '—' : `<button class="btn btn-sm btn-danger" onclick="deleteUser('${u.username}')">Eliminar</button>`}</td>
        </tr>`).join('');
}

function addGroup() {
    const name = document.getElementById('newGroupName').value.trim();
    if (!name) { showToast('Ingresa un nombre'); return; }
    const groups = getData('groups', []);
    const id = 'g' + Date.now();
    groups.push({ id, name });
    setData('groups', groups);
    document.getElementById('newGroupName').value = '';
    refreshAdmin();
    showToast(`✅ Grupo "${name}" agregado`);
}

function deleteGroup(id) {
    if (!confirm('¿Eliminar este grupo y todos sus alumnos?')) return;
    let groups = getData('groups', []);
    let students = getData('students', []);
    let records = getData('records', []);
    groups = groups.filter(g => g.id !== id);
    students = students.filter(s => s.groupId !== id);
    records = records.filter(r => r.groupId !== id);
    setData('groups', groups);
    setData('students', students);
    setData('records', records);
    refreshAdmin();
    showToast('Grupo eliminado');
}

function addStudent() {
    const id = document.getElementById('newStudentId').value.trim().toUpperCase();
    const name = document.getElementById('newStudentName').value.trim();
    const groupId = document.getElementById('adminStudentGroup').value;

    if (!id || !name || !groupId) { showToast('Completa todos los campos'); return; }

    const students = getData('students', []);
    if (students.find(s => s.id === id)) { showToast('Ya existe esa matrícula'); return; }

    students.push({ id, name, groupId });
    setData('students', students);
    document.getElementById('newStudentId').value = '';
    document.getElementById('newStudentName').value = '';
    refreshAdmin();
    showToast(`✅ Alumno "${name}" agregado`);
}

function deleteStudent(id) {
    if (!confirm('¿Eliminar este alumno?')) return;
    let students = getData('students', []);
    let records = getData('records', []);
    students = students.filter(s => s.id !== id);
    records = records.filter(r => r.studentId !== id);
    setData('students', students);
    setData('records', records);
    refreshAdmin();
    showToast('Alumno eliminado');
}

function addUser() {
    const username = document.getElementById('newUserName').value.trim();
    const password = document.getElementById('newUserPass').value;
    const role = document.getElementById('newUserRole').value;

    if (!username || !password) { showToast('Completa todos los campos'); return; }

    const users = getData('users', []);
    if (users.find(u => u.username === username)) { showToast('Ya existe ese usuario'); return; }

    users.push({ username, password, role, name: username });
    setData('users', users);
    document.getElementById('newUserName').value = '';
    document.getElementById('newUserPass').value = '';
    refreshAdmin();
    showToast(`✅ Usuario "${username}" agregado`);
}

function deleteUser(username) {
    if (username === 'admin') return;
    if (!confirm('¿Eliminar este usuario?')) return;
    let users = getData('users', []);
    users = users.filter(u => u.username !== username);
    setData('users', users);
    refreshAdmin();
    showToast('Usuario eliminado');
}

// ===== INIT =====
initData();
navigateTo('login');

// Add student access link to login
(function() {
    const loginContainer = document.querySelector('.login-container');
    const div = document.createElement('div');
    div.className = 'student-access';
    div.innerHTML = '<button onclick="navigateTo(\'studentPin\')">🎓 Soy alumno — Registrar asistencia con PIN</button>';
    loginContainer.appendChild(div);
})();
