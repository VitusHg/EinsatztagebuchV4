const STORAGE_KEY = 'einsatzTagebuchV4';
const timeFields = ['Alarm', 'Anfahrt', 'Einsatzort', 'Transport', 'Ziel', 'Einsatzende'];

const defaults = {
  services: [],
  alarmCodes: window.ALARM_CODES || [],
  pzcCodes: window.PZC_CODES || []
};

let state = loadState();
let selectedServiceId = null;
let editingIncidentId = null;

const byId = (id) => document.getElementById(id);

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return normalizeState({ ...defaults, ...parsed });
  } catch {
    return structuredClone(defaults);
  }
}

function saveState() {
  state = normalizeState(state);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render();
}

function normalizeState(raw) {
  return {
    ...raw,
    services: Array.isArray(raw.services) ? raw.services : [],
    alarmCodes: dedupeByCode(Array.isArray(raw.alarmCodes) ? raw.alarmCodes : defaults.alarmCodes),
    pzcCodes: dedupeByCode(Array.isArray(raw.pzcCodes) ? raw.pzcCodes : defaults.pzcCodes)
  };
}

function dedupeByCode(entries) {
  const seen = new Set();
  return entries.filter((entry) => {
    const code = entry?.code?.trim();
    if (!code || seen.has(code)) return false;
    seen.add(code);
    return true;
  });
}

function uid() { return crypto.randomUUID(); }

function render() {
  renderServiceList();
  renderServiceDetail();
  renderStats();
  renderCodes();
  renderAlarmDatalist();
  renderPzcDatalist();
}

function renderServiceList() {
  const root = byId('service-list');
  root.innerHTML = '';
  const sorted = [...state.services].sort((a, b) => b.date.localeCompare(a.date));
  sorted.forEach((s) => {
    const card = document.createElement('button');
    card.className = 'card';
    card.innerHTML = `<h4>${s.date} · ${s.vehicle}</h4><div class="meta">${s.station} · ${s.incidents.length} Einsätze</div>`;
    card.onclick = () => selectService(s.id);
    root.append(card);
  });
}

function selectService(id) {
  selectedServiceId = id;
  renderServiceDetail();
  const panel = byId('service-detail-panel');
  panel.classList.add('show-mobile');
}

function serviceById() {
  return state.services.find((s) => s.id === selectedServiceId);
}

