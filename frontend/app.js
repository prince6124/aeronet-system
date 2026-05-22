// ═══════════════════════════════════════════════════════
// AeroNet — app.js  (RBAC + Update capabilities + PDF)
// ═══════════════════════════════════════════════════════

const API = "https://aeronet-system.onrender.com/api";

// ── DOM refs ──────────────────────────────────────────
const content      = document.getElementById("content");
const searchInput  = document.getElementById("searchInput");
const alertBar     = document.getElementById("alerts");
const pageTitle    = document.getElementById("pageTitle");
const pageSub      = document.getElementById("pageSub");
const filterWrap   = document.getElementById("filterWrap");
const filterSelect = document.getElementById("filterSelect");
const actionBar    = document.getElementById("actionBar");
const appShell     = document.getElementById("appShell");
const loginScreen  = document.getElementById("loginScreen");
const modalOverlay = document.getElementById("modalOverlay");
const modalBox     = document.getElementById("modalBox");

// ── State ─────────────────────────────────────────────
let currentView = "";
let currentRole = "";
let currentUser = "";
let lastData    = [];
let alertTO     = null;

// ═══════════════════════════════════════════════════════
// RBAC — what each role can see and do
// ═══════════════════════════════════════════════════════
const ROLES = {
  manager: {
    label: "Manager", color: "#00d4ff",
    nav: [
      { view:"kpis",           icon:"◈", label:"KPI Dashboard",  group:"Overview" },
      { view:"suppliers",      icon:"⬡", label:"Suppliers",       group:"Operations" },
      { view:"orders",         icon:"▣", label:"Orders",          group:"Operations" },
      { view:"shipments",      icon:"🚚", label:"Shipments",       group:"Operations" },
      { view:"qc",             icon:"◫", label:"QC Reports",      group:"Quality" },
      { view:"sensor",         icon:"◉", label:"IoT Logs",        group:"Monitoring" },
      { view:"iot_chart",      icon:"📈", label:"IoT Chart",       group:"Monitoring" },
      { view:"certifications", icon:"◬", label:"Certifications",  group:"Compliance" },
      { view:"auditlog",       icon:"📋", label:"Audit Log",       group:"Compliance" },
      { view:"performance",    icon:"◎", label:"Performance",     group:"Analytics" },
    ],
    can: { approveQC: true, submitQC: false, logIoT: false, updateShipment: false }
  },
  warehouse: {
    label: "Warehouse Manager", color: "#f97316",
    nav: [
      { view:"shipments", icon:"🚚", label:"Shipments", group:"Operations" },
      { view:"orders",    icon:"▣", label:"Orders",    group:"Operations" },
      { view:"sensor",    icon:"◉", label:"IoT Logs",  group:"Monitoring" },
    ],
    can: { approveQC: false, submitQC: false, logIoT: false, updateShipment: true }
  },
  inspector: {
    label: "QC Inspector", color: "#00e5a0",
    nav: [
      { view:"qc",    icon:"◫", label:"QC Reports", group:"Quality" },
      { view:"sensor",icon:"◉", label:"IoT Logs",   group:"Monitoring" },
    ],
    can: { approveQC: false, submitQC: true, logIoT: false }
  },
  engineer: {
    label: "Engineer", color: "#fbbf24",
    nav: [
      { view:"sensor", icon:"◉", label:"IoT Logs",      group:"Monitoring" },
      { view:"qc",     icon:"◫", label:"QC Reports",    group:"Quality" },
    ],
    can: { approveQC: false, submitQC: false, logIoT: true }
  },
  auditor: {
    label: "Auditor", color: "#a78bfa",
    nav: [
      { view:"certifications", icon:"◬", label:"Certifications", group:"Compliance" },
      { view:"qc",             icon:"◫", label:"QC Reports",     group:"Quality" },
      { view:"sensor",         icon:"◉", label:"IoT Logs",       group:"Monitoring" },
    ],
    can: { approveQC: false, submitQC: false, logIoT: false }
  }
};

// ═══════════════════════════════════════════════════════
// LOGIN / LOGOUT
// ═══════════════════════════════════════════════════════
function doLogin() {
  const user = document.getElementById("loginUser").value.trim();
  const pass = document.getElementById("loginPass").value;
  const role = document.getElementById("loginRole").value;

  if (!user || pass !== "pass123") {
    document.getElementById("loginError").classList.remove("hidden");
    return;
  }
  currentRole = role;
  currentUser = user;

  loginScreen.classList.add("hidden");
  appShell.classList.remove("hidden");

  buildNav();
  document.getElementById("sidebarUser").innerHTML = `
    <div class="sidebar-user-name">${user}</div>
    <div class="sidebar-user-role" style="color:${ROLES[role].color}">${ROLES[role].label}</div>`;

  navigate(ROLES[role].nav[0].view);
}

function doLogout() {
  appShell.classList.add("hidden");
  loginScreen.classList.remove("hidden");
  document.getElementById("loginUser").value = "";
  document.getElementById("loginPass").value = "";
  document.getElementById("loginError").classList.add("hidden");
  currentRole = currentUser = currentView = "";
  lastData = [];
}

document.getElementById("loginPass").addEventListener("keydown", e => {
  if (e.key === "Enter") doLogin();
});

// ── Build sidebar nav ──────────────────────────────────
function buildNav() {
  const nav = document.getElementById("sideNav");
  nav.innerHTML = "";
  let lastGroup = "";
  ROLES[currentRole].nav.forEach(item => {
    if (item.group !== lastGroup) {
      const lbl = document.createElement("div");
      lbl.className = "nav-label";
      lbl.textContent = item.group;
      nav.appendChild(lbl);
      lastGroup = item.group;
    }
    const btn = document.createElement("button");
    btn.className = "nav-btn";
    btn.dataset.view = item.view;
    btn.innerHTML = `<span class="nav-icon">${item.icon}</span> ${item.label}`;
    btn.onclick = () => navigate(item.view);
    nav.appendChild(btn);
  });
}

