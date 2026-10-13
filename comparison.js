const comparisonSlotIds=['compareSelectA','compareSelectB','compareSelectC','compareSelectD'];
let loadedSimulationRecordId=null;

function getSimulationById(id){
  return simulationHistoryRecords.find(record=>record.id===id)||null;
}
function simulationLabel(record){
  return `${simulationDisplayName(record)} — ${pct(record.objectiveMet)} objective`;
}
function comparisonSelects(){
  return comparisonSlotIds.map(id=>document.getElementById(id)).filter(Boolean);
}
function selectedComparisonRecords(){
  const seen=new Set();
  return comparisonSelects().map(select=>getSimulationById(select.value)).filter(record=>{
    if(!record||seen.has(record.id))return false;
    seen.add(record.id);return true;
  });
}
function emptyOption(){return '<option value="">Not selected</option>';}
function refreshComparisonSelectors(){
  const selects=comparisonSelects();
  if(!selects.length)return;
  const previous=selects.map(select=>select.value);
  const options=simulationHistoryRecords.map(record=>`<option value="${record.id}">${escapeSimulationText(simulationLabel(record))}</option>`).join('');
  selects.forEach((select,index)=>{
    select.innerHTML=emptyOption()+options;
    const prior=previous[index];
    if(prior&&simulationHistoryRecords.some(record=>record.id===prior))select.value=prior;
  });
  if(!selects.some(select=>select.value)&&simulationHistoryRecords.length){
    selects[0].value=simulationHistoryRecords[0].id;
    if(simulationHistoryRecords[1])selects[1].value=simulationHistoryRecords[1].id;
  }
  renderComparison();
  renderStrategyLibrary();
}
function metricValue(record,key){
  const cash=+(record.plan?.basics?.cashStart||0);
  const values={
    objectiveMet:record.objectiveMet,
    objectiveMedian:record.objectiveMedian,
    objectiveGap:record.objectiveMedian-record.objectiveTarget,
    success:record.success,
    survive:record.survive,
    p10:record.p10,
    median:record.median,
    p90:record.p90,
    cash
  };
  return values[key];
}
const comparisonMetrics=[
  {label:'Objective met',key:'objectiveMet',formatter:value=>`${(value*100).toFixed(1)}%`,better:'high'},
  {label:'Median at objective age',key:'objectiveMedian',formatter:gbp,better:'high'},
  {label:'Median vs target',key:'objectiveGap',formatter:gbp,better:'high'},
  {label:'Plan success',key:'success',formatter:value=>`${(value*100).toFixed(1)}%`,better:'high'},
  {label:'Survival to end age',key:'survive',formatter:value=>`${(value*100).toFixed(1)}%`,better:'high'},
  {label:'10th percentile at end age',key:'p10',formatter:gbp,better:'high'},
  {label:'Median at end age',key:'median',formatter:gbp,better:'high'},
  {label:'90th percentile at end age',key:'p90',formatter:gbp,better:'high'}
];

