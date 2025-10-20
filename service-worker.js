self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open('ls-cache-v1').then(c=>c.addAll([
    '.', 'index.html', 'styles.css', 'app.js', 'manifest.json',
    'Full_Weekly_Fitness_Schedule.pdf',
    'Grocery_List_Lean_Shred.pdf',
    'Meal_Prep_Guide_Lean_Shred.pdf',
    'Monthly_Progress_Tracker_Lean_Shred.pdf',
    'Lean_Shred_Wall_Calendar.pdf'
  ])));
});
self.addEventListener('fetch', (e)=>{
  e.respondWith(caches.match(e.request).then(res=>res || fetch(e.request)));
});