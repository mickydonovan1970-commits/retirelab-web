
const RETIRELAB_STORAGE_KEY='retirelab-v2.9-projects';
let projectStore={version:1,activeProjectId:null,projects:[]};
let projectSystemReady=false;
let projectSaveTimer=null;
let projectLoadInProgress=false;

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
  if(!p||!projectSystemReady||projectLoadInProgress)return;
  p.plan=safePlanSnapshot();
  p.currency=typeof getRetireLabCurrency==='function'?getRetireLabCurrency():'GBP';
  p.history=cloneSimple(simulationHistoryRecords||[]);
  p.nextSimulationNumber=nextSimulationNumber||1;
  p.lastTab=currentTabName();
  p.updatedAt=new Date().toISOString();
}
function persistProjectStore(showStatus=true){
  if(!projectSystemReady||projectLoadInProgress)return;
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
  if(!projectSystemReady||projectLoadInProgress)return;
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
    if(el){if(el.type==='checkbox')el.checked=!!v;else el.value=v}
  });
  if(Array.isArray(d.funds)&&d.funds.length){
    fundDefs.splice(0,fundDefs.length,...d.funds.map(f=>({
      ...f,
      id:f.id||('fund-'+Date.now()+'-'+Math.random().toString(36).slice(2,7)),
      name:f.name||'Unnamed fund',
      value:+f.value||0,
      ret:Number(f.ret)||0,
      vol:Math.max(0,Number(f.vol)||0),
      corr:Math.max(0,Math.min(.99,f.corr===undefined?.8:Number(f.corr)||0)),
      profile:f.profile||'custom'
    })));
  }
  renderFunds();
  syncSippToCore();
  document.querySelector('#incomeTable tbody').innerHTML='';
  (d.incomes||[]).forEach(addIncomeRow);
  document.querySelector('#expenseTable tbody').innerHTML='';
  (d.expenses||[]).forEach(addExpenseRow);
  if(window.applyAccumulationState)window.applyAccumulationState(d.accumulation);
  if(window.applyExpenditureOptimiserState)window.applyExpenditureOptimiserState();
}
function loadProjectById(id,{capturePrevious=false}={}){
  const p=projectStore.projects.find(x=>x.id===id);
  if(!p)return false;

  // Capture only the project that the current UI actually represents.
  // Never capture after activeProjectId has already been changed to the destination.
  if(capturePrevious&&projectSystemReady&&projectStore.activeProjectId!==id){
    captureCurrentProject();
  }

  clearTimeout(projectSaveTimer);
  projectLoadInProgress=true;
  try{
    projectStore.activeProjectId=id;
    if(typeof setRetireLabCurrency==='function')setRetireLabCurrency(p.currency||'GBP',{save:false});
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
  }finally{
    projectLoadInProgress=false;
  }

  // Persist the active-project pointer without re-capturing the freshly loaded UI.
  try{
    localStorage.setItem(RETIRELAB_STORAGE_KEY,JSON.stringify(projectStore));
  }catch(err){
    autoSaveStatus.value='Save failed — storage may be full';
    console.error(err);
  }
  return true;
}
function blankProjectPlan(){
  return safePlanSnapshot();
}
function createProject(name,sourceProject=null){
  // Make sure the source project contains the latest UI before cloning it.
  if(projectSystemReady&&!projectLoadInProgress)captureCurrentProject();

  const source=sourceProject
    ?projectStore.projects.find(p=>p.id===sourceProject.id)||sourceProject
    :null;
  const id=makeProjectId();
  const p={
    id,
    name:name||'Untitled project',
    plan:source?cloneSimple(source.plan):blankProjectPlan(),
    currency:source?(source.currency||'GBP'):(typeof getRetireLabCurrency==='function'?getRetireLabCurrency():'GBP'),
    history:source?cloneSimple(source.history||[]):[],
    nextSimulationNumber:source?(source.nextSimulationNumber||1):1,
    lastTab:'dashboard',
    createdAt:new Date().toISOString(),
    updatedAt:new Date().toISOString()
  };
  projectStore.projects.push(p);
  refreshProjectSelector();
  loadProjectById(id,{capturePrevious:false});
  persistProjectStore(true);
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
        currency:typeof getRetireLabCurrency==='function'?getRetireLabCurrency():'GBP',
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
  // Startup UI still contains HTML defaults, so never capture it here.
  loadProjectById(projectStore.activeProjectId,{capturePrevious:false});
  autoSaveStatus.value='Auto-save on';
}

projectSelector.addEventListener('change',()=>{
  const destinationId=projectSelector.value;
  captureCurrentProject();
  loadProjectById(destinationId,{capturePrevious:false});
  persistProjectStore(false);
});
newProjectBtn.addEventListener('click',()=>{
  const name=prompt('Name the new project:','New Retirement Plan');
  if(name&&name.trim())createProject(name.trim());
});
duplicateProjectBtn.addEventListener('click',()=>{
  captureCurrentProject();
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
  const destinationId=projectStore.projects.find(x=>x.id!==p.id)?.id;
  projectStore.projects=projectStore.projects.filter(x=>x.id!==p.id);
  refreshProjectSelector();
  loadProjectById(destinationId,{capturePrevious:false});
  persistProjectStore(true);
});
exportProjectBtn.addEventListener('click',()=>{
  captureCurrentProject();
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
    if(payload.format&&payload.format!=='RetireLab Project')throw new Error('Not a valid RetireLab project file');
    captureCurrentProject();
    const imported=cloneSimple(payload.project);
    imported.id=makeProjectId();
    imported.name=String(file.name||'Imported Project')
      .replace(/\.json$/i,'')
      .trim()||'Imported Project';
    imported.currency=imported.currency||'GBP';
    imported.history=Array.isArray(imported.history)?imported.history:[];
    imported.nextSimulationNumber=imported.nextSimulationNumber||(
      imported.history.length?Math.max(...imported.history.map(r=>r.number||0))+1:1
    );
    imported.lastTab=imported.lastTab||'dashboard';
    imported.createdAt=new Date().toISOString();
    imported.updatedAt=new Date().toISOString();
    projectStore.projects.push(imported);
    refreshProjectSelector();
    loadProjectById(imported.id,{capturePrevious:false});
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