// ═══════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════
function navigate(view) {
  currentView = view;
  lastData    = [];
  document.querySelectorAll(".nav-btn").forEach(b =>
    b.classList.toggle("active", b.dataset.view === view)
  );
  hideFilter();
  hideActionBar();
  clearAlert();
  searchInput.value = "";
  const views = { kpis, suppliers, orders, shipments, qc, sensor, iot_chart, certifications, auditlog, performance };
  if (views[view]) views[view]();
}

searchInput.addEventListener("input", () => {
  const renders = {
    suppliers:      () => renderSuppliers(lastData),
    orders:         () => renderOrders(lastData),
    shipments:      () => renderShipments(lastData),
    qc:             () => renderQC(lastData),
    sensor:         () => renderSensor(lastData),
    certifications: () => renderCerts(lastData),
    auditlog:       () => renderAuditLog(lastData),
  };
  if (renders[currentView] && lastData.length) renders[currentView]();
  else if (currentView === "performance") performance();
});

// ═══════════════════════════════════════════════════════
// MODAL
// ═══════════════════════════════════════════════════════
function openModal(html) {
  modalBox.innerHTML = html;
  modalOverlay.classList.remove("hidden");
}

function closeModal(e) {
  if (e.target === modalOverlay) modalOverlay.classList.add("hidden");
}

function closeModalDirect() {
  modalOverlay.classList.add("hidden");
}

// ═══════════════════════════════════════════════════════
// ACTION BAR
// ═══════════════════════════════════════════════════════
function showActionBar(html) {
  actionBar.innerHTML = html;
  actionBar.classList.remove("hidden");
}
function hideActionBar() {
  actionBar.classList.add("hidden");
  actionBar.innerHTML = "";
}

// ═══════════════════════════════════════════════════════
// FILTER
// ═══════════════════════════════════════════════════════
function showFilter(options) {
  filterSelect.innerHTML = `<option value="all">All statuses</option>` +
    options.map(o => `<option value="${o.value}">${o.label}</option>`).join("");
  filterWrap.classList.remove("hidden");
}
function hideFilter() { filterWrap.classList.add("hidden"); }
function applyFilter() {
  const renders = {
    qc:             () => renderQC(lastData),
    sensor:         () => renderSensor(lastData),
    certifications: () => renderCerts(lastData),
    orders:         () => renderOrders(lastData),
    shipments:      () => renderShipments(lastData),
  };
  if (renders[currentView] && lastData.length) renders[currentView]();
  else if (renders[currentView]) { const views = { qc, sensor, certifications, orders, shipments }; views[currentView](); }
}

// ═══════════════════════════════════════════════════════
// UI HELPERS
// ═══════════════════════════════════════════════════════
function setPage(title, sub) {
  pageTitle.textContent = title;
  pageSub.textContent   = sub;
}

function showAlert(msg, type = "red") {
  alertBar.textContent = msg;
  alertBar.className   = `alert-bar alert-${type}`;
  clearTimeout(alertTO);
  alertTO = setTimeout(() => alertBar.classList.add("hidden"), 6000);
}

function clearAlert() { alertBar.className = "alert-bar hidden"; }

function badge(text) {
  if (!text) return `<span class="badge badge-grey">—</span>`;
  const l = String(text).toLowerCase();
  let cls = "badge-grey";
  if (["approved","pass","ok","active","none"].some(v => l.includes(v)))             cls = "badge-green";
  else if (["fail","critical","rejected"].some(v => l.includes(v)))                  cls = "badge-red";
  else if (["warning","pending","review","conditional"].some(v => l.includes(v)))    cls = "badge-yellow";
  else if (["ndt","dimensional","environmental","as9100","iso9001"].some(v=>l.includes(v))) cls = "badge-blue";
  return `<span class="badge ${cls}">${text}</span>`;
}

function showLoading() {
  content.innerHTML = `
    <div class="header-row">${Array(5).fill('<span></span>').join('')}</div>
    ${Array(5).fill(`<div class="row" style="pointer-events:none">
      ${Array(5).fill('<span><div class="shimmer"></div></span>').join('')}
    </div>`).join('')}`;
}

function showEmpty(msg) {
  content.innerHTML = `<div class="empty-state">
    <div class="empty-icon">◈</div><p>${msg}</p></div>`;
}

function buildTable(headers, rows) {
  const cols = headers.length;
  content.innerHTML = `
    <div class="header-row" style="grid-template-columns:repeat(${cols},1fr)">
      ${headers.map(h => `<span>${h}</span>`).join('')}
    </div>`;

  rows.forEach((row, i) => {
    const div = document.createElement("div");
    div.className = "row";
    div.style.cssText = `grid-template-columns:repeat(${cols},1fr);animation-delay:${i*35}ms`;
    div.innerHTML = row.cells.map(c => `<span>${c}</span>`).join('');
    if (row.alertColor) div.classList.add(`row-alert-${row.alertColor}`);
    if (row.onclick) div.onclick = row.onclick;
    content.appendChild(div);
  });
}

