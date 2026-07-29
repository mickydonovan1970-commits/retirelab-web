
const RETIRELAB_STORAGE_KEY='retirelab-v2.9-projects';
let projectStore={version:1,activeProjectId:null,projects:[]};
let projectSystemReady=false;
let projectSaveTimer=null;

function makeProjectId(){
  return 'project-'+Date.now()+'-'+Math.random().toString(36).slice(2,8);
}
function currentTabName(){
  return document.querySelector('.tabbtn.active')?.dataset.tab||'dashboard';
}
function safePlanSnapshot(){
  try{return cloneSimple(serialise())}catch(e){return null}
}
function currentProject(){
  return projectStore.projects.find(p=>p.id===projectStore.activeProjectId)||null;
}
function captureCurrentProject(){
  const p=currentProject();
  if(!p||!projectSystemReady)return;
  p.plan=safePlanSnapshot();
  p.history=cloneSimple(simulationHistoryRecords||[]);
  p.nextSimulationNumber=nextSimulationNumber||1;
  p.lastTab=currentTabName();
  p.updatedAt=new Date().toISOString();
}
function persistProjectStore(showStatus=true){
  if(!projectSystemReady)return;
  captureCurrentProject();
  try{
    localStorage.setItem(RETIRELAB_STORAGE_KEY,JSON.stringify(projectStore));
    if(showStatus){
      autoSaveStatus.value='Saved '+new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
    }
  }catch(err){
    autoSaveStatus.value='Save failed — storage may be full';
    console.error(err);
  }
}
function scheduleProjectSave(){
  if(!projectSystemReady)return;
  autoSaveStatus.value='Saving…';
  clearTimeout(projectSaveTimer);
  projectSaveTimer=setTimeout(()=>persistProjectStore(true),350);
}
function refreshProjectSelector(){
  projectSelector.innerHTML=projectStore.projects
    .map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
  projectSelector.value=projectStore.activeProjectId||'';
}
function applyPlanSnapshot(d){
  if(!d)return;
  Object.entries(d.basics||{}).forEach(([k,v])=>{
    const el=document.getElementById(k);
    if(el)el.value=v;
  });
  if(Array.isArray(d.funds)&&d.funds.length){
    fundDefs.splice(0,fundDefs.length,...d.funds.map(f=>({
      name:f.name||'Unnamed fund',
      value:+f.value||0,
      ret:+f.ret||0,
      vol:Math.max(.1,+f.vol||.1),
      corr:Math.max(0,Math.min(.99,f.corr===undefined?.8:+f.corr)),
      profile:f.profile||'custom'
    })));
  }
  renderFunds();
  syncSippToCore();
  document.querySelector('#incomeTable tbody').innerHTML='';
  (d.incomes||[]).forEach(addIncomeRow);
  document.querySelector('#expenseTable tbody').innerHTML='';
  (d.expenses||[]).forEach(addExpenseRow);
}
function loadProjectById(id){
  if(projectSystemReady)captureCurrentProject();
  const p=projectStore.projects.find(x=>x.id===id);
  if(!p)return;
  projectStore.activeProjectId=id;
  applyPlanSnapshot(cloneSimple(p.plan));
  simulationHistoryRecords=cloneSimple(p.history||[]);
  nextSimulationNumber=p.nextSimulationNumber||(
    simulationHistoryRecords.length?Math.max(...simulationHistoryRecords.map(r=>r.number||0))+1:1
  );
  renderSimulationHistory();
  refreshComparisonSelectors();
  if(simulationHistoryRecords.length>=2)renderComparison();
  refreshProjectSelector();
  openTab(p.lastTab||'dashboard');
  autoSaveStatus.value='Loaded';
  persistProjectStore(false);
}
function blankProjectPlan(){
  return safePlanSnapshot();
}
function createProject(name,sourceProject=null){
  const id=makeProjectId();
  const p={
    id,
    name:name||'Untitled project',
    plan:sourceProject?cloneSimple(sourceProject.plan):blankProjectPlan(),
    history:sourceProject?cloneSimple(sourceProject.history||[]):[],
    nextSimulationNumber:sourceProject?(sourceProject.nextSimulationNumber||1):1,
    lastTab:'dashboard',
    createdAt:new Date().toISOString(),
    updatedAt:new Date().toISOString()
  };
  projectStore.projects.push(p);
  projectStore.activeProjectId=id;
  refreshProjectSelector();
  loadProjectById(id);
}
function initialiseProjectSystem(){
  let loaded=null;
  try{
    const raw=localStorage.getItem(RETIRELAB_STORAGE_KEY);
    if(raw)loaded=JSON.parse(raw);
  }catch(e){console.error(e)}
  if(loaded&&Array.isArray(loaded.projects)&&loaded.projects.length){
    projectStore=loaded;
    if(!projectStore.projects.some(p=>p.id===projectStore.activeProjectId)){
      projectStore.activeProjectId=projectStore.projects[0].id;
    }
  }else{
    const id=makeProjectId();
    projectStore={
      version:1,
      activeProjectId:id,
      projects:[{
        id,
        name:'Main Retirement Plan',
        plan:safePlanSnapshot(),
        history:cloneSimple(simulationHistoryRecords||[]),
        nextSimulationNumber:nextSimulationNumber||1,
        lastTab:'dashboard',
        createdAt:new Date().toISOString(),
        updatedAt:new Date().toISOString()
      }]
    };
  }
  projectSystemReady=true;
  refreshProjectSelector();
  loadProjectById(projectStore.activeProjectId);
  autoSaveStatus.value='Auto-save on';
}

