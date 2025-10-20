// PWA install handling
let deferredPrompt;
const installBtn = document.getElementById('installBtn');
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = 'inline-block';
});
installBtn?.addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.style.display = 'none';
  }
});

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js');
  });
}

// Tabs
const tabs = document.querySelectorAll('.tabs button');
const sections = document.querySelectorAll('.tab');
tabs.forEach(btn => btn.addEventListener('click', () => {
  tabs.forEach(b=>b.classList.remove('active'));
  sections.forEach(s=>s.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(btn.dataset.tab).classList.add('active');
}));

// Local storage helpers
const LS = {
  get: (k, def=null)=>{ try{return JSON.parse(localStorage.getItem(k))??def}catch{return def} },
  set: (k,v)=> localStorage.setItem(k, JSON.stringify(v))
};

// Weight progress
const startWeight = 220;
const goalWeight = 175;
const saveWeightBtn = document.getElementById('saveWeight');
const weightInput = document.getElementById('weightInput');
const weightProgress = document.getElementById('weightProgress');
const weightStatus = document.getElementById('weightStatus');

function updateWeightUI(){
  const w = LS.get('weight', startWeight);
  weightInput.value = w;
  const lost = Math.max(0, startWeight - w);
  weightProgress.value = Math.min(45, lost);
  weightStatus.textContent = `Lost ${lost.toFixed(1)} lb of 45 lb goal`;
}
saveWeightBtn?.addEventListener('click', ()=>{
  const w = parseFloat(weightInput.value||startWeight);
  LS.set('weight', w);
  updateWeightUI();
});
updateWeightUI();

// Water
const waterProgress = document.getElementById('waterProgress');
document.getElementById('saveWater')?.addEventListener('click', ()=>{
  const val = parseFloat(document.getElementById('waterToday').value||0);
  waterProgress.value = Math.min(3, val);
  LS.set('waterToday', val);
});

// Habits
const habitBoxes = document.querySelectorAll('.habit');
function updateHabits(){ 
  let count = 0; habitBoxes.forEach((b,i)=>{const v=!!LS.get('habit'+i,false);b.checked=v; if(v)count++});
  document.getElementById('habitProgress').value = count;
}
habitBoxes.forEach((b,i)=> b.addEventListener('change', ()=>{ LS.set('habit'+i, b.checked); updateHabits(); }));
updateHabits();

// Daily tracker save/load
const saveWeekBtn = document.getElementById('saveWeek');
const clearWeekBtn = document.getElementById('clearWeek');
const exportBtn = document.getElementById('exportData');
const importFile = document.getElementById('importFile');
const reflection = document.getElementById('reflection');

function rows(){
  return Array.from(document.querySelectorAll('.tracker-grid .row')).slice(1);
}
function loadWeek(){
  const data = LS.get('weekData', {});
  rows().forEach(r=>{
    const day = r.dataset.day;
    const inputs = r.querySelectorAll('input');
    const saved = data[day]||{};
    inputs[0].value = saved.workout||'';
    inputs[1].value = saved.meals||'';
    inputs[2].value = saved.hydration||'';
    inputs[3].value = saved.sleep||'';
    inputs[4].value = saved.notes||'';
  });
  reflection.value = LS.get('reflection','');
}
function saveWeek(){
  const data = {};
  rows().forEach(r=>{
    const day = r.dataset.day;
    const inputs = r.querySelectorAll('input');
    data[day] = {
      workout: inputs[0].value,
      meals: inputs[1].value,
      hydration: inputs[2].value,
      sleep: inputs[3].value,
      notes: inputs[4].value
    };
  });
  LS.set('weekData', data);
  LS.set('reflection', reflection.value);
  alert('Week saved.');
}
function clearWeek(){
  if(confirm('Clear this week?')){
    LS.set('weekData', {});
    LS.set('reflection', '');
    loadWeek();
  }
}
saveWeekBtn?.addEventListener('click', saveWeek);
clearWeekBtn?.addEventListener('click', clearWeek);
exportBtn?.addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify({ 
    weight: LS.get('weight', startWeight),
    waterToday: LS.get('waterToday', 0),
    habits: Array.from(habitBoxes).map((_,i)=>LS.get('habit'+i,false)),
    weekData: LS.get('weekData', {}),
    reflection: LS.get('reflection','')
  }, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'lean_shred_backup.json';
  a.click();
});
importFile?.addEventListener('change', (e)=>{
  const file = e.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const obj = JSON.parse(reader.result);
      if(obj.weight!==undefined) LS.set('weight', obj.weight);
      if(obj.waterToday!==undefined) LS.set('waterToday', obj.waterToday);
      if(Array.isArray(obj.habits)) obj.habits.forEach((v,i)=>LS.set('habit'+i, v));
      if(obj.weekData) LS.set('weekData', obj.weekData);
      if(obj.reflection!==undefined) LS.set('reflection', obj.reflection);
      updateWeightUI(); updateHabits(); loadWeek();
      alert('Import complete.');
    }catch(err){ alert('Invalid file.'); }
  };
  reader.readAsText(file);
});

// Weekly schedule content (static summary)
document.getElementById('scheduleContent').innerHTML = `
<ul class="schedule">
  <li><b>Mon</b> — 7:20 Breakfast (Protein Oat Bowl) • 9:00 Gym (Push, 1h15) • 3–8 Work • 8:30 Dinner (Turkey Pasta)</li>
  <li><b>Tue</b> — Classes 9:35–5:20 • 6:30 Gym (Pull) • Dinner Chicken Stir-Fry • Study 9–10</li>
  <li><b>Wed</b> — 2:20–5:20 Class • 6:30 Gym (Legs) • Dinner Tacos</li>
  <li><b>Thu</b> — Classes • 6:30 Movie night • 9:30 Dinner (Turkey Pasta)</li>
  <li><b>Fri</b> — 3:30–11 Work • AM Gym (Full Body)</li>
  <li><b>Sat</b> — 10:00 Meal Prep • 4:30–9 Work • Friends after</li>
  <li><b>Sun</b> — Meal Prep AM • 2:00 Gym (Push) • Plan week</li>
</ul>`;

loadWeek();