// ═══════════════════════════════════════════════════════
// KPI DASHBOARD (Manager)
// ═══════════════════════════════════════════════════════
async function kpis() {
  setPage("KPI Dashboard", "Live metrics across all MongoDB collections");
  showLoading();
  hideActionBar();

  try {
    const [qcData, sensorData, certData, shipData, supplierData] = await Promise.all([
      fetch(`${API}/qc`).then(r => r.json()),
      fetch(`${API}/sensor`).then(r => r.json()),
      fetch(`${API}/certifications`).then(r => r.json()),
      fetch(`${API}/shipments`).then(r => r.json()),
      fetch(`${API}/suppliers/performance`).then(r => r.json()),
    ]);

    lastData = [];
    const approved  = qcData.filter(q => q.status === "APPROVED").length;
    const review    = qcData.filter(q => q.status === "REVIEW").length;
    const critical  = sensorData.filter(s => s.status === "critical").length;
    const warning   = sensorData.filter(s => s.status === "warning").length;
    const ok        = sensorData.filter(s => s.status === "ok").length;
    const certOk    = certData.filter(c => c.status === "approved").length;
    const delivered = shipData.filter(s => s.current_status === "Delivered").length;
    const delayed   = shipData.filter(s => s.current_status === "Delayed").length;
    const maxOrders = Math.max(...(supplierData.map(p => parseInt(p.total_orders)||0)), 1);
    content.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi-card kpi-purple">
          <div class="kpi-icon">◫</div>
          <div class="kpi-value">${qcData.length}</div>
          <div class="kpi-label">QC Reports</div>
          <div class="kpi-sub">${approved} approved · ${review} under review</div>
        </div>
        <div class="kpi-card ${critical > 0 ? "kpi-red" : "kpi-green"}">
          <div class="kpi-icon">◉</div>
          <div class="kpi-value">${sensorData.length}</div>
          <div class="kpi-label">IoT Readings</div>
          <div class="kpi-sub">${critical} critical · ${warning} warning · ${ok} ok</div>
        </div>
        <div class="kpi-card kpi-teal">
          <div class="kpi-icon">◬</div>
          <div class="kpi-value">${certData.length}</div>
          <div class="kpi-label">Certifications</div>
          <div class="kpi-sub">${certOk} approved</div>
        </div>
        <div class="kpi-card ${delayed > 0 ? "kpi-red" : "kpi-green"}">
          <div class="kpi-icon">🚚</div>
          <div class="kpi-value">${shipData.length}</div>
          <div class="kpi-label">Shipments</div>
          <div class="kpi-sub">${delivered} delivered · ${delayed} delayed</div>
        </div>
      </div>

      <div class="kpi-panels">
        <div class="kpi-panel">
          <div class="kpi-section-title">QC Report Breakdown</div>
          <div class="bar-chart">
            ${bar("Approved", approved, qcData.length, "var(--green)")}
            ${bar("Under Review", review, qcData.length, "var(--yellow)")}
          </div>
        </div>
        <div class="kpi-panel">
          <div class="kpi-section-title">IoT Status Breakdown</div>
          <div class="bar-chart">
            ${bar("OK",       ok,       sensorData.length, "var(--green)")}
            ${bar("Warning",  warning,  sensorData.length, "var(--yellow)")}
            ${bar("Critical", critical, sensorData.length, "var(--red)")}
          </div>
        </div>
        <div class="kpi-panel">
          <div class="kpi-section-title">Shipment Status</div>
          <div class="bar-chart">
            ${bar("Delivered",  delivered, shipData.length, "var(--green)")}
            ${bar("Delayed",    delayed,   shipData.length, "var(--red)")}
            ${bar("In Transit", shipData.filter(s=>s.current_status==="In Transit").length, shipData.length, "var(--accent)")}
          </div>
        </div>
        <div class="kpi-panel">
          <div class="kpi-section-title">Supplier Order Volume</div>
          <div class="bar-chart" id="kpi-supplier-bars">
            ${supplierData.slice(0,5).map(p => bar(p.business_name.split(" ")[0], parseInt(p.total_orders)||0, maxOrders, "var(--accent)")).join("")}
          </div>
        </div>
      </div>
    `;

    setPage("KPI Dashboard", `Live metrics · PostgreSQL + MongoDB`);
    if (critical > 0) showAlert(`⚠ ${critical} critical IoT event(s) require attention`, "red");
    else if (delayed > 0) showAlert(`⚠ ${delayed} delayed shipment(s) detected`, "red");
    else if (review > 0) showAlert(`ℹ ${review} QC report(s) pending your approval`, "yellow");

  } catch {
    showEmpty("Cannot load KPIs — is the backend running?");
  }
}

function bar(label, val, total, color) {
  const pct = total > 0 ? Math.round((val / total) * 100) : 0;
  return `<div class="bar-row">
    <div class="bar-label">${label}</div>
    <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${color}"></div></div>
    <div class="bar-count">${val} <span>(${pct}%)</span></div>
  </div>`;
}

// ═══════════════════════════════════════════════════════
// QC REPORTS
// Inspector  → can submit new reports
// Manager    → can approve / reject
// Auditor    → read only
// ═══════════════════════════════════════════════════════
function qc() {
  setPage("QC Reports", "MongoDB → aeronetsystem.qc_reports");
  showLoading();
  showFilter([
    { value:"APPROVED", label:"Approved" },
    { value:"REVIEW",   label:"Under Review" },
    { value:"REJECTED", label:"Rejected" },
  ]);

  // Show action bar based on role
  const can = ROLES[currentRole].can;
  if (can.submitQC) {
    showActionBar(`
      <button class="ab-btn ab-primary" onclick="openSubmitQC()">
        ＋ Submit QC Report
      </button>
      <span class="ab-hint">As QC Inspector you can submit new inspection reports</span>
    `);
  } else if (can.approveQC) {
    showActionBar(`
      <span class="ab-hint">Click a report row to approve or reject it</span>
    `);
  } else {
    hideActionBar();
  }

  fetch(`${API}/qc`)
    .then(r => r.json())
    .then(data => { lastData = data; renderQC(data); })
    .catch(() => showEmpty("Cannot load QC reports — check backend"));
}

function renderQC(data) {
  const search = searchInput.value.toLowerCase();
  const filter = filterSelect.value;
  const can    = ROLES[currentRole].can;

  const filtered = data.filter(q => {
    const txt = (q.report_id + q.part_id + q.supplier_id + (q.inspector?.name||"") + q.status).toLowerCase();
    return txt.includes(search) && (filter === "all" || q.status === filter);
  });

  if (!filtered.length) { showEmpty("No QC reports match your filter"); return; }

  // Extra column for action buttons if manager
  const headers = ["Report ID","Part ID","Inspector","Type","Status","Action"];

  buildTable(headers, filtered.map(q => {
    const actionCell = can.approveQC
      ? `<span style="display:flex;gap:4px;flex-wrap:wrap">
           ${q.status !== "APPROVED" ? `<button class="inline-btn btn-approve" onclick="updateQCStatus('${q.report_id}','APPROVED',event)">Approve</button>` : ""}
           ${q.status !== "REJECTED" ? `<button class="inline-btn btn-reject"  onclick="updateQCStatus('${q.report_id}','REJECTED',event)">Reject</button>`  : ""}
           <button class="inline-btn" style="background:rgba(124,58,237,.15);color:var(--accent-lt)" onclick="showQCVersions('${q.report_id}',event)">History</button>
         </span>`
      : `<button class="inline-btn" style="background:rgba(124,58,237,.15);color:var(--accent-lt)" onclick="showQCVersions('${q.report_id}',event)">History</button>`;

    return {
      cells: [
        q.report_id,
        `<span style="font-family:var(--font-mono);font-size:11px">${q.part_id}</span>`,
        q.inspector?.name || "—",
        badge(q.inspection_type),
        badge(q.status),
        actionCell
      ],
      alertColor: q.status === "REVIEW" ? "yellow" : q.status === "REJECTED" ? "red" : null
    };
  }));

  setPage("QC Reports", `${filtered.length} of ${data.length} reports · MongoDB`);
}

// ── Submit new QC report (Inspector) ──────────────────
function openSubmitQC() {
  openModal(`
    <h2 class="modal-title">Submit QC Report</h2>
    <div class="modal-form">
      <div class="mf-row">
        <label>Report ID *</label>
        <input id="mf_rid" placeholder="e.g. QC1004" />
      </div>
      <div class="mf-row">
        <label>Part ID *</label>
        <input id="mf_pid" placeholder="e.g. A320-FP-220" />
      </div>
      <div class="mf-row">
        <label>Supplier ID *</label>
        <input id="mf_sid" placeholder="e.g. SUP-01" />
      </div>
      <div class="mf-row">
        <label>Inspection Type</label>
        <select id="mf_type">
          <option>Dimensional</option>
          <option>NDT</option>
          <option>Environmental</option>
          <option>General</option>
        </select>
      </div>
      <div class="mf-row">
        <label>Inspector Name</label>
        <input id="mf_iname" placeholder="e.g. Maria Nikolaou" value="${currentUser}" />
      </div>
      <div class="mf-row">
        <label>Inspector ID</label>
        <input id="mf_iid" placeholder="e.g. EMP101" />
      </div>
      <div class="mf-row">
        <label>Notes</label>
        <textarea id="mf_notes" rows="3" placeholder="Inspection findings…"></textarea>
      </div>
      <div id="mf_error" class="mf-error hidden"></div>
      <div class="modal-actions">
        <button class="ab-btn ab-ghost" onclick="closeModalDirect()">Cancel</button>
        <button class="ab-btn ab-primary" onclick="submitQCReport()">Submit Report</button>
      </div>
    </div>
  `);
}

async function submitQCReport() {
  const body = {
    report_id:      document.getElementById("mf_rid").value.trim(),
    part_id:        document.getElementById("mf_pid").value.trim(),
    supplier_id:    document.getElementById("mf_sid").value.trim(),
    inspection_type:document.getElementById("mf_type").value,
    inspector_name: document.getElementById("mf_iname").value.trim(),
    inspector_id:   document.getElementById("mf_iid").value.trim(),
    notes:          document.getElementById("mf_notes").value.trim(),
  };

  const err = document.getElementById("mf_error");
  if (!body.report_id || !body.part_id || !body.supplier_id) {
    err.textContent = "Report ID, Part ID and Supplier ID are required.";
    err.classList.remove("hidden");
    return;
  }

  try {
    const res  = await fetch(`${API}/qc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) { err.textContent = data.error; err.classList.remove("hidden"); return; }

    closeModalDirect();
    showAlert("✔ QC report submitted successfully", "green");
    qc(); // refresh
  } catch {
    err.textContent = "Network error — is the backend running?";
    err.classList.remove("hidden");
  }
}

