
const fundDefs=[
{name:'Orbis Global Balanced',value:40500,ret:7.0,vol:10.5,corr:0.72,profile:'orbis'},
{name:'Artemis Global Income',value:40500,ret:7.5,vol:15.5,corr:0.88,profile:'artemis'},
{name:'BNY Mellon Global Income',value:40500,ret:7.3,vol:14.5,corr:0.86,profile:'bny'},
{name:'L&G Global 100',value:40500,ret:7.5,vol:16.5,corr:0.86,profile:'lg'}
];
function buildCorrelationMatrix(){
 const n=fundDefs.length;
 return Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>{
   if(i===j)return 1;
   return Math.max(0,Math.min(.99,Math.sqrt((fundDefs[i].corr??.8)*(fundDefs[j].corr??.8))));
 }));
}
let suggestedAllocation=null;
const gbp=x=>!isFinite(x)?'—':new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(x);
const pct=x=>(100*x).toFixed(1)+'%';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function totalCore(){return fundDefs.reduce((s,f)=>s+(+f.value||0),0)}

function fundConfidenceLabel(f){
  return f.profile==='custom'?'User Defined':
    f.profile==='lg'?'Medium–High':'Medium';
}
function renderAssumptionsTable(){
  const body=document.querySelector('#assumptionsFundTable tbody');
  if(!body)return;
  body.innerHTML='';
  fundDefs.forEach((f,i)=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${f.name}</td>
      <td><input class="assumption-input assumption-ret" data-i="${i}" type="number" step="0.1" value="${f.ret}"></td>
      <td><input class="assumption-input assumption-vol" data-i="${i}" type="number" min="0.1" step="0.1" value="${f.vol}"></td>
      <td><input class="assumption-input assumption-corr" data-i="${i}" type="number" min="0" max="0.99" step="0.01" value="${f.corr??0.8}"></td>
      <td><span class="confidence-pill">${fundConfidenceLabel(f)}</span></td>`;
    body.appendChild(tr);
  });
  document.querySelectorAll('.assumption-ret').forEach(el=>el.oninput=e=>{
    fundDefs[+e.target.dataset.i].ret=+e.target.value||0;
    if(typeof updatePortfolioStatsV21==='function')updatePortfolioStatsV21();
    scheduleProjectSave?.();
  });
  document.querySelectorAll('.assumption-vol').forEach(el=>el.oninput=e=>{
    fundDefs[+e.target.dataset.i].vol=Math.max(.1,+e.target.value||.1);
    if(typeof updatePortfolioStatsV21==='function')updatePortfolioStatsV21();
    scheduleProjectSave?.();
  });
  document.querySelectorAll('.assumption-corr').forEach(el=>el.oninput=e=>{
    fundDefs[+e.target.dataset.i].corr=Math.max(0,Math.min(.99,+e.target.value||0));
    if(typeof updatePortfolioStatsV21==='function')updatePortfolioStatsV21();
    scheduleProjectSave?.();
  });
}

addFundBtn.onclick=()=>{
  fundBuilder.classList.remove('hidden');
  newFundName.focus();
};
cancelFundBtn.onclick=()=>{
  fundBuilder.classList.add('hidden');
};
confirmFundBtn.onclick=()=>{
  const name=(newFundName.value||'').trim();
  if(!name){alert('Please enter a fund name.');newFundName.focus();return}
  const ret=+newFundReturn.value;
  const vol=+newFundVolatility.value;
  const value=Math.max(0,+newFundValue.value||0);
  if(!isFinite(ret)){alert('Please enter an expected nominal return.');return}
  if(!isFinite(vol)||vol<=0){alert('Please enter a volatility above 0%.');return}
  fundDefs.push({
    name,
    value,
    ret,
    vol,
    corr:0.80,
    profile:'custom'
  });
  fundBuilder.classList.add('hidden');
  newFundName.value='';
  newFundReturn.value='7.0';
  newFundVolatility.value='15.0';
  newFundValue.value='0';
  renderFunds();
  openTab('assumptions');
};

function portfolioPieColours(count){
 const palette=['#4b607d','#4f7058','#755f47','#66516f','#765055','#506c72','#706b4f','#5f5874','#566b5e','#74604e'];
 return Array.from({length:count},(_,i)=>palette[i%palette.length]);
}
function drawPortfolioPie(){
 const canvas=document.getElementById('portfolioPieChart');
 const legend=document.getElementById('portfolioPieLegend');
 if(!canvas||!legend)return;

 const cash=Math.max(0,+cashStart.value||0);
 const items=[{name:'Cash',value:cash},...fundDefs.map(f=>({name:f.name,value:Math.max(0,+f.value||0)}))];
 const total=items.reduce((sum,item)=>sum+item.value,0);
 const colours=portfolioPieColours(items.length);
 const ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height;
 ctx.clearRect(0,0,W,H);

 const cx=W*.48,cy=H*.5,r=Math.min(W,H)*.37,inner=r*.57;
 if(total<=0){
   ctx.fillStyle='#252b33';
   ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
 }else{
   let angle=-Math.PI/2;
   items.forEach((item,i)=>{
     const slice=item.value/total*Math.PI*2;
     ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,angle,angle+slice);ctx.closePath();
     ctx.fillStyle=colours[i];ctx.fill();
     ctx.strokeStyle='#0d0f13';ctx.lineWidth=3;ctx.stroke();
     angle+=slice;
   });
 }
 ctx.beginPath();ctx.arc(cx,cy,inner,0,Math.PI*2);ctx.fillStyle='#121419';ctx.fill();
 ctx.textAlign='center';
 ctx.fillStyle='#9aa3af';ctx.font='500 13px Raleway,system-ui';
 ctx.fillText('Total portfolio',cx,cy-8);
 ctx.fillStyle='#eef1f5';ctx.font='600 22px Inter,system-ui';
 ctx.fillText(compactGBP(total),cx,cy+20);
 ctx.textAlign='left';

 legend.innerHTML='';
 items.forEach((item,i)=>{
   const pctValue=total>0?item.value/total*100:0;
   const row=document.createElement('div');
   row.className='portfolio-pie-item';
   row.innerHTML=`<span class="portfolio-pie-swatch" style="background:${colours[i]}"></span>
     <span class="portfolio-pie-name" title="${item.name}">${item.name}</span>
     <span class="portfolio-pie-value">${pctValue.toFixed(1)}% · ${compactGBP(item.value)}</span>`;
   legend.appendChild(row);
 });

 const mirror=document.getElementById('sippBreakdownMirror');
 if(mirror){
   mirror.textContent=`Total SIPP ${gbp(+sippTotal.value||0)} = CORE ${gbp(targetCoreValue())} + cash ${gbp(cash)}.`;
 }
}

function renderFunds(){
 const tb=document.querySelector('#fundTable tbody');tb.innerHTML='';
 fundDefs.forEach((f,i)=>{
  const tr=document.createElement('tr');
  tr.innerHTML=`<td><strong>${f.name}</strong></td>
  <td><input class="fund-value" data-i="${i}" type="number" min="0" step="1000" value="${f.value}"></td>
  <td><input class="fund-pct" data-i="${i}" type="number" min="0" max="100" step="0.1"></td>
  <td><button type="button" class="ghost small fund-details-btn" data-i="${i}">Details</button></td>
  <td><button type="button" class="danger small remove-fund-btn" data-i="${i}" ${fundDefs.length<=1?'disabled':''}>Remove</button></td>`;
  tb.appendChild(tr);
 });
 bindFunds();updateFundDisplay();
 renderAssumptionsTable();
 if(typeof wireFundLinksV21==='function')wireFundLinksV21();
 if(typeof updatePortfolioStatsV21==='function')updatePortfolioStatsV21();
}function targetCoreValue(){
 return Math.max(0,(+sippTotal.value||0)-(+cashStart.value||0));
}
function allocationSum(){
 const core=targetCoreValue();
 if(core<=0)return 0;
 return fundDefs.reduce((s,f)=>s+(f.value/core*100),0);
}
function updateAllocationWarning(){
 const totalPct=allocationSum();
 allocationTotal.textContent=totalPct.toFixed(1)+'%';
 const w=document.getElementById('allocationWarning');
 const difference=100-totalPct;
 if(Math.abs(difference)<0.05){
   w.classList.add('hidden');
 }else{
   const direction=difference>0?'under':'over';
   w.textContent=`Allocations total ${totalPct.toFixed(2)}%. They are ${Math.abs(difference).toFixed(2)} percentage points ${direction} 100%. Adjust the entries or use “Normalise to 100%” before running the simulation.`;
   w.classList.remove('hidden');
 }
}
function bindFunds(){
 document.querySelectorAll('.fund-value').forEach(el=>el.oninput=e=>{
   const i=+e.target.dataset.i;
   fundDefs[i].value=Math.max(0,+e.target.value||0);
   const core=targetCoreValue();
   const pctInput=document.querySelector(`.fund-pct[data-i="${i}"]`);
   pctInput.value=core>0?(100*fundDefs[i].value/core).toFixed(2):'0.00';
   updateFundDisplay(false);
 });
 document.querySelectorAll('.fund-pct').forEach(el=>el.oninput=e=>{
   const i=+e.target.dataset.i;
   const entered=Math.max(0,+e.target.value||0);
   const core=targetCoreValue();
   fundDefs[i].value=core*entered/100;
   document.querySelector(`.fund-value[data-i="${i}"]`).value=Math.round(fundDefs[i].value);
   updateFundDisplay(false);
 });
 document.querySelectorAll('.fund-details-btn').forEach(el=>el.onclick=e=>openFundDrawerV21(+e.target.dataset.i));
 document.querySelectorAll('.remove-fund-btn').forEach(el=>el.onclick=e=>{
   const i=+e.target.dataset.i;
   if(fundDefs.length<=1)return;
   if(!confirm(`Remove ${fundDefs[i].name}?`))return;
   fundDefs.splice(i,1);
   renderFunds();
 });
}function updateFundDisplay(refreshInputs=true){
 const actualTotal=totalCore();
 if(refreshInputs){
   const core=targetCoreValue();
   document.querySelectorAll('.fund-value').forEach((el,i)=>el.value=Math.round(fundDefs[i].value));
   document.querySelectorAll('.fund-pct').forEach((el,i)=>el.value=core>0?(100*fundDefs[i].value/core).toFixed(2):'0.00');
 }
 portfolioTotal.textContent=gbp(actualTotal);
 updateAllocationWarning();
 drawPortfolioPie();
}
equaliseBtn.textContent='Equalise funds';
equaliseBtn.onclick=()=>{
 const core=targetCoreValue()||162000;
 fundDefs.forEach(f=>f.value=core/fundDefs.length);
 updateFundDisplay();
};
normaliseBtn.onclick=()=>{
 const currentTotal=totalCore();
 const core=targetCoreValue();
 if(currentTotal<=0||core<=0)return;
 fundDefs.forEach(f=>f.value=f.value/currentTotal*core);
 updateFundDisplay();
};



function addIncomeRow(d={name:'State Pension',amount:12000,basis:'commencement',start:67,end:'',index:2.5}){
 const tr=document.createElement('tr');
 const basis=d.basis||'commencement';
 tr.innerHTML=`<td><input class="inc-name" value="${d.name}"></td>
 <td><input class="inc-amount" type="number" value="${d.amount}"></td>
 <td><select class="inc-basis">
   <option value="commencement"${basis==='commencement'?' selected':''}>Amount at commencement</option>
   <option value="today"${basis==='today'?' selected':''}>Today's money</option>
 </select></td>
 <td><input class="inc-start" type="number" step="0.1" value="${d.start}"></td>
 <td><input class="inc-end" type="number" step="0.1" value="${d.end}"></td>
 <td><input class="inc-index" type="number" step="0.1" value="${d.index}"></td>
 <td><button class="danger small remove-row">Remove</button></td>`;
 tr.querySelector('.remove-row').onclick=()=>tr.remove();document.querySelector('#incomeTable tbody').appendChild(tr);
}
function addExpenseRow(d={name:'New car',amount:25000,start:65,term:1,indexed:false}){
 const tr=document.createElement('tr');
 tr.innerHTML=`<td><input class="exp-name" value="${d.name}"></td><td><input class="exp-amount" type="number" value="${d.amount}"></td><td><input class="exp-start" type="number" step="0.1" value="${d.start}"></td><td><input class="exp-term" type="number" min="1" step="1" value="${d.term}"></td><td><select class="exp-indexed"><option value="no"${!d.indexed?' selected':''}>No</option><option value="yes"${d.indexed?' selected':''}>Yes</option></select></td><td><button class="danger small remove-row">Remove</button></td>`;
 tr.querySelector('.remove-row').onclick=()=>tr.remove();document.querySelector('#expenseTable tbody').appendChild(tr);
}
addIncome.onclick=()=>addIncomeRow({name:'Other income',amount:0,basis:'commencement',start:+currentAge.value,end:'',index:0});
addExpense.onclick=()=>addExpenseRow({name:'Large expenditure',amount:0,start:+currentAge.value+5,term:1,indexed:false});
function incomes(){return [...document.querySelectorAll('#incomeTable tbody tr')].map(tr=>({
 name:tr.querySelector('.inc-name')?.value||'Income',
 amount:+tr.querySelector('.inc-amount').value||0,
 basis:tr.querySelector('.inc-basis').value,
 start:+tr.querySelector('.inc-start').value||0,
 end:tr.querySelector('.inc-end').value===''?Infinity:(+tr.querySelector('.inc-end').value||0),
 index:+tr.querySelector('.inc-index').value||0
}))}
function expenses(){return [...document.querySelectorAll('#expenseTable tbody tr')].map(tr=>({
 name:tr.querySelector('.exp-name')?.value||'Expenditure',
 amount:+tr.querySelector('.exp-amount').value||0,
 start:+tr.querySelector('.exp-start').value||0,
 term:Math.max(1,+tr.querySelector('.exp-term').value||1),
 indexed:tr.querySelector('.exp-indexed').value==='yes'
}))}
function mulberry32(a){return function(){let t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function randn(rng){let u=0,v=0;while(u===0)u=rng();while(v===0)v=rng();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
function cholesky(A){const n=A.length,L=Array.from({length:n},()=>Array(n).fill(0));for(let i=0;i<n;i++)for(let j=0;j<=i;j++){let s=0;for(let k=0;k<j;k++)s+=L[i][k]*L[j][k];L[i][j]=i===j?Math.sqrt(Math.max(A[i][i]-s,1e-12)):(A[i][j]-s)/L[j][j]}return L}

function quantile(arr,q){const a=[...arr].sort((x,y)=>x-y);if(!a.length)return NaN;const p=(a.length-1)*q,b=Math.floor(p),r=p-b;return a[b+1]!==undefined?a[b]+r*(a[b+1]-a[b]):a[b]}
function getInputs(){return{
 currentAge:+currentAge.value,endAge:+endAge.value,objectiveAge:+objectiveAge.value,objectiveTarget:+objectiveTarget.value||0,spending:+annualSpending.value,spendingIndex:spendingIndex.value,
 sims:+simCount.value,seed:+seed.value||1,inflMean:+inflMean.value/100,inflVol:+inflVol.value/100,
 sippTotal:+sippTotal.value||0,cashStart:+cashStart.value||0,cashRate:+cashRate.value/100,trigger:+cashTrigger.value/100,
 reviewFrequency:reviewFrequency.value,badYearRule:badYearRule.value,goodYearRule:goodYearRule.value,
 saleMethod:saleMethod.value,cashFloor:+cashFloor.value||0,incomes:incomes(),expenses:expenses()
}}
function successAge(inp){return inp.expenses.length?Math.min(inp.endAge,Math.max(...inp.expenses.map(e=>e.start+e.term))):inp.endAge}

function withdrawFromCore(funds,amount,method,targetWeights){
 amount=Math.max(0,amount);let taken=0;
 if(amount<=0)return 0;
 if(method==='equal'){
  let remaining=amount,active=funds.map((v,i)=>v>0?i:null).filter(i=>i!==null);
  while(remaining>0.01&&active.length){
   const each=remaining/active.length,newActive=[];
   active.forEach(i=>{const x=Math.min(each,funds[i]);funds[i]-=x;taken+=x;remaining-=x;if(funds[i]>0.01)newActive.push(i)});
   active=newActive;
  }
 }else if(method==='proportional'){
  const total=funds.reduce((a,b)=>a+b,0);if(total<=0)return 0;
  funds.forEach((v,i)=>{const x=Math.min(v,amount*v/total);funds[i]-=x;taken+=x});
 }else{
  let remaining=amount;
  while(remaining>0.01&&funds.reduce((a,b)=>a+b,0)>0.01){
   const total=funds.reduce((a,b)=>a+b,0);
   let best=0,bestOver=-Infinity;
   funds.forEach((v,i)=>{const over=v/total-targetWeights[i];if(over>bestOver&&v>0){bestOver=over;best=i}});
   const x=Math.min(remaining,funds[best]);funds[best]-=x;taken+=x;remaining-=x;
  }
 }
 return taken;
}

function runSimulation(allocation=null,simsOverride=null,seedOffset=0,collectPaths=true,cashOverride=null){
 const inp=getInputs(),n=fundDefs.length,weights=allocation||fundDefs.map(f=>f.value/targetCoreValue()),sims=simsOverride||inp.sims;
 const L=cholesky(buildCorrelationMatrix());
 const months=Math.max(1,Math.round((inp.endAge-inp.currentAge)*12)),sAge=successAge(inp),sMonth=Math.max(0,Math.min(months,Math.round((sAge-inp.currentAge)*12)));
 const rng=mulberry32((inp.seed+seedOffset)>>>0),cash0=(cashOverride===null?inp.cashStart:cashOverride),core0=Math.max(0,inp.sippTotal-cash0);
 let success=0,survive=0,objectiveMet=0,objectiveValues=[],finals=[],finalCash=[],snapshots=collectPaths?Array.from({length:months+1},()=>[]):null,snapEvery=Math.max(1,Math.floor(sims/1000));
 const objectiveMonth=Math.max(0,Math.min(months,Math.round((inp.objectiveAge-inp.currentAge)*12)));
 for(let s=0;s<sims;s++){
  let funds=weights.map(w=>core0*w),cash=cash0,inflIndex=1,aliveSuccess=true,aliveEnd=true,objectiveRecorded=false;
  const incomeStartFactors=inp.incomes.map(()=>null);
  let reviewStartCore=core0,reviewReturnFactor=1,goodYearCoreBudget=0,currentGood=false;
  if(collectPaths&&s%snapEvery===0)snapshots[0].push(core0+cash);
  if(objectiveMonth===0){const ov=Math.max(0,core0+cash);objectiveValues.push(ov);if(ov>=inp.objectiveTarget)objectiveMet++;objectiveRecorded=true;}
  for(let m=1;m<=months;m++){
   const age=inp.currentAge+m/12;
   let z=Array.from({length:n},()=>randn(rng)),cz=Array(n).fill(0);
   for(let i=0;i<n;i++)for(let k=0;k<=i;k++)cz[i]+=L[i][k]*z[k];
   let monthCoreFactorBefore=1;
   for(let i=0;i<n;i++){
    const mu=fundDefs[i].ret/100,vol=fundDefs[i].vol/100,lr=(mu-.5*vol*vol)/12+vol/Math.sqrt(12)*cz[i],r=Math.exp(lr)-1;
    funds[i]*=1+r;
   }
   const coreAfterReturn=funds.reduce((a,b)=>a+b,0);
   if(reviewStartCore>0)reviewReturnFactor=coreAfterReturn/reviewStartCore;
   cash*=Math.pow(1+inp.cashRate,1/12);

   const iz=randn(rng),annInfl=clamp(inp.inflMean+inp.inflVol*iz,-.02,.15);inflIndex*=Math.pow(1+annInfl,1/12);
   let need=(inp.spending/12)*(inp.spendingIndex==='inflation'?inflIndex:1),inc=0;
   inp.incomes.forEach(x=>{if(age>=x.start&&age<=x.end){
      const yrs=Math.max(0,age-x.start);
      const ix=inp.incomes.indexOf(x);
      if(incomeStartFactors[ix]===null)incomeStartFactors[ix]=inflIndex;
      const startingAmount=x.basis==='today'?x.amount*incomeStartFactors[ix]:x.amount;
      inc+=(startingAmount*Math.pow(1+x.index/100,yrs))/12
   }});
   let large=0;
   inp.expenses.forEach(e=>{const startM=Math.round((e.start-inp.currentAge)*12),termM=Math.max(1,Math.round(e.term*12));if(m>=startM&&m<startM+termM){const pay=e.term<=1?(m===startM?e.amount:0):e.amount/termM;large+=pay*(e.indexed?inflIndex:1)}});
   let shortfall=Math.max(0,need+large-inc);
   let surplus=Math.max(0,inc-need-large);cash+=surplus;

   const reviewNow=inp.reviewFrequency==='monthly'||m===1||((m-1)%12===0);
   if(reviewNow){
    if(m!==1){reviewStartCore=funds.reduce((a,b)=>a+b,0);reviewReturnFactor=1}
    const annualReturn=reviewReturnFactor-1;
    currentGood=annualReturn>inp.trigger;
    if(currentGood){
      if(inp.goodYearRule==='trigger_amount')goodYearCoreBudget=Math.max(0,inp.trigger*reviewStartCore);
      else if(inp.goodYearRule==='actual_gain')goodYearCoreBudget=Math.max(0,annualReturn*reviewStartCore);
      else goodYearCoreBudget=Infinity;
    }else goodYearCoreBudget=0;
   }

   const coreTotal=funds.reduce((a,b)=>a+b,0);
   if(shortfall>0){
    if(currentGood){
      const fromCore=Math.min(shortfall,goodYearCoreBudget,coreTotal);
      const taken=withdrawFromCore(funds,fromCore,inp.saleMethod,weights);shortfall-=taken;goodYearCoreBudget-=taken;
      const availableCash=Math.max(0,cash-inp.cashFloor),fromCash=Math.min(shortfall,availableCash);cash-=fromCash;shortfall-=fromCash;
      if(shortfall>0){const extra=withdrawFromCore(funds,shortfall,inp.saleMethod,weights);shortfall-=extra}
    }else{
      if(inp.badYearRule==='cash_first'){
       const availableCash=Math.max(0,cash-inp.cashFloor),fromCash=Math.min(shortfall,availableCash);cash-=fromCash;shortfall-=fromCash;
       if(shortfall>0){const extra=withdrawFromCore(funds,shortfall,inp.saleMethod,weights);shortfall-=extra}
      }else{
       const fromCore=withdrawFromCore(funds,shortfall,inp.saleMethod,weights);shortfall-=fromCore;
       if(shortfall>0){const availableCash=Math.max(0,cash-inp.cashFloor),fromCash=Math.min(shortfall,availableCash);cash-=fromCash;shortfall-=fromCash}
      }
    }
   }
   const total=funds.reduce((a,b)=>a+b,0)+cash;
   if(!objectiveRecorded&&m>=objectiveMonth){const ov=Math.max(0,total);objectiveValues.push(ov);if(ov>=inp.objectiveTarget)objectiveMet++;objectiveRecorded=true;}
   if(shortfall>0.01||total<=0){if(m<=sMonth)aliveSuccess=false;aliveEnd=false}
   if(collectPaths&&s%snapEvery===0)snapshots[m].push(Math.max(0,total));
  }
  const final=funds.reduce((a,b)=>a+b,0)+cash;
  if(aliveSuccess)success++;if(aliveEnd)survive++;finals.push(Math.max(0,final));finalCash.push(Math.max(0,cash));
 }
 return{success:success/sims,survive:survive/sims,
 objectiveMet:objectiveMet/sims,objectiveMedian:quantile(objectiveValues,.5),
 objectiveP10:quantile(objectiveValues,.1),objectiveP90:quantile(objectiveValues,.9),
 objectiveTarget:inp.objectiveTarget,objectiveAge:inp.objectiveAge,
 p10:quantile(finals,.1),median:quantile(finals,.5),p90:quantile(finals,.9),
 medianCash:quantile(finalCash,.5),snapshots,months,currentAge:inp.currentAge,endAge:inp.endAge,weights}
}

function compactGBP(value){
 const abs=Math.abs(value);
 if(abs>=1000000)return `${value<0?'-':''}£${(abs/1000000).toFixed(abs>=10000000?1:2)}m`;
 if(abs>=1000)return `${value<0?'-':''}£${Math.round(abs/1000)}k`;
 return gbp(value);
}

function renderSimulationCanvas(canvas,res,hoverMonth=null){
 const ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height;
 ctx.clearRect(0,0,W,H);ctx.fillStyle='#0d0f13';ctx.fillRect(0,0,W,H);

 const step=Math.max(1,Math.floor(res.months/120)),pts=[];
 for(let m=0;m<=res.months;m+=step){
   const a=res.snapshots[m]||[0];
   pts.push({m,p10:quantile(a,.1),p50:quantile(a,.5),p90:quantile(a,.9)});
 }
 if(!pts.length)return;

 const target=Math.max(0,res.objectiveTarget||0);
 const ymax=Math.max(...pts.map(p=>p.p90),target,1)*1.08;
 const expanded=canvas.id==='expandedChart';
 const Lm=expanded?96:84,Rm=expanded?130:96,Tm=expanded?34:24,Bm=expanded?58:44;
 const axisFont=expanded?'600 18px Inter, system-ui':'600 14px Inter, system-ui';
 const valueFont=expanded?'600 18px Inter, system-ui':'600 13px Inter, system-ui';

 ctx.strokeStyle='#252b34';ctx.lineWidth=1;ctx.font=axisFont;ctx.fillStyle='#aeb6c1';
 for(let i=0;i<=5;i++){
   const yy=Tm+(H-Tm-Bm)*i/5;
   ctx.beginPath();ctx.moveTo(Lm,yy);ctx.lineTo(W-Rm,yy);ctx.stroke();
   ctx.fillText(compactGBP(ymax*(1-i/5)),8,yy+5);
 }

 const x=m=>Lm+(W-Lm-Rm)*m/Math.max(res.months,1);
 const y=v=>Tm+(H-Tm-Bm)*(1-v/ymax);

 [['p90','#8f99aa'],['p50','#5f91df'],['p10','#a75e65']].forEach(([k,col])=>{
   ctx.strokeStyle=col;ctx.lineWidth=k==='p50'?(expanded?4:3):(expanded?3:2);ctx.beginPath();
   pts.forEach((p,i)=>{const xx=x(p.m),yy=y(p[k]);i===0?ctx.moveTo(xx,yy):ctx.lineTo(xx,yy)});
   ctx.stroke();
 });

 const ageStep=expanded?1:5;
 for(let age=Math.ceil(res.currentAge/ageStep)*ageStep;age<=res.endAge;age+=ageStep){
   if(!expanded && age%5!==0)continue;
   const xx=x((age-res.currentAge)*12);
   ctx.fillStyle='#aeb6c1';ctx.font=axisFont;
   ctx.fillText(age.toString(),xx-(expanded?10:8),H-(expanded?20:14));
 }

 // Permanent objective crosshair.
 const objectiveMonth=Math.max(0,Math.min(res.months,Math.round((res.objectiveAge-res.currentAge)*12)));
 const objectiveX=x(objectiveMonth),targetY=y(target);
 ctx.save();ctx.setLineDash([5,5]);ctx.strokeStyle='rgba(176,149,103,.7)';ctx.lineWidth=1;
 ctx.beginPath();ctx.moveTo(objectiveX,Tm);ctx.lineTo(objectiveX,H-Bm);ctx.stroke();
 ctx.beginPath();ctx.moveTo(Lm,targetY);ctx.lineTo(W-Rm,targetY);ctx.stroke();ctx.restore();

 // Hover/pinned inspection line, snapped to whole years.
 const inspectMonth=hoverMonth===null?objectiveMonth:Math.max(0,Math.min(res.months,Math.round(hoverMonth/12)*12));
 const inspectAge=res.currentAge+inspectMonth/12;
 const inspectX=x(inspectMonth);
 const point=pts.reduce((best,p)=>Math.abs(p.m-inspectMonth)<Math.abs(best.m-inspectMonth)?p:best,pts[0]);

 if(inspectMonth!==objectiveMonth){
   ctx.save();ctx.setLineDash([3,5]);ctx.strokeStyle='rgba(167,176,190,.45)';ctx.lineWidth=1;
   ctx.beginPath();ctx.moveTo(inspectX,Tm);ctx.lineTo(inspectX,H-Bm);ctx.stroke();ctx.restore();
 }

 ctx.font=valueFont;
 ctx.fillStyle='rgba(210,216,225,.72)';
 ctx.fillText(`Age ${Number.isInteger(inspectAge)?inspectAge:inspectAge.toFixed(1)}`,Math.min(inspectX+7,W-Rm-60),Tm+18);

 const vals=[
   {key:'p90',colour:'#8f99aa'},
   {key:'p50',colour:'#5f91df'},
   {key:'p10',colour:'#a75e65'}
 ];
 vals.forEach((item,idx)=>{
   const val=point[item.key],yy=y(val);
   ctx.fillStyle=item.colour;ctx.beginPath();ctx.arc(inspectX,yy,expanded?6:4,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='rgba(226,231,238,.78)';
   const label=compactGBP(val);
   const labelY=Math.max(Tm+18,Math.min(H-Bm-5,yy+(idx-1)*(expanded?24:18)));
   ctx.fillText(label,Math.min(inspectX+(expanded?12:8),W-Rm+8),labelY);
 });
}

function attachInteractiveChart(canvas,resProvider){
 let pinnedMonth=null;
 const redraw=month=>renderSimulationCanvas(canvas,resProvider(),month===undefined?pinnedMonth:month);
 const getMonth=event=>{
   const rect=canvas.getBoundingClientRect();
   const clientX=event.touches?.[0]?.clientX??event.clientX;
   const scaleX=canvas.width/rect.width;
   const xpx=(clientX-rect.left)*scaleX;
   const expanded=canvas.id==='expandedChart';
   const Lm=expanded?96:84,Rm=expanded?130:96;
   const res=resProvider();
   return (xpx-Lm)/(canvas.width-Lm-Rm)*res.months;
 };
 canvas.onmousemove=e=>{if(pinnedMonth===null)redraw(getMonth(e))};
 canvas.onmouseleave=()=>{if(pinnedMonth===null)redraw(null)};
 canvas.onclick=e=>{pinnedMonth=Math.max(0,Math.min(resProvider().months,Math.round(getMonth(e)/12)*12));redraw(pinnedMonth)};
 canvas.ontouchmove=e=>{e.preventDefault();redraw(getMonth(e))};
 canvas.ontouchend=e=>{
   const touch=e.changedTouches?.[0];
   if(!touch)return;
   const fake={clientX:touch.clientX};
   pinnedMonth=Math.max(0,Math.min(resProvider().months,Math.round(getMonth(fake)/12)*12));
   redraw(pinnedMonth);
 };
 canvas.dataset.interactive='1';
}

function drawChart(res){
 chart._retireLabResult=res;
 renderSimulationCanvas(chart,res,null);
 if(!chart.dataset.interactive)attachInteractiveChart(chart,()=>chart._retireLabResult);
}
function setMetricClass(el,p){el.className='value '+(p>=.85?'good':p>=.65?'warn':'bad')}
function allocationIsValid(){
 return Math.abs(allocationSum()-100)<0.05;
}


function setRunFeedbackState(state,message){
 document.querySelectorAll('.run-feedback').forEach(el=>{
   el.classList.remove('running','complete','error');
   if(state)el.classList.add(state);
   const status=el.querySelector('.run-status');
   if(status)status.textContent=message;
 });
 document.querySelectorAll('.view-results-btn').forEach(btn=>{
   const ready=state==='complete';
   btn.disabled=!ready;
   btn.classList.toggle('results-ready',ready);
 });
}

runBtn.onclick=()=>{
 if(totalCore()<=0){alert('Enter a CORE portfolio value first.');return}
 if(!allocationIsValid()){alert(`Fund allocations currently total ${allocationSum().toFixed(2)}%. Please make them add to 100% before running the simulation.`);return}
 runBtn.disabled=true;runBtn.textContent='Running…';setRunFeedbackState('running','Running Monte Carlo…');
 setTimeout(()=>{
   const r=runSimulation();
   objectiveProb.textContent=pct(r.objectiveMet);
   objectiveGap.textContent=gbp(r.objectiveMedian-r.objectiveTarget);
   setMetricClass(objectiveProb,r.objectiveMet);
   successProb.textContent=pct(r.success);
   survivalProb.textContent=pct(r.survive);
   setMetricClass(successProb,r.success);
   setMetricClass(survivalProb,r.survive);
   p10.textContent=gbp(r.p10);
   median.textContent=gbp(r.median);
   p90.textContent=gbp(r.p90);
   medianCash.textContent=gbp(r.medianCash);
   drawChart(r);
   resultsCard.classList.remove('hidden');
   snapshotSimulationResult(r);
   setRunFeedbackState('complete','Results ready');
   runBtn.disabled=false;runBtn.textContent='Run Monte Carlo';
 },30)
};
function randomAllocation(rng){let a=Array.from({length:4},()=>-Math.log(Math.max(rng(),1e-9))),s=a.reduce((x,y)=>x+y,0);return a.map(x=>x/s)}


function setOptimiserProgress(percent,text){
  optimiserProgressWrap.classList.remove('hidden');
  optimiserProgressBar.style.width=`${Math.max(0,Math.min(100,percent))}%`;
  optimiserProgressText.textContent=text;
}
function yieldToBrowser(){
  return new Promise(resolve=>setTimeout(resolve,0));
}
function constrainedAllocation(weights,maxWeight){
  let w=[...weights];
  for(let pass=0;pass<20;pass++){
    let excess=0,free=[];
    w=w.map((x,i)=>{
      if(x>maxWeight){excess+=x-maxWeight;return maxWeight}
      free.push(i);return Math.max(0,x)
    });
    const total=w.reduce((a,b)=>a+b,0);
    const deficit=1-total;
    if(Math.abs(deficit)<1e-10)break;
    if(deficit>0){
      const capacity=free.reduce((s,i)=>s+Math.max(0,maxWeight-w[i]),0);
      if(capacity<=0)break;
      free.forEach(i=>w[i]+=deficit*Math.max(0,maxWeight-w[i])/capacity);
    }else{
      const positive=w.map((x,i)=>x>0?i:null).filter(i=>i!==null);
      const posTotal=positive.reduce((s,i)=>s+w[i],0);
      positive.forEach(i=>w[i]+=deficit*w[i]/posTotal);
    }
  }
  const total=w.reduce((a,b)=>a+b,0);
  return total>0?w.map(x=>x/total):Array.from({length:w.length},()=>1/w.length);
}
function localAllocationCandidates(base,maxWeight,step){
  const out=[[...base]];
  for(let from=0;from<base.length;from++){
    for(let to=0;to<base.length;to++){
      if(from===to)continue;
      if(base[from]>=step && base[to]+step<=maxWeight+1e-12){
        const w=[...base];w[from]-=step;w[to]+=step;out.push(w);
      }
    }
  }
  return out;
}

rebalanceBtn.onclick=async()=>{
 if(totalCore()<=0){alert('Enter a CORE portfolio value first.');return}
 if(!allocationIsValid()){alert(`Fund allocations currently total ${allocationSum().toFixed(2)}%. Please make them add to 100% before comparing allocations.`);return}

 openTab('optimiser');
 rebalanceBtn.disabled=true;
 rebalanceBtn.textContent='Optimising…';
 setOptimiserProgress(2,'Preparing common market scenarios…');
 await yieldToBrowser();

 try{

 const inp=getInputs();
 const currentCash=inp.cashStart;
 const currentCore=Math.max(0,inp.sippTotal-currentCash);
 const current=fundDefs.map(f=>f.value/currentCore);
 const comparisonSims=900;
 const comparisonSeedOffset=7000;
 const minimumFeasible=1/fundDefs.length;
 const maxWeight=Math.max(minimumFeasible,Math.min(1,(+maxFundAllocation.value||40)/100));
 let cashMin=Math.max(0,+optimiserCashMin.value||0);
 let cashMax=Math.max(cashMin,+optimiserCashMax.value||cashMin);
 const cashStep=Math.max(1000,+optimiserCashStep.value||5000);
 cashMax=Math.min(cashMax,inp.sippTotal);

 const scoreOf=r=>r.objectiveMet*.72+r.success*.18+r.survive*.05+
   Math.log1p(Math.max(0,r.objectiveMedian-r.objectiveTarget)/Math.max(inp.sippTotal,1))*.05;

 const base=runSimulation(current,comparisonSims,comparisonSeedOffset,false,currentCash);
 let best={w:[...current],cash:currentCash,r:base};

 // Stage 1: optimise cash while keeping current allocation.
 const cashCandidates=[];
 for(let c=cashMin;c<=cashMax+0.01;c+=cashStep)cashCandidates.push(Math.min(c,inp.sippTotal));
 if(!cashCandidates.some(c=>Math.abs(c-currentCash)<1))cashCandidates.push(currentCash);

 for(let i=0;i<cashCandidates.length;i++){
   const c=cashCandidates[i];
   const r=runSimulation(current,comparisonSims,comparisonSeedOffset,false,c);
   if(scoreOf(r)>scoreOf(best.r)+1e-12)best={w:[...current],cash:c,r};
   setOptimiserProgress(5+25*(i+1)/cashCandidates.length,`Testing cash bucket ${i+1} of ${cashCandidates.length}…`);
   await yieldToBrowser();
 }

 // Stage 2: coarse allocation search around the best cash level.
 let centre=constrainedAllocation(current,maxWeight);
 const coarseSteps=[.10,.05];
 let completed=0;
 const totalPasses=coarseSteps.length*3;
 for(const step of coarseSteps){
   for(let pass=0;pass<3;pass++){
     const candidates=localAllocationCandidates(centre,maxWeight,step);
     let passBest={w:[...centre],r:runSimulation(centre,comparisonSims,comparisonSeedOffset,false,best.cash)};
     for(let i=0;i<candidates.length;i++){
       const w=candidates[i];
       const r=runSimulation(w,comparisonSims,comparisonSeedOffset,false,best.cash);
       if(scoreOf(r)>scoreOf(passBest.r)+1e-12)passBest={w:[...w],r};
       const pctDone=30+50*((completed+i/candidates.length)/totalPasses);
       setOptimiserProgress(pctDone,`Refining fund allocation (${Math.round(pctDone)}%)…`);
       await yieldToBrowser();
     }
     centre=passBest.w;
     if(scoreOf(passBest.r)>scoreOf(best.r)+1e-12)best={w:[...passBest.w],cash:best.cash,r:passBest.r};
     completed++;
   }
 }

 // Stage 3: retest nearby cash levels using the improved allocation.
 const nearbyCash=[best.cash-cashStep,best.cash,best.cash+cashStep]
   .map(c=>Math.max(cashMin,Math.min(cashMax,c)))
   .filter((c,i,a)=>a.indexOf(c)===i);
 for(let i=0;i<nearbyCash.length;i++){
   const c=nearbyCash[i];
   const r=runSimulation(best.w,comparisonSims,comparisonSeedOffset,false,c);
   if(scoreOf(r)>scoreOf(best.r)+1e-12)best={w:[...best.w],cash:c,r};
   setOptimiserProgress(82+12*(i+1)/nearbyCash.length,`Final cash check ${i+1} of ${nearbyCash.length}…`);
   await yieldToBrowser();
 }

 setOptimiserProgress(97,'Preparing recommendation…');
 await yieldToBrowser();

 const maxWeightDifference=Math.max(...best.w.map((w,i)=>Math.abs(w-current[i])));
 const cashDifference=Math.abs(best.cash-currentCash);
 const materiallyDifferent=maxWeightDifference>=0.001||cashDifference>=1;
 suggestedAllocation=materiallyDifferent?best.w:null;
 window.suggestedCashAmount=materiallyDifferent?best.cash:null;

 rebalBody.innerHTML='';
 const suggestedCore=Math.max(0,inp.sippTotal-best.cash);
 fundDefs.forEach((f,i)=>{
   const shownWeight=materiallyDifferent?best.w[i]:current[i];
   const target=shownWeight*suggestedCore;
   const diff=target-f.value;
   const tr=document.createElement('tr');
   tr.innerHTML=`<td>${f.name}</td><td>${pct(current[i])}</td><td>${pct(shownWeight)}</td><td>${gbp(target)}</td><td>${gbp(diff)}</td>`;
   rebalBody.appendChild(tr);
 });

 optCurrentCash.textContent=gbp(currentCash);
 optSuggestedCash.textContent=gbp(materiallyDifferent?best.cash:currentCash);
 optCurrentCore.textContent=gbp(currentCore);
 optSuggestedCore.textContent=gbp(materiallyDifferent?suggestedCore:currentCore);

 if(materiallyDifferent){
   rebalSummary.textContent=
     `Using the same simulated market paths, estimated objective success is ${pct(best.r.objectiveMet)} for the suggested mix versus ${pct(base.objectiveMet)} for the current plan. Maximum fund allocation was capped at ${(maxWeight*100).toFixed(0)}%.`;
   applySuggested.disabled=false;
   applySuggested.style.display='';
 }else{
   rebalSummary.textContent=
     `No materially different cash-and-fund combination improved the result within the constraints entered. Current objective success was ${pct(base.objectiveMet)}.`;
   applySuggested.disabled=true;
   applySuggested.style.display='none';
 }

 setOptimiserProgress(100,'Optimisation complete.');
 rebalCard.classList.remove('hidden');
 }catch(error){
   console.error(error);
   setOptimiserProgress(100,'Optimiser stopped because of an error. Please check the inputs and try again.');
   alert('The optimiser could not complete. Your saved inputs have not been damaged.');
 }finally{
   rebalanceBtn.disabled=false;
   rebalanceBtn.textContent='Find a better CORE allocation';
 }
};
applySuggested.onclick=()=>{
 if(!suggestedAllocation)return;
 if(window.suggestedCashAmount!==null&&window.suggestedCashAmount!==undefined){
   cashStart.value=Math.round(window.suggestedCashAmount);
   syncSippToCore();
 }
 const total=targetCoreValue();
 fundDefs.forEach((f,i)=>f.value=total*suggestedAllocation[i]);
 updateFundDisplay();
};
function serialise(){return{
 basics:{currentAge:currentAge.value,endAge:endAge.value,objectiveAge:objectiveAge.value,objectiveTarget:objectiveTarget.value,annualSpending:annualSpending.value,spendingIndex:spendingIndex.value,simCount:simCount.value,seed:seed.value,inflMean:inflMean.value,inflVol:inflVol.value,sippTotal:sippTotal.value,cashStart:cashStart.value,cashRate:cashRate.value,cashTrigger:cashTrigger.value,reviewFrequency:reviewFrequency.value,badYearRule:badYearRule.value,goodYearRule:goodYearRule.value,saleMethod:saleMethod.value,cashFloor:cashFloor.value},
 funds:fundDefs,incomes:incomes(),expenses:expenses()
}}
saveBtn.onclick=()=>{localStorage.setItem('retirelab-simple-v2',JSON.stringify(serialise()));alert('Saved on this device.')};
loadBtn.onclick=()=>{const raw=localStorage.getItem('retirelab-simple-v2');if(!raw){alert('No saved v2 inputs found.');return}const d=JSON.parse(raw);Object.entries(d.basics).forEach(([k,v])=>{const el=document.getElementById(k);if(el)el.value=v});d.funds.forEach((f,i)=>Object.assign(fundDefs[i],f));renderFunds();document.querySelector('#incomeTable tbody').innerHTML='';d.incomes.forEach(addIncomeRow);document.querySelector('#expenseTable tbody').innerHTML='';d.expenses.forEach(addExpenseRow)};
resetBtn.onclick=()=>{if(confirm('Reset all inputs?')){localStorage.removeItem('retirelab-simple-v2');location.reload()}};
function currentEnteredFundPercentages(){
 const inputs=[...document.querySelectorAll('.fund-pct')];
 if(inputs.length===fundDefs.length){
   return inputs.map(el=>Math.max(0,+el.value||0)/100);
 }
 const actualTotal=totalCore();
 if(actualTotal>0)return fundDefs.map(f=>f.value/actualTotal);
 return fundDefs.map(()=>1/fundDefs.length);
}
function syncSippToCore(){
 const total=Math.max(0,+sippTotal.value||0);
 const cash=Math.max(0,+cashStart.value||0);
 if(cash>total)cashStart.value=total;
 const adjustedCash=Math.min(total,Math.max(0,+cashStart.value||0));
 const targetCore=Math.max(0,total-adjustedCash);

 // Fund percentages are the source of truth. Changing cash changes the
 // available CORE £ amount, not the user's chosen allocation.
 const pcts=currentEnteredFundPercentages();
 fundDefs.forEach((f,i)=>f.value=targetCore*pcts[i]);

 calculatedCore.value=gbp(targetCore);
 const breakdown=document.getElementById('sippBreakdownMirror');
 if(breakdown){
   breakdown.textContent=`Total SIPP ${gbp(total)} = CORE ${gbp(targetCore)} + cash ${gbp(adjustedCash)}.`;
 }
 updateFundDisplay();
}
sippTotal.addEventListener('input',syncSippToCore);
cashStart.addEventListener('input',syncSippToCore);

renderFunds();syncSippToCore();
addIncomeRow({name:'State Pension',amount:12000,basis:'commencement',start:67,end:'',index:2.5});
addIncomeRow({name:'Other pension',amount:0,basis:'commencement',start:60,end:'',index:0});
addExpenseRow({name:'New car',amount:25000,start:65,term:1,indexed:false});

function openTab(name){
  document.querySelectorAll('.tabbtn').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));
  document.querySelectorAll('.tabpanel').forEach(p=>p.classList.toggle('active',p.dataset.panel===name));
  window.scrollTo({top:0,behavior:'smooth'});
}
document.querySelectorAll('.tabbtn').forEach(b=>b.addEventListener('click',()=>openTab(b.dataset.tab)));
document.querySelectorAll('[data-goto]').forEach(b=>b.addEventListener('click',()=>openTab(b.dataset.goto)));
const dashboardRunButton=document.getElementById('dashboardRun');
if(dashboardRunButton){
  dashboardRunButton.addEventListener('click',()=>{
    const runButton=document.getElementById('runBtn');
    if(runButton)runButton.click();
  });
}

