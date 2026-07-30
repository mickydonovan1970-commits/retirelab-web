
function getSimulationById(id){
  return simulationHistoryRecords.find(r=>r.id===id)||null;
}
function simulationLabel(r){
  return `${simulationDisplayName(r)} — ${pct(r.objectiveMet)} objective`;
}
function refreshComparisonSelectors(){
  const a=document.getElementById('compareSelectA');
  const b=document.getElementById('compareSelectB');
  if(!a||!b)return;
  const prevA=a.value,prevB=b.value;
  const options=simulationHistoryRecords.map(r=>`<option value="${r.id}">${simulationLabel(r)}</option>`).join('');
  a.innerHTML=options;b.innerHTML=options;
  if(simulationHistoryRecords.length){
    a.value=simulationHistoryRecords.some(r=>r.id===prevA)?prevA:simulationHistoryRecords[Math.min(1,simulationHistoryRecords.length-1)].id;
    b.value=simulationHistoryRecords.some(r=>r.id===prevB)?prevB:simulationHistoryRecords[0].id;
  }
}
function deltaClass(value){
  if(Math.abs(value)<1e-9)return 'delta-neutral';
  return value>0?'delta-positive':'delta-negative';
}
function addCompareRow(label,a,b,formatter,goodWhenHigher=true){
  const diff=b-a;
  const tr=document.createElement('tr');
  let cls='delta-neutral';
  if(Math.abs(diff)>=1e-9){
    const good=goodWhenHigher?diff>0:diff<0;
    cls=good?'delta-positive':'delta-negative';
  }
  tr.innerHTML=`<td>${label}</td><td>${formatter(a)}</td><td>${formatter(b)}</td><td class="${cls}">${diff>0?'+':''}${formatter(diff)}</td>`;
  comparisonBody.appendChild(tr);
}
function renderComparison(){
  const a=getSimulationById(compareSelectA.value);
  const b=getSimulationById(compareSelectB.value);
  if(!a||!b){
    comparisonEmpty.classList.remove('hidden');
    comparisonContent.classList.add('hidden');
    return;
  }
  comparisonEmpty.classList.add('hidden');
  comparisonContent.classList.remove('hidden');
  compareHeadA.textContent=simulationDisplayName(a);
  compareHeadB.textContent=simulationDisplayName(b);
  summaryTitleA.textContent=simulationDisplayName(a);
  summaryTitleB.textContent=simulationDisplayName(b);
  summaryA.textContent=a.summary;
  summaryB.textContent=b.summary;
  comparisonBody.innerHTML='';
  addCompareRow('Objective met',a.objectiveMet,b.objectiveMet,x=>`${(x*100).toFixed(1)}%`,true);
  addCompareRow('Median at objective age',a.objectiveMedian,b.objectiveMedian,gbp,true);
  addCompareRow('Median vs target',a.objectiveMedian-a.objectiveTarget,b.objectiveMedian-b.objectiveTarget,gbp,true);
  addCompareRow('Plan success',a.success,b.success,x=>`${(x*100).toFixed(1)}%`,true);
  addCompareRow('Survival to end age',a.survive,b.survive,x=>`${(x*100).toFixed(1)}%`,true);
  addCompareRow('10th percentile at end age',a.p10,b.p10,gbp,true);
  addCompareRow('Median at end age',a.median,b.median,gbp,true);
  addCompareRow('90th percentile at end age',a.p90,b.p90,gbp,true);
  const cashA=+(a.plan?.basics?.cashStart||0),cashB=+(b.plan?.basics?.cashStart||0);
  addCompareRow('Starting cash bucket',cashA,cashB,gbp,false);
}
function restoreRows(tableSelector,rows,addFn){
  document.querySelector(`${tableSelector} tbody`).innerHTML='';
  (rows||[]).forEach(addFn);
}
function loadSimulationRecord(record){
  if(!record||!record.plan)return;
  const d=cloneSimple(record.plan);
  Object.entries(d.basics||{}).forEach(([k,v])=>{
    const el=document.getElementById(k);
    if(el)el.value=v;
  });
  (d.funds||[]).forEach((f,i)=>{
    if(fundDefs[i])Object.assign(fundDefs[i],f);
  });
  renderFunds();
  syncSippToCore();
  restoreRows('#incomeTable',d.incomes,addIncomeRow);
  restoreRows('#expenseTable',d.expenses,addExpenseRow);
  openTab('dashboard');
  alert(`${simulationDisplayName(record)} has been loaded into the app.`);
}
function deleteSimulationRecord(record){
  if(!record)return;
  if(!confirm(`Delete ${simulationDisplayName(record)}?`))return;
  simulationHistoryRecords=simulationHistoryRecords.filter(r=>r.id!==record.id);
  renderSimulationHistory();
  refreshComparisonSelectors();
  renderComparison();
}
runComparison.addEventListener('click',renderComparison);
loadSimulationA.addEventListener('click',()=>loadSimulationRecord(getSimulationById(compareSelectA.value)));
loadSimulationB.addEventListener('click',()=>loadSimulationRecord(getSimulationById(compareSelectB.value)));
deleteSimulationA.addEventListener('click',()=>deleteSimulationRecord(getSimulationById(compareSelectA.value)));
deleteSimulationB.addEventListener('click',()=>deleteSimulationRecord(getSimulationById(compareSelectB.value)));
compareSelectA.addEventListener('change',renderComparison);
compareSelectB.addEventListener('change',renderComparison);
setTimeout(refreshComparisonSelectors,0);