// ── Approve / Reject QC (Manager) ─────────────────────
async function updateQCStatus(reportId, status, e) {
  e.stopPropagation();
  try {
    const res  = await fetch(`${API}/qc/${reportId}/status`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status, changed_by: currentUser })
    });
    const data = await res.json();
    if (!res.ok) { showAlert("Error: " + data.error, "red"); return; }
    showAlert(`✔ Report ${reportId} marked as ${status} (v${data.version || "?"})`,
      status === "APPROVED" ? "green" : "red");
    qc();
  } catch {
    showAlert("Network error — is the backend running?", "red");
  }
}

async function showQCVersions(reportId, e) {
  e.stopPropagation();
  try {
    const res  = await fetch(`${API}/qc/${reportId}/versions`);
    const data = await res.json();
    if (!data.length) {
      openModal(`<h2 class="modal-title">Version History — ${reportId}</h2>
        <p style="color:var(--muted);padding:16px">No version history yet.</p>
        <div class="modal-actions"><button class="ab-btn ab-ghost" onclick="closeModalDirect()">Close</button></div>`);
      return;
    }
    const rows = data.map(v => `
      <div style="padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-family:var(--font-mono);font-size:12px;color:var(--accent-lt)">v${v.version}</span>
          <span style="font-size:11px;color:var(--muted)">${String(v.changed_at).split("T")[0]}</span>
        </div>
        <div style="font-size:13px;margin-top:4px">${v.note || "—"}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:2px">by ${v.changed_by}</div>
      </div>`).join("");
    openModal(`
      <h2 class="modal-title">Version History</h2>
      <p class="modal-sub">Report: ${reportId}</p>
      <div style="max-height:400px;overflow-y:auto;padding:0 4px">${rows}</div>
      <div class="modal-actions">
        <button class="ab-btn ab-ghost" onclick="closeModalDirect()">Close</button>
      </div>`);
  } catch {
    showAlert("Could not load version history", "red");
  }
}

