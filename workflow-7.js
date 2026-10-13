
(function(){
'use strict';

const simCount=document.getElementById('simCount');
const speedRadios=[...document.querySelectorAll('input[name="simulationSpeed"]')];
const speedHelp=document.getElementById('simulationSpeedHelp');
const speedPopover=document.getElementById('simulationSpeedPopover');
const optimise=document.getElementById('strategyOptimiseBtn');

function syncSpeedFromSelect(){
 if(!simCount)return;
 const value=String(simCount.value||'10000');
 let matching=speedRadios.find(radio=>radio.value===value);
 if(!matching){
   matching=speedRadios.find(radio=>radio.value==='25000')||speedRadios[1];
 }
 speedRadios.forEach(radio=>radio.checked=radio===matching);
}

speedRadios.forEach(radio=>radio.addEventListener('change',()=>{
 if(!radio.checked||!simCount)return;
 simCount.value=radio.value;
 simCount.dispatchEvent(new Event('change',{bubbles:true}));
 if(typeof scheduleProjectSave==='function')scheduleProjectSave();
}));

speedHelp?.addEventListener('click',event=>{
 event.stopPropagation();
 const hidden=speedPopover?.classList.toggle('hidden');
 speedHelp.setAttribute('aria-expanded',String(!hidden));
});
document.addEventListener('click',event=>{
 if(!speedPopover||speedPopover.classList.contains('hidden'))return;
 if(speedPopover.contains(event.target)||speedHelp?.contains(event.target))return;
 speedPopover.classList.add('hidden');
 speedHelp?.setAttribute('aria-expanded','false');
});

optimise?.addEventListener('click',()=>{
 if(typeof openTab==='function')openTab('optimiser');
 document.getElementById('rebalanceBtn')?.click();
});

document.getElementById('projectSelector')?.addEventListener('change',()=>{
 setTimeout(syncSpeedFromSelect,0);
});
document.querySelectorAll('.tabbtn[data-tab="strategy"]').forEach(button=>{
 button.addEventListener('click',()=>setTimeout(syncSpeedFromSelect,0));
});

syncSpeedFromSelect();
})();