projectSelector.addEventListener('change',()=>{
  persistProjectStore(false);
  loadProjectById(projectSelector.value);
});
newProjectBtn.addEventListener('click',()=>{
  persistProjectStore(false);
  const name=prompt('Name the new project:','New Retirement Plan');
  if(name&&name.trim())createProject(name.trim());
});
duplicateProjectBtn.addEventListener('click',()=>{
  persistProjectStore(false);
  const source=currentProject();
  if(!source)return;
  const name=prompt('Name the duplicate:',source.name+' Copy');
  if(name&&name.trim())createProject(name.trim(),source);
});
renameProjectBtn.addEventListener('click',()=>{
  const p=currentProject();if(!p)return;
  const name=prompt('Rename project:',p.name);
  if(name&&name.trim()){
    p.name=name.trim();refreshProjectSelector();scheduleProjectSave();
  }
});
deleteProjectBtn.addEventListener('click',()=>{
  const p=currentProject();if(!p)return;
  if(projectStore.projects.length===1){
    alert('At least one project must remain. Create another project first.');
    return;
  }
  if(!confirm(`Delete "${p.name}" and all its simulations?`))return;
  projectStore.projects=projectStore.projects.filter(x=>x.id!==p.id);
  projectStore.activeProjectId=projectStore.projects[0].id;
  refreshProjectSelector();
  loadProjectById(projectStore.activeProjectId);
  persistProjectStore(true);
});
exportProjectBtn.addEventListener('click',()=>{
  persistProjectStore(false);
  const p=currentProject();if(!p)return;
  const payload={format:'RetireLab Project',version:1,exportedAt:new Date().toISOString(),project:cloneSimple(p)};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=(p.name.replace(/[^a-z0-9]+/gi,'_').replace(/^_|_$/g,'')||'RetireLab_Project')+'.json';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
importProjectBtn.addEventListener('click',()=>importProjectFile.click());
importProjectFile.addEventListener('change',async()=>{
  const file=importProjectFile.files?.[0];if(!file)return;
  try{
    const payload=JSON.parse(await file.text());
    if(!payload.project||!payload.project.plan)throw new Error('Not a valid RetireLab project file');
    const imported=cloneSimple(payload.project);
    imported.id=makeProjectId();
    imported.name=(imported.name||'Imported Project')+' (Imported)';
    imported.createdAt=new Date().toISOString();
    imported.updatedAt=new Date().toISOString();
    projectStore.projects.push(imported);
    projectStore.activeProjectId=imported.id;
    refreshProjectSelector();
    loadProjectById(imported.id);
    persistProjectStore(true);
  }catch(err){
    alert('Import failed: '+err.message);
  }finally{
    importProjectFile.value='';
  }
});

document.addEventListener('input',e=>{
  if(e.target.closest('#projectManagerCard'))return;
  scheduleProjectSave();
});
document.addEventListener('change',e=>{
  if(e.target.closest('#projectManagerCard'))return;
  scheduleProjectSave();
});
document.addEventListener('click',e=>{
  if(e.target.closest('.tabbtn,.remove-row,.bin-btn,.applySuggested,.quick-run-model,.quick-optimise-model')){
    scheduleProjectSave();
  }
});
window.addEventListener('beforeunload',()=>persistProjectStore(false));
setInterval(()=>persistProjectStore(false),5000);

// Save after history updates and project loads/deletes.
const originalSnapshotSimulationResultV29=snapshotSimulationResult;
snapshotSimulationResult=function(result){
  originalSnapshotSimulationResultV29(result);
  scheduleProjectSave();
};
const originalRenderSimulationHistoryV29=renderSimulationHistory;
renderSimulationHistory=function(){
  originalRenderSimulationHistoryV29();
  if(projectSystemReady)scheduleProjectSave();
};

setTimeout(initialiseProjectSystem,50);