// ═══════════════════════════════════════════════════════
// IoT SENSOR LOGS
// Engineer → can add new readings
// ═══════════════════════════════════════════════════════
function sensor() {
  setPage("IoT Logs", "MongoDB → aeronetsystem.iot_logs");
  showLoading();
  showFilter([
    { value:"ok",       label:"OK" },
    { value:"warning",  label:"Warning" },
    { value:"critical", label:"Critical" },
  ]);

  const can = ROLES[currentRole].can;
  if (can.logIoT) {
    showActionBar(`
      <button class="ab-btn ab-primary" onclick="openLogIoT()">
        ＋ Log Sensor Reading
      </button>
      <span class="ab-hint">As Engineer you can submit new IoT sensor data</span>
    `);
  } else {
    hideActionBar();
  }

  fetch(`${API}/sensor`)
    .then(r => r.json())
    .then(data => { lastData = data; renderSensor(data); })
    .catch(() => showEmpty("Cannot load IoT logs — check backend"));
}

function renderSensor(data) {
  const search = searchInput.value.toLowerCase();
  const filter = filterSelect.value;

  const filtered = data.filter(s => {
    const txt = (s.device_id + s.status + (s.timestamp||"")).toLowerCase();
    return txt.includes(search) && (filter === "all" || s.status === filter);
  });

  if (!filtered.length) { showEmpty("No IoT readings match your filter"); return; }

  let hasCritical = false;
  buildTable(
    ["Device ID", "Timestamp", "Temperature", "Vibration", "Pressure", "GPS", "Status"],
    filtered.map(s => {
      const temp = s.telemetry?.temperature || 0;
      if (s.status === "critical") hasCritical = true;
      const ts = s.timestamp ? String(s.timestamp).replace("T"," ").split(".")[0] : "—";
      const gps = (s.gps_lat && s.gps_lon) ? `${Number(s.gps_lat).toFixed(2)}, ${Number(s.gps_lon).toFixed(2)}` : "—";
      return {
        cells: [
          `<span style="font-family:var(--font-mono)">${s.device_id}</span>`,
          `<span style="font-size:11px;color:var(--muted)">${ts}</span>`,
          badge(temp > 80 ? `${temp}° ⚠` : `${temp}°`),
          `<span style="color:var(--muted)">${s.telemetry?.vibration ?? "—"}</span>`,
          `<span style="color:var(--muted)">${s.telemetry?.pressure ?? "—"}</span>`,
          `<span style="font-size:11px;color:var(--muted)">${gps}</span>`,
          badge(s.status)
        ],
        alertColor: s.status === "critical" ? "red" : s.status === "warning" ? "yellow" : null
      };
    })
  );

  if (hasCritical) showAlert("⚠ Critical IoT status detected — immediate attention required", "red");
  setPage("IoT Logs", `${filtered.length} of ${data.length} readings · MongoDB`);
}

// ── Log new IoT reading (Engineer) ────────────────────
function openLogIoT() {
  openModal(`
    <h2 class="modal-title">Log IoT Sensor Reading</h2>
    <p class="modal-sub">Status is automatically assigned based on temperature.</p>
    <div class="modal-form">
      <div class="mf-row">
        <label>Device ID *</label>
        <input id="iot_dev" placeholder="e.g. MEQ-44" />
      </div>
      <div class="mf-row">
        <label>Temperature (°C) *</label>
        <input id="iot_temp" type="number" step="0.1" placeholder="e.g. 82.4" />
      </div>
      <div class="mf-row">
        <label>Vibration (g)</label>
        <input id="iot_vib" type="number" step="0.01" placeholder="e.g. 0.34" />
      </div>
      <div class="mf-row">
        <label>Pressure (kPa)</label>
        <input id="iot_pres" type="number" step="0.1" placeholder="e.g. 102.2" />
      </div>
      <div class="mf-thresholds">
        <span>🟢 &lt; 80°C = OK</span>
        <span>🟡 80–84°C = Warning</span>
        <span>🔴 ≥ 85°C = Critical</span>
      </div>
      <div id="iot_error" class="mf-error hidden"></div>
      <div class="modal-actions">
        <button class="ab-btn ab-ghost" onclick="closeModalDirect()">Cancel</button>
        <button class="ab-btn ab-primary" onclick="submitIoT()">Log Reading</button>
      </div>
    </div>
  `);
}