function comparisonExtremes(values,better){
  const finite=values.filter(Number.isFinite);
  if(finite.length<2)return {best:new Set(),worst:new Set()};
  const high=Math.max(...finite),low=Math.min(...finite);
  const scale=Math.max(1,Math.abs(high),Math.abs(low));
  const tolerance=scale*1e-10;
  if(Math.abs(high-low)<=tolerance)return {best:new Set(),worst:new Set()};
  const bestValue=better==='low'?low:high;
  const worstValue=better==='low'?high:low;
  const best=new Set(),worst=new Set();
  values.forEach((value,index)=>{
    if(!Number.isFinite(value))return;
    if(Math.abs(value-bestValue)<=tolerance)best.add(index);
    if(Math.abs(value-worstValue)<=tolerance)worst.add(index);
  });
  return {best,worst};
}
function renderComparison(){
  const records=selectedComparisonRecords();
  if(!records.length){
    comparisonEmpty.classList.remove('hidden');
    comparisonContent.classList.add('hidden');
    return;
  }
  comparisonEmpty.classList.add('hidden');
  comparisonContent.classList.remove('hidden');
  comparisonHead.innerHTML=`<tr><th>Metric</th>${records.map((record,index)=>`<th class="strategy-identity strategy-identity-${index}"><span>${escapeSimulationText(simulationDisplayName(record))}</span></th>`).join('')}</tr>`;
  comparisonBody.innerHTML='';
  comparisonMetrics.forEach(({label,key,formatter,better})=>{
    const values=records.map(record=>metricValue(record,key));
    const extremes=comparisonExtremes(values,better);
    const row=document.createElement('tr');
    row.innerHTML=`<td>${label}</td>${values.map((value,index)=>{
      const state=extremes.best.has(index)?' compare-best':extremes.worst.has(index)?' compare-worst':'';
      return `<td class="comparison-value${state}">${formatter(value)}</td>`;
    }).join('')}`;
    comparisonBody.appendChild(row);
  });
  strategySummaryGrid.innerHTML=records.map((record,index)=>`
    <article class="strategy-summary-card strategy-summary-identity-${index}">
      <strong class="strategy-summary-name">${escapeSimulationText(simulationDisplayName(record))}</strong>
      <span>${escapeSimulationText(record.time||'')}</span>
      <p>${escapeSimulationText(record.summary||'')}</p>
      <button type="button" class="secondary small load-library-strategy" data-id="${record.id}">Load into RetireLab</button>
    </article>`).join('');
  strategySummaryGrid.querySelectorAll('.load-library-strategy').forEach(button=>button.addEventListener('click',()=>loadSimulationRecord(getSimulationById(button.dataset.id))));
}
function addRecordToComparison(record){
  if(!record)return;
  const selects=comparisonSelects();
  if(selects.some(select=>select.value===record.id)){renderComparison();return;}
  const target=selects.find(select=>!select.value)||selects[selects.length-1];
  if(target)target.value=record.id;
  renderComparison();
  renderStrategyLibrary();
}
function restoreRows(tableSelector,rows,addFn){
  document.querySelector(`${tableSelector} tbody`).innerHTML='';
  (rows||[]).forEach(addFn);
}
function loadSimulationRecord(record){
  if(!record||!record.plan)return;
  const data=cloneSimple(record.plan);

  // Use the same complete restoration path as project loading. This is
  // essential now that portfolios can contain any number of library or
  // custom funds: index-by-index assignment cannot reconstruct a strategy.
  if(typeof applyPlanSnapshot==='function')applyPlanSnapshot(data);
  else{
    Object.entries(data.basics||{}).forEach(([key,value])=>{
      const element=document.getElementById(key);
      if(element)element.value=value;
    });
    if(Array.isArray(data.funds)&&data.funds.length){
      fundDefs.splice(0,fundDefs.length,...data.funds.map(fund=>({...fund})));
    }
    renderFunds();
    syncSippToCore();
    restoreRows('#incomeTable',data.incomes,addIncomeRow);
    restoreRows('#expenseTable',data.expenses,addExpenseRow);
  }

  if(typeof renderFundLibrary==='function')renderFundLibrary();
  if(typeof renderAssumptionsTable==='function')renderAssumptionsTable();
  if(typeof updatePortfolioStatsV21==='function')updatePortfolioStatsV21();
  if(typeof renderDiversificationCheck==='function')renderDiversificationCheck();

  loadedSimulationRecordId=record.id;
  renderStrategyLibrary();
  if(typeof scheduleProjectSave==='function')scheduleProjectSave();
  openTab('strategy');
  alert(`${simulationDisplayName(record)} has been loaded into RetireLab.`);
}
function renameSimulationRecord(record){
  if(!record)return;
  const entered=prompt('Name this saved strategy:',simulationDisplayName(record));
  if(entered===null)return;
  record.name=entered.trim().slice(0,80)||`Simulation ${record.number}`;
  persistSimulationHistoryChange();
  renderSimulationHistory();
  refreshComparisonSelectors();
}
function deleteSimulationRecord(record){
  if(!record)return;
  if(!confirm(`Delete ${simulationDisplayName(record)}?`))return;
  simulationHistoryRecords=simulationHistoryRecords.filter(item=>item.id!==record.id);
  if(loadedSimulationRecordId===record.id)loadedSimulationRecordId=null;
  persistSimulationHistoryChange();
  renderSimulationHistory();
  refreshComparisonSelectors();
}
function renderStrategyLibrary(){
  const host=document.getElementById('strategyLibrary');
  if(!host)return;
  if(!simulationHistoryRecords.length){
    host.innerHTML='<div class="empty-history">Run and save a simulation to create your first strategy.</div>';
    return;
  }
  const selectedIds=new Set(selectedComparisonRecords().map(record=>record.id));
  host.innerHTML=simulationHistoryRecords.map(record=>`
    <article class="strategy-library-card${loadedSimulationRecordId===record.id?' loaded-strategy':''}">
      <div class="strategy-library-head">
        <div>
          <strong>${escapeSimulationText(simulationDisplayName(record))}</strong>
          <span>${escapeSimulationText(record.time||'')}</span>
        </div>
        <div class="strategy-icon-actions">
          <button type="button" class="icon-button rename-library-strategy" data-id="${record.id}" title="Rename strategy" aria-label="Rename ${escapeSimulationText(simulationDisplayName(record))}">✎</button>
          <button type="button" class="icon-button delete-library-strategy" data-id="${record.id}" title="Delete strategy" aria-label="Delete ${escapeSimulationText(simulationDisplayName(record))}">⌫</button>
        </div>
      </div>
      <div class="strategy-library-metrics">
        <div><span>Success</span><strong>${pct(record.success)}</strong></div>
        <div><span>Objective</span><strong>${pct(record.objectiveMet)}</strong></div>
        <div><span>Median at objective</span><strong>${gbp(record.objectiveMedian)}</strong></div>
      </div>
      <div class="strategy-library-actions">
        <button type="button" class="${selectedIds.has(record.id)?'ghost':'primary'} small add-library-strategy" data-id="${record.id}">${selectedIds.has(record.id)?'In comparison':'Add to comparison'}</button>
        <button type="button" class="secondary small load-library-strategy" data-id="${record.id}">${loadedSimulationRecordId===record.id?'Loaded':'Load into RetireLab'}</button>
      </div>
    </article>`).join('');
  host.querySelectorAll('.add-library-strategy').forEach(button=>button.addEventListener('click',()=>addRecordToComparison(getSimulationById(button.dataset.id))));
  host.querySelectorAll('.load-library-strategy').forEach(button=>button.addEventListener('click',()=>loadSimulationRecord(getSimulationById(button.dataset.id))));
  host.querySelectorAll('.rename-library-strategy').forEach(button=>button.addEventListener('click',()=>renameSimulationRecord(getSimulationById(button.dataset.id))));
  host.querySelectorAll('.delete-library-strategy').forEach(button=>button.addEventListener('click',()=>deleteSimulationRecord(getSimulationById(button.dataset.id))));
}
comparisonSelects().forEach(select=>select.addEventListener('change',()=>{renderComparison();renderStrategyLibrary()}));
document.querySelectorAll('.clear-strategy-slot').forEach(button=>button.addEventListener('click',()=>{
  const select=comparisonSelects()[+button.dataset.slot];
  if(select)select.value='';
  renderComparison();renderStrategyLibrary();
}));
setTimeout(refreshComparisonSelectors,0);