function calcDuration(times) {
  const vals = Object.values(times).filter(Boolean).sort();
  if (vals.length < 2) return '-';
  const [start, end] = [vals[0], vals[vals.length - 1]];
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const min = (eh * 60 + em) - (sh * 60 + sm);
  if (min <= 0) return '-';
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

function pzcDiagnosis(code) {
  return state.pzcCodes.find((p) => p.code === code)?.diagnosis || 'Unbekannt';
}

function renderServiceDetail() {
  const s = serviceById();
  byId('btn-new-incident').disabled = !s;
  byId('service-title').textContent = s ? `${s.date} · ${s.vehicle}` : 'Dienst auswählen';
  byId('service-meta').textContent = s ? `${s.station} · ${s.incidents.length} Einsätze` : '';
  const list = byId('incident-list');
  list.innerHTML = '';
  if (!s) return;
  s.incidents.forEach((i) => {
    const dur = calcDuration(i.times || {});
    const pzc = i.pzc ? `${i.pzc} (${pzcDiagnosis(i.pzc)})` : '-';
    const statusStrip = timeFields.map((field) => {
      const t = i.times?.[field];
      return `<span class="status-chip ${t ? 'on' : ''}">${field}${t ? ` ${t}` : ''}</span>`;
    }).join('');
    const card = document.createElement('article');
    card.className = 'card incident-row';
    card.innerHTML = `<div><h4>${i.alarmCode}</h4><div class="meta">⏱️ ${dur} · PZC: ${pzc}</div></div>
      <div><span class="pill ${i.lights ? 'blue' : ''}">${i.lights ? '🚨' : '⚪'}</span></div>
      <div class="status-strip">${statusStrip}</div>`;
    card.onclick = () => openIncidentDialog(i.id);
    list.append(card);
  });
}

function renderStats() {
  const root = byId('stats');
  const incidents = state.services.flatMap((s) => s.incidents);
  const byCode = incidents.reduce((acc, i) => ((acc[i.alarmCode] = (acc[i.alarmCode] || 0) + 1), acc), {});
  const top = Object.entries(byCode).sort((a, b) => b[1] - a[1]).slice(0, 5);
  root.innerHTML = `
    <div class="card"><h4>Gesamt Einsätze</h4><div>${incidents.length}</div></div>
    <div class="card"><h4>Dienste</h4><div>${state.services.length}</div></div>
    <div class="card"><h4>Blaulicht-Quote</h4><div>${incidents.length ? Math.round(100 * incidents.filter((i) => i.lights).length / incidents.length) : 0}%</div></div>
    <div class="card"><h4>Häufigste PZC</h4><div class="meta">${topPzc(incidents)}</div></div>
    <div class="card"><h4>Häufige Stichworte</h4><div class="meta">${top.map(([k, v]) => `${k} (${v})`).join(', ') || '-'}</div></div>
  `;
}

function topPzc(incidents) {
  const pzcCount = incidents.filter((i) => i.pzc).reduce((acc, i) => ((acc[i.pzc] = (acc[i.pzc] || 0) + 1), acc), {});
  return Object.entries(pzcCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} (${v})`).join(', ') || '-';
}

function renderCodes() {
  const ac = byId('alarm-code-list');
  const pc = byId('pzc-code-list');
  ac.innerHTML = '';
  pc.innerHTML = '';
  state.alarmCodes.forEach((a) => ac.append(codeCard(`${a.code} ${a.autoLights ? '🚨' : ''}`)));
  state.pzcCodes.forEach((p) => pc.append(codeCard(`${p.code} → ${p.diagnosis}`)));
}

function codeCard(text) {
  const div = document.createElement('div');
  div.className = 'card';
  div.textContent = text;
  return div;
}

function renderAlarmDatalist() {
  byId('alarm-codes').innerHTML = state.alarmCodes.map((c) => `<option value="${c.code}">`).join('');
}
function renderPzcDatalist() {
  byId('pzc-codes').innerHTML = state.pzcCodes.map((p) => `<option value="${p.code}">${p.diagnosis}</option>`).join('');
}

function openServiceDialog() {
  byId('service-form').reset();
  byId('service-dialog').showModal();
}

function openIncidentDialog(incidentId = null) {
  editingIncidentId = incidentId;
  const form = byId('incident-form');
  form.reset();
  buildTimeButtons();
  if (incidentId) {
    const inc = serviceById().incidents.find((i) => i.id === incidentId);
    form.alarmCode.value = inc.alarmCode;
    form.lights.checked = inc.lights;
    form.pzc.value = inc.pzc || '';
    form.note.value = inc.note || '';
    [...byId('time-grid').querySelectorAll('.time-btn')].forEach((btn) => {
      const val = inc.times?.[btn.dataset.key];
      if (val) { btn.dataset.time = val; btn.classList.add('active'); btn.querySelector('small').textContent = val; }
    });
    updatePzcPreview();
  }
  byId('incident-dialog').showModal();
}

function buildTimeButtons() {
  const root = byId('time-grid');
  root.innerHTML = '';
  timeFields.forEach((k) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'time-btn';
    b.dataset.key = k;
    b.innerHTML = `<strong>${k}</strong><small>--:--</small>`;
    b.onclick = () => {
      const t = prompt(`${k} (HH:MM)`, b.dataset.time || '');
      if (!t) return;
      if (!/^\d{2}:\d{2}$/.test(t)) return alert('Bitte Zeit im Format HH:MM eingeben.');
      b.dataset.time = t;
      b.classList.add('active');
      b.querySelector('small').textContent = t;
    };
    root.append(b);
  });
}

function updatePzcPreview() {
  const form = byId('incident-form');
  const code = form.pzc.value.trim();
  byId('pzc-preview').textContent = `Diagnose: ${code ? pzcDiagnosis(code) : '-'}`;
}

byId('btn-new-service').onclick = openServiceDialog;
byId('btn-new-incident').onclick = () => openIncidentDialog();
byId('btn-back').onclick = () => byId('service-detail-panel').classList.remove('show-mobile');

byId('service-form').onsubmit = (e) => {
  e.preventDefault();
  const f = e.target;
  const s = { id: uid(), date: f.date.value, vehicle: f.vehicle.value, station: f.station.value, incidents: [] };
  state.services.push(s);
  selectedServiceId = s.id;
  byId('service-dialog').close();
  saveState();
};

byId('incident-form').onsubmit = (e) => {
  e.preventDefault();
  const f = e.target;
  const s = serviceById();
  const alarmCode = f.alarmCode.value.trim();
  const auto = state.alarmCodes.find((a) => a.code === alarmCode)?.autoLights;
  const times = Object.fromEntries([...byId('time-grid').querySelectorAll('.time-btn')].filter((b) => b.dataset.time).map((b) => [b.dataset.key, b.dataset.time]));
  const payload = {
    id: editingIncidentId || uid(),
    alarmCode,
    lights: auto ?? f.lights.checked,
    times,
    pzc: f.pzc.value.trim(),
    note: f.note.value.trim()
  };
  if (editingIncidentId) s.incidents = s.incidents.map((i) => i.id === editingIncidentId ? payload : i);
  else s.incidents.push(payload);
  byId('incident-dialog').close();
  saveState();
};

byId('incident-form').pzc.addEventListener('input', updatePzcPreview);
byId('incident-form').alarmCode.addEventListener('change', (e) => {
  const auto = state.alarmCodes.find((a) => a.code === e.target.value)?.autoLights;
  if (auto !== undefined) byId('incident-form').lights.checked = auto;
});

byId('btn-add-alarm').onclick = () => {
  const code = prompt('Alarmcode');
  if (!code?.trim()) return;
  state.alarmCodes.push({ code: code.trim(), autoLights: confirm('Automatisch Blaulicht setzen?') });
  saveState();
};
byId('btn-add-pzc').onclick = () => {
  const code = prompt('PZC-Code');
  const diagnosis = prompt('Diagnose');
  if (!code?.trim() || !diagnosis?.trim()) return;
  state.pzcCodes.push({ code: code.trim(), diagnosis: diagnosis.trim() });
  saveState();
};

byId('btn-export').onclick = () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `einsatztagebuch-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
};
byId('import-input').onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  state = normalizeState({ ...defaults, ...JSON.parse(await file.text()) });
  saveState();
};

document.querySelectorAll('.tab').forEach((b) => {
  b.onclick = () => {
    document.querySelectorAll('.tab').forEach((x) => x.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    byId(`tab-${b.dataset.tab}`).classList.add('active');
  };
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');

render();