async function submitIoT() {
  const body = {
    device_id:   document.getElementById("iot_dev").value.trim(),
    temperature: document.getElementById("iot_temp").value,
    vibration:   document.getElementById("iot_vib").value,
    pressure:    document.getElementById("iot_pres").value,
  };

  const err = document.getElementById("iot_error");
  if (!body.device_id || body.temperature === "") {
    err.textContent = "Device ID and Temperature are required.";
    err.classList.remove("hidden");
    return;
  }

  try {
    const res  = await fetch(`${API}/sensor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) { err.textContent = data.error; err.classList.remove("hidden"); return; }

    closeModalDirect();
    const st = data.doc.status;
    showAlert(`✔ Reading logged — Status: ${st.toUpperCase()}`,
      st === "critical" ? "red" : st === "warning" ? "yellow" : "green");
    sensor(); // refresh
  } catch {
    err.textContent = "Network error — is the backend running?";
    err.classList.remove("hidden");
  }
}

// ═══════════════════════════════════════════════════════
// CERTIFICATIONS (read-only for all)
// ═══════════════════════════════════════════════════════
function certifications() {
  setPage("Certifications", "MongoDB → aeronetsystem.certifications");
  showLoading();
  hideActionBar();
  showFilter([
    { value:"approved", label:"Approved" },
    { value:"pending",  label:"Pending" },
  ]);

  fetch(`${API}/certifications`)
    .then(r => r.json())
    .then(data => { lastData = data; renderCerts(data); })
    .catch(() => showEmpty("Cannot load certifications — check backend"));
}

function renderCerts(data) {
  const search = searchInput.value.toLowerCase();
  const filter = filterSelect.value;

  const filtered = data.filter(c => {
    const txt = (c.cert_id + c.part_id + c.supplier_id + c.standard + c.status).toLowerCase();
    return txt.includes(search) && (filter === "all" || c.status === filter);
  });

  if (!filtered.length) { showEmpty("No certifications match"); return; }

  buildTable(
    ["Cert ID","Part ID","Supplier","Standard","Status"],
    filtered.map(c => ({
      cells: [
        c.cert_id,
        `<span style="font-family:var(--font-mono);font-size:11px">${c.part_id}</span>`,
        c.supplier_id,
        badge(c.standard),
        badge(c.status)
      ]
    }))
  );

  const label = currentRole === "auditor" ? "Read-only (Auditor)" : "MongoDB";
  setPage("Certifications", `${filtered.length} of ${data.length} certifications · ${label}`);
}

// ═══════════════════════════════════════════════════════
// SUPPLIERS
// ═══════════════════════════════════════════════════════
function suppliers() {
  setPage("Suppliers", "PostgreSQL → aeronet_system.supplier");
  showLoading(); hideActionBar();
  fetch(`${API}/suppliers`)
    .then(r => r.json())
    .then(data => { lastData = data; renderSuppliers(data); })
    .catch(() => showEmpty("Cannot load suppliers — check backend"));
}

function renderSuppliers(data) {
  const search = searchInput.value.toLowerCase();
  const filtered = data.filter(s =>
    ((s.business_name||"") + (s.contact_email||"") + (s.address||"") + (s.accreditation_status||"")).toLowerCase().includes(search)
  );
  if (!filtered.length) { showEmpty("No suppliers match"); return; }

  const colTemplate = "60px 200px 280px 220px 160px 120px";

  content.style.minWidth = "1050px";
  content.innerHTML = `
    <div class="header-row" style="grid-template-columns:${colTemplate};min-width:1050px">
      <span>ID</span><span>Business Name</span><span>Address</span>
      <span>Email</span><span>Phone</span><span>Accreditation</span>
    </div>`;

  filtered.forEach((s, i) => {
    const div = document.createElement("div");
    div.className = "row";
    div.style.cssText = `grid-template-columns:${colTemplate};animation-delay:${i*35}ms`;
    div.innerHTML = [
      `#${s.supplier_id}`,
      `<strong>${s.business_name || "—"}</strong>`,
      `<span style="color:var(--muted);font-size:12px">${s.address || "—"}</span>`,
      `<span style="font-size:12px">${s.contact_email || "—"}</span>`,
      `<span style="color:var(--muted);font-size:12px">${s.contact_phone || "—"}</span>`,
      badge(s.accreditation_status)
    ].map(c => `<span>${c}</span>`).join("");
    content.appendChild(div);
  });

  setPage("Suppliers", `${filtered.length} of ${data.length} suppliers · PostgreSQL`);
}

// ═══════════════════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════════════════
function orders() {
  setPage("Orders", "PostgreSQL → aeronet_system.purchase_order");
  showLoading(); hideActionBar();
  showFilter([
    { value:"Placed",     label:"Placed" },
    { value:"Confirmed",  label:"Confirmed" },
    { value:"Dispatched", label:"Dispatched" },
    { value:"Delivered",  label:"Delivered" },
    { value:"Completed",  label:"Completed" },
  ]);
  fetch(`${API}/orders`)
    .then(r => r.json())
    .then(data => { lastData = data; renderOrders(data); })
    .catch(() => showEmpty("Cannot load orders — check backend"));
}

function renderOrders(data) {
  const search = searchInput.value.toLowerCase();
  const filter = filterSelect.value;
  const filtered = data.filter(o => {
    const txt = (String(o.order_id) + (o.supplier_name||o.supplier_id||"" ) + (o.status||"" )).toLowerCase();
    return txt.includes(search) && (filter === "all" || o.status === filter);
  });
  if (!filtered.length) { showEmpty("No orders match your filter"); return; }
  buildTable(
    ["Order ID","Supplier","Status","Total Value","Order Date","Desired Delivery"],
    filtered.map(o => ({
      cells: [
        `#${o.order_id}`,
        o.supplier_name || o.supplier_id || "—",
        badge(o.status),
        o.total_value > 0 ? `<span style="color:var(--green);font-family:var(--font-mono)">$${Number(o.total_value).toLocaleString("en-US", {minimumFractionDigits:2})}</span>` : "—",
        o.order_date ? String(o.order_date).split("T")[0] : "—",
        o.desired_delivery ? String(o.desired_delivery).split("T")[0] : "—"
      ],
      alertColor: o.status === "Delayed" ? "red" : null
    }))
  );
  setPage("Orders", `${filtered.length} of ${data.length} orders · PostgreSQL`);
}

// ═══════════════════════════════════════════════════════
// PERFORMANCE
// ═══════════════════════════════════════════════════════
function performance() {
  setPage("Performance", "Supplier analytics");
  showLoading();
  hideActionBar();

  fetch(`${API}/suppliers/performance`)
    .then(r => r.json())
    .then(data => {
      lastData = data;
      if (!data.length) { showEmpty("No performance data"); return; }
      buildTable(
        ["Supplier","Total Orders","—","—","—"],
        data.map(p => ({ cells:[p.business_name, p.total_orders,"—","—","—"] }))
      );
      setPage("Performance", `${data.length} suppliers`);
    })
    .catch(() => showEmpty("Cannot load performance — check backend"));
}

// ═══════════════════════════════════════════════════════
// SHIPMENTS — PostgreSQL
// Warehouse Manager can update status
// ═══════════════════════════════════════════════════════
function shipments() {
  setPage("Shipments", "PostgreSQL → aeronet_system.shipment");
  showLoading();
  showFilter([
    { value:"Delivered",  label:"Delivered" },
    { value:"In Transit", label:"In Transit" },
    { value:"Pending",    label:"Pending" },
    { value:"Dispatched", label:"Dispatched" },
  ]);

  const can = ROLES[currentRole].can;
  if (can.updateShipment) {
    showActionBar(`
      <span class="ab-hint">Click <strong>Update</strong> on any row to change shipment status</span>
    `);
  } else {
    hideActionBar();
  }

  fetch(`${API}/shipments`)
    .then(r => r.json())
    .then(data => { lastData = data; renderShipments(data); })
    .catch(() => showEmpty("Cannot load shipments — check backend"));
}

