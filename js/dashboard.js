
function refreshDashboardV4(){
 const p=(typeof currentProject==='function')?currentProject():null;
 const projectName=p?.name||document.getElementById('projectSelector')?.selectedOptions?.[0]?.text||'Main Retirement Plan';
 const age=document.getElementById('objectiveAge')?.value||'—';
 const target=+(document.getElementById('objectiveTarget')?.value||0);
 const latest=(typeof simulationHistoryRecords!=='undefined'&&simulationHistoryRecords.length)?simulationHistoryRecords[0]:null;
 const q=id=>document.getElementById(id);
 if(q('dashProject'))q('dashProject').textContent=projectName;
 if(q('dashObjective'))q('dashObjective').textContent=`${gbp(target)} at age ${age}`;
 if(q('dashLastResult'))q('dashLastResult').textContent=latest?`${pct(latest.objectiveMet)} objective success`:'No simulation yet';
 if(q('dashSaveStatus'))q('dashSaveStatus').textContent=q('autoSaveStatus')?.value||'On';
}
document.addEventListener('input',()=>setTimeout(refreshDashboardV4,0));
document.addEventListener('change',()=>setTimeout(refreshDashboardV4,0));
document.addEventListener('click',()=>setTimeout(refreshDashboardV4,60));
setInterval(refreshDashboardV4,1500);setTimeout(refreshDashboardV4,250);
