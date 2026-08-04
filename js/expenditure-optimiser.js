
(function(){
'use strict';

const $=id=>document.getElementById(id);
const modes=[...document.querySelectorAll('input[name="expenditureMode"]')];
const panel=$('expenditureOptimiserPanel');
const spend=$('annualSpending');
const targetInput=$('expenditureSuccessTarget');
const calculateButton=$('calculateMaximumExpenditure');
const progress=$('expenditureOptimiserProgress');
const progressBar=$('expenditureOptimiserProgressBar');
const progressText=$('expenditureOptimiserProgressText');
const resultPanel=$('expenditureOptimiserResult');
const stale=$('expenditureOptimiserStale');
let optimising=false;
let lastOptimisationSignature=null;

function currentMode(){return document.querySelector('input[name="expenditureMode"]:checked')?.value||document.getElementById('expenditureMode')?.value||'manual'}
function targetFraction(){return Math.max(.01,Math.min(.999,(Number(targetInput?.value)||95)/100))}
function selectedSimulationCount(){return Math.max(500,Number(document.getElementById('simCount')?.value)||10000)}
function metricFor(result,mode){return mode==='objective'?result.objectiveMet:result.success}
function metricName(mode){return mode==='objective'?'objective success':'plan success'}
function yieldFrame(){return new Promise(resolve=>setTimeout(resolve,0))}
function roundedDown(value,tolerance){return Math.max(0,Math.floor(value/tolerance)*tolerance)}

function planSignature(){
 const state=typeof serialise==='function'?serialise():null;
 if(!state)return '';
 const copy=JSON.parse(JSON.stringify(state));
 if(copy.basics){
   delete copy.basics.annualSpending;
   delete copy.basics.expenditureMode;
   delete copy.basics.expenditureSuccessTarget;
 }
 if(copy.accumulation?.result)delete copy.accumulation.result;
 return JSON.stringify(copy);
}

function setProgress(percent,text){
 progress?.classList.remove('hidden');
 if(progressBar)progressBar.style.width=`${Math.max(0,Math.min(100,percent))}%`;
 if(progressText)progressText.textContent=text;
}

function showMode(){
 const mode=currentMode();
 panel?.classList.toggle('hidden',mode==='manual');
 if(spend)spend.readOnly=mode!=='manual';
 if(mode==='manual'){
   stale?.classList.add('hidden');
 }else if(lastOptimisationSignature&&lastOptimisationSignature!==planSignature()){
   stale?.classList.remove('hidden');
 }
 if(typeof scheduleProjectSave==='function')scheduleProjectSave();
}

function markStale(){
 if(optimising||currentMode()==='manual'||!lastOptimisationSignature)return;
 if(lastOptimisationSignature!==planSignature())stale?.classList.remove('hidden');
}

async function evaluate(amount,sims){
 spend.value=Math.max(0,Math.round(amount));
 // Same seed, assumptions and simulation count on every call:
 // runSimulation therefore recreates the identical population of paths.
 const result=runSimulation(null,sims,0,false,null);
 await yieldFrame();
 return result;
}

async function optimise(){
 if(optimising)return;
 const mode=currentMode();
 if(mode==='manual')return;
 if(typeof runSimulation!=='function'){
   alert('The simulation engine is not available.');
   return;
 }
 if(typeof totalCore==='function'&&totalCore()<=0){
   alert('Enter a CORE portfolio value before optimising expenditure.');
   return;
 }
 if(typeof allocationIsValid==='function'&&!allocationIsValid()){
   alert('Fund allocations must total 100% before optimising expenditure.');
   return;
 }

 const target=targetFraction();
 const sims=selectedSimulationCount();
 const tolerance=50;
 const originalSpend=Number(spend.value)||0;
 optimising=true;
 calculateButton.disabled=true;
 resultPanel?.classList.add('hidden');
 stale?.classList.add('hidden');
 setProgress(2,`Preparing ${sims.toLocaleString('en-GB')} fixed simulated lifetimes…`);

 try{
   const zeroResult=await evaluate(0,sims);
   const zeroMetric=metricFor(zeroResult,mode);
   if(zeroMetric+1e-12<target){
     spend.value=originalSpend;
     throw new Error(`Even zero regular annual expenditure produces only ${(zeroMetric*100).toFixed(1)}% ${metricName(mode)}. The selected target cannot be reached with the current plan.`);
   }

   let low=0;
   let high=Math.max(10000,originalSpend||0,((Number(document.getElementById('sippTotal')?.value)||0)/10));
   let highResult=null;
   let evaluations=1;

   // Expand until the target fails, with a generous but finite safety ceiling.
   const ceiling=Math.max(250000,(Number(document.getElementById('sippTotal')?.value)||0)*2);
   while(high<ceiling){
     setProgress(Math.min(28,5+evaluations*4),`Finding the upper spending boundary: ${money(high)}…`);
     highResult=await evaluate(high,sims);
     evaluations++;
     if(metricFor(highResult,mode)<target)break;
     low=high;
     high=Math.min(ceiling,high*1.6+tolerance);
   }
   if(!highResult||metricFor(highResult,mode)>=target){
     high=ceiling;
     highResult=await evaluate(high,sims);
     evaluations++;
     if(metricFor(highResult,mode)>=target){
       throw new Error(`The optimiser reached its search ceiling of ${money(ceiling)} while still meeting the target. Enter a narrower plan or use a higher manual amount.`);
     }
   }

   // Binary search. Every evaluation uses the identical simulated population.
   let bestResult=zeroResult;
   let iteration=0;
   const estimatedIterations=Math.max(1,Math.ceil(Math.log2(Math.max(1,(high-low)/tolerance))));
   while(high-low>tolerance&&iteration<24){
     const mid=(low+high)/2;
     const pct=30+(iteration/estimatedIterations)*58;
     setProgress(pct,`Testing ${money(roundedDown(mid,tolerance))} against the fixed path population…`);
     const trial=await evaluate(mid,sims);
     evaluations++;
     if(metricFor(trial,mode)>=target){
       low=mid;
       bestResult=trial;
     }else{
       high=mid;
     }
     iteration++;
   }

   const finalAmount=roundedDown(low,tolerance);
   setProgress(91,`Verifying ${money(finalAmount)}…`);
   const finalResult=await evaluate(finalAmount,sims);
   evaluations++;
   const achieved=metricFor(finalResult,mode);

   spend.value=finalAmount;
   spend.dispatchEvent(new Event('input',{bubbles:true}));
   spend.dispatchEvent(new Event('change',{bubbles:true}));

   $('maximumExpenditureResult').textContent=money(finalAmount);
   $('expenditureTargetSummary').textContent=`${metricName(mode).replace(/\b\w/g,c=>c.toUpperCase())} ≥ ${(target*100).toFixed(1)}%`;
   $('expenditureAchievedSummary').textContent=`${(achieved*100).toFixed(1)}%`;
   $('expenditurePathSummary').textContent=`${sims.toLocaleString('en-GB')} lifetimes`;
   $('expenditureSearchTolerance').value=money(tolerance);
   $('expenditureOptimiserExplanation').textContent=
     `RetireLab tested ${evaluations} spending levels against the same ${sims.toLocaleString('en-GB')} simulated lifetimes. The annual expenditure field has been populated with the highest £50 increment that met the selected target.`;

   lastOptimisationSignature=planSignature();
   stale?.classList.add('hidden');
   resultPanel?.classList.remove('hidden');
   setProgress(100,`Maximum expenditure calculated: ${money(finalAmount)} at ${(achieved*100).toFixed(1)}% ${metricName(mode)}.`);
   if(typeof scheduleProjectSave==='function')scheduleProjectSave();
 }catch(error){
   spend.value=originalSpend;
   setProgress(0,error.message||'Unable to complete expenditure optimisation.');
   alert(error.message||'Unable to complete expenditure optimisation.');
 }finally{
   optimising=false;
   calculateButton.disabled=false;
 }
}

modes.forEach(mode=>mode.addEventListener('change',()=>{
 const compatibility=document.getElementById('expenditureMode');
 if(mode.checked&&compatibility)compatibility.value=mode.value;
 showMode();
}));
targetInput?.addEventListener('input',()=>{
 if(lastOptimisationSignature)stale?.classList.remove('hidden');
 if(typeof scheduleProjectSave==='function')scheduleProjectSave();
});
calculateButton?.addEventListener('click',optimise);

// Mark prior results stale when material inputs change.
document.addEventListener('input',event=>{
 if(event.target===spend||event.target===targetInput||event.target?.name==='expenditureMode')return;
 markStale();
});
document.addEventListener('change',event=>{
 if(event.target===spend||event.target===targetInput||event.target?.name==='expenditureMode')return;
 markStale();
});

// Project restoration can set a saved radio value through basics even though radio groups
// need an explicit synchronisation pass.
const originalApply=window.applyExpenditureOptimiserState;
window.applyExpenditureOptimiserState=function(){
 const savedMode=document.getElementById('expenditureMode')?.value;
 if(savedMode){
   const radio=modes.find(item=>item.value===savedMode);
   if(radio)radio.checked=true;
 }
 showMode();
};

setTimeout(()=>{
 const savedMode=document.getElementById('expenditureMode')?.value||'manual';
 const savedRadio=modes.find(item=>item.value===savedMode);
 if(savedRadio)savedRadio.checked=true;
 showMode();
 if($('expenditureSearchTolerance'))$('expenditureSearchTolerance').value=money(50);
},0);
})();