function renderShipments(data) {
  const search = searchInput.value.toLowerCase();
  const filter = filterSelect.value;
  const can    = ROLES[currentRole].can;

  const filtered = data.filter(s => {
    const txt = (String(s.shipment_id) + (s.tracking_number||"") + (s.supplier_name||"") + (s.current_status||"") + (s.port_of_entry||"")).toLowerCase();
    return txt.includes(search) && (filter === "all" || s.current_status === filter);
  });

  if (!filtered.length) { showEmpty("No shipments match your filter"); return; }

  const headers = can.updateShipment
    ? ["Shipment ID","Supplier","Tracking No.","Current Location","Status","ETA","Action"]
    : ["Shipment ID","Supplier","Tracking No.","Current Location","Status","ETA","Order Date"];

  buildTable(headers, filtered.map(s => {
    // ETA cell
    let etaCell = "—";
    if (s.current_status === "Delivered") {
      etaCell = `<span style="color:var(--green);font-size:11px">✓ Delivered</span>`;
    } else if (s.days_until_delivery !== null && s.days_until_delivery !== undefined) {
      const days = parseInt(s.days_until_delivery);
      if (days < 0)      etaCell = `<span style="color:var(--red);font-size:11px">⚠ ${Math.abs(days)}d overdue</span>`;
      else if (days === 0) etaCell = `<span style="color:var(--yellow);font-size:11px">⚠ Due today</span>`;
      else               etaCell = `<span style="color:var(--green);font-size:11px">${days}d remaining</span>`;
    }

    const actionCell = can.updateShipment
      ? `<span style="display:flex;gap:6px">
           <button class="inline-btn btn-approve" onclick="openUpdateShipment(${s.shipment_id},'${s.current_status}',event)">Update</button>
         </span>`
      : (s.order_date ? String(s.order_date).split("T")[0] : "—");

    return {
      cells: [
        `#${s.shipment_id}`,
        s.supplier_name || "—",
        `<span style="font-family:var(--font-mono);font-size:11px">${s.tracking_number || "—"}</span>`,
        s.current_location || s.port_of_entry || "—",
        badge(s.current_status),
        etaCell,
        actionCell
      ],
      alertColor: s.current_status === "Delayed" ? "red" : s.current_status === "Pending" ? "yellow" : null
    };
  }));

  setPage("Shipments", `${filtered.length} of ${data.length} shipments · PostgreSQL`);
  if (filtered.some(s => s.current_status === "Delayed")) showAlert("⚠ Delayed shipments detected", "red");
}

function openUpdateShipment(id, currentStatus, e) {
  e.stopPropagation();
  openModal(`
    <h2 class="modal-title">Update Shipment #${id}</h2>
    <p class="modal-sub">Current status: <strong>${currentStatus}</strong></p>
    <div class="modal-form">
      <div class="mf-row">
        <label>New Status</label>
        <select id="ship_status">
          <option value="Pending">Pending</option>
          <option value="In Transit">In Transit</option>
          <option value="Dispatched">Dispatched</option>
          <option value="Delivered">Delivered</option>
          <option value="Delayed">Delayed</option>
        </select>
      </div>
      <div class="mf-row">
        <label>Current Location</label>
        <input id="ship_location" placeholder="e.g. Frankfurt, DE" />
      </div>
      <div id="ship_error" class="mf-error hidden"></div>
      <div class="modal-actions">
        <button class="ab-btn ab-ghost" onclick="closeModalDirect()">Cancel</button>
        <button class="ab-btn ab-primary" onclick="updateShipmentStatus(${id})">Update Shipment</button>
      </div>
    </div>
  `);
}

async function updateShipmentStatus(id) {
  const status   = document.getElementById("ship_status").value;
  const location = document.getElementById("ship_location").value.trim();
  const err      = document.getElementById("ship_error");
  try {
    const res  = await fetch(`${API}/shipments/${id}/status`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status, location })
    });
    const data = await res.json();
    if (!res.ok) { err.textContent = data.error; err.classList.remove("hidden"); return; }
    closeModalDirect();
    showAlert(`✔ Shipment #${id} updated to ${status}`,
      status === "Delivered" ? "green" : status === "Delayed" ? "red" : "yellow");
    shipments();
  } catch {
    err.textContent = "Network error — is the backend running?";
    err.classList.remove("hidden");
  }
}


// ═══════════════════════════════════════════════════════
// AUDIT LOG — PostgreSQL
// ═══════════════════════════════════════════════════════
function auditlog() {
  setPage("Audit Log", "PostgreSQL → aeronet_system.audit_log");
  showLoading(); hideActionBar();
  showFilter([
    { value:"CREATE",  label:"Create" },
    { value:"UPDATE",  label:"Update" },
    { value:"APPROVE", label:"Approve" },
    { value:"VIEW",    label:"View" },
  ]);

  fetch(`${API}/auditlog`)
    .then(r => r.json())
    .then(data => { lastData = data; renderAuditLog(data); })
    .catch(() => showEmpty("Cannot load audit log — check backend"));
}

function renderAuditLog(data) {
  const search = searchInput.value.toLowerCase();
  const filter = filterSelect.value;
  const filtered = data.filter(a => {
    const txt = ((a.emp_id||"") + (a.action_type||"") + (a.target_entity||"") + (a.details||"")).toLowerCase();
    return txt.includes(search) && (filter === "all" || a.action_type === filter);
  });
  if (!filtered.length) { showEmpty("No audit records match"); return; }
  buildTable(
    ["Audit ID", "User ID", "Action", "Entity", "Target ID", "Timestamp", "Details"],
    filtered.map(a => ({
      cells: [
        `#${a.audit_id}`,
        `<span style="font-family:var(--font-mono)">${a.emp_id}</span>`,
        badge(a.action_type),
        `<span style="color:var(--muted)">${a.target_entity || "—"}</span>`,
        `<span style="font-family:var(--font-mono);font-size:11px">${a.target_id || "—"}</span>`,
        `<span style="font-size:11px;color:var(--muted)">${a.action_at ? String(a.action_at).split("T")[0] : "—"}</span>`,
        `<span style="font-size:11px">${a.details || "—"}</span>`
      ]
    }))
  );
  setPage("Audit Log", `${filtered.length} of ${data.length} records · PostgreSQL`);
}

// ═══════════════════════════════════════════════════════
// IoT CHART — Time-series per device
// ═══════════════════════════════════════════════════════
function iot_chart() {
  setPage("IoT Chart", "Time-series temperature readings per device");
  hideActionBar(); hideFilter();

  fetch(`${API}/sensor`)
    .then(r => r.json())
    .then(data => {
      lastData = data;
      if (!data.length) { showEmpty("No IoT data available"); return; }

      // Group by device
      const devices = [...new Set(data.map(d => d.device_id))];
      const colors  = ["#7c3aed","#22c55e","#f59e0b","#ef4444","#14b8a6"];

      // Build a chart per device
      content.innerHTML = devices.map((dev, i) => {
        const readings = data.filter(d => d.device_id === dev)
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        return `
          <div class="kpi-panel" style="margin-bottom:16px">
            <div class="kpi-section-title" style="color:${colors[i % colors.length]}">${dev}</div>
            <div style="position:relative;height:160px">
              <canvas id="chart_${i}" role="img" aria-label="Temperature trend for ${dev}"></canvas>
            </div>
          </div>`;
      }).join("");

      // Load Chart.js then draw
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
      script.onload = () => {
        devices.forEach((dev, i) => {
          const readings = data.filter(d => d.device_id === dev)
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          const labels = readings.map(r => String(r.timestamp).split("T")[1]?.slice(0,5) || r.timestamp);
          const temps  = readings.map(r => r.telemetry?.temperature || 0);
          new Chart(document.getElementById(`chart_${i}`), {
            type: "line",
            data: {
              labels,
              datasets: [{
                label: "Temperature (°C)",
                data:  temps,
                borderColor: colors[i % colors.length],
                backgroundColor: colors[i % colors.length] + "22",
                tension: 0.3,
                fill: true,
                pointRadius: 4
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: {
                  beginAtZero: false,
                  grid: { color: "rgba(255,255,255,0.06)" },
                  ticks: { color: "#888", font: { size: 10 } }
                },
                x: {
                  grid: { color: "rgba(255,255,255,0.04)" },
                  ticks: { color: "#888", font: { size: 10 }, maxRotation: 0 }
                }
              }
            }
          });
        });
      };
      document.head.appendChild(script);
      setPage("IoT Chart", `${devices.length} devices · ${data.length} readings`);
    })
    .catch(() => showEmpty("Cannot load IoT data"));
}

// ═══════════════════════════════════════════════════════
// EXPORT CSV
// ═══════════════════════════════════════════════════════
function exportCSV() {
  if (!lastData.length) { showAlert("No data to export — load a view first", "yellow"); return; }
  const keys = Object.keys(lastData[0]).filter(k => k !== "_id" && k !== "created_at");
  let csv = keys.join(",") + "\n";
  lastData.forEach(row => {
    csv += keys.map(k => {
      const v = row[k];
      if (typeof v === "object" && v !== null) return `"${JSON.stringify(v).replace(/"/g,'""')}"`;
      return `"${String(v ?? "").replace(/"/g,'""')}"`;
    }).join(",") + "\n";
  });
  const blob = new Blob([csv], { type:"text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement("a"), { href:url, download:`${currentView}_${Date.now()}.csv` });
  a.click();
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════════════
// EXPORT PDF — formatted table with autoTable
// ═══════════════════════════════════════════════════════
function exportPDF() {
  if (!lastData.length) { showAlert("No data to export — load a view first", "yellow"); return; }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:"landscape", unit:"mm", format:"a4" });

  // ── Header bar
  doc.setFillColor(13, 19, 32);
  doc.rect(0, 0, 297, 22, "F");

  doc.setTextColor(0, 212, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica","bold");
  doc.text("AeroNet Data System", 10, 10);

  doc.setTextColor(200, 210, 230);
  doc.setFontSize(9);
  doc.setFont("helvetica","normal");
  doc.text(pageTitle.textContent, 10, 17);

  doc.setTextColor(90, 106, 130);
  doc.setFontSize(8);
  doc.text(`Role: ${ROLES[currentRole].label}  ·  User: ${currentUser}  ·  Exported: ${new Date().toLocaleString()}`, 10, 22);

  // ── Table
  const keys    = Object.keys(lastData[0]).filter(k => k !== "_id" && k !== "created_at" && k !== "updated_at");
  const headers = [keys.map(k => k.replace(/_/g," ").toUpperCase())];
  const rows    = lastData.map(row =>
    keys.map(k => {
      const v = row[k];
      if (typeof v === "object" && v !== null) return JSON.stringify(v);
      return String(v ?? "—");
    })
  );

  doc.autoTable({
    startY: 26,
    head:   headers,
    body:   rows,
    theme:  "grid",
    styles: {
      fontSize:    8,
      cellPadding: 3,
      textColor:   [20, 30, 50],
      lineColor:   [200, 210, 220],
      lineWidth:   0.1,
    },
    headStyles: {
      fillColor:  [30, 74, 158],
      textColor:  [255, 255, 255],
      fontStyle:  "bold",
      fontSize:   8,
    },
    alternateRowStyles: { fillColor: [242, 245, 250] },
    margin: { left:10, right:10 },
  });

  // ── Footer on each page
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFillColor(13, 19, 32);
    doc.rect(0, 198, 297, 12, "F");
    doc.setFontSize(7);
    doc.setTextColor(90, 106, 130);
    doc.text(`AeroNetB · 5CM506 Data Driven Systems · ${pageTitle.textContent}`, 10, 205);
    doc.text(`Page ${i} of ${pages}`, 280, 205, { align:"right" });
  }

  doc.save(`aeronet_${currentView}_${Date.now()}.pdf`);
}