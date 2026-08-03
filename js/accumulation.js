(function(){
'use strict';
const accumulationFunds=[{
 id:'acc-vanguard-global-all-cap',libraryId:'vanguard-global-all-cap',name:'Vanguard FTSE Global All Cap Index Fund',allocation:100,ret:7.4,vol:16,corr:.89,category:'Global Equity',provider:'Vanguard',identifier:'VAFTGAG'
}];
let accumulationResult=null;
let accumulationChartPoints=[];
const $=id=>document.getElementById(id);
const num=id=>Number($(id)?.value)||0;
const enabled=()=>!!$('calculateAccumulation')?.checked;

function accInputs(){return{
 enabled:enabled(),currentAge:num('accumulationCurrentAge'),retirementAge:num('accumulationRetirementAge'),currentPot:num('accumulationCurrentPot'),monthlyContribution:num('accumulationMonthlyContribution'),contributionEndAge:num('accumulationContributionEndAge'),indexContributions:!!$('accumulationIndexContributions')?.checked,
 funds:accumulationFunds.map(f=>({...f})),result:accumulationResult?{p10:accumulationResult.p10,median:accumulationResult.median,p90:accumulationResult.p90,series:accumulationResult.series,totalContributed:accumulationResult.totalContributed}:null,
 useMedian:!!$('useAccumulationMedian')?.checked,overridePot:num('retirementPotOverride')
}}
window.captureAccumulationState=accInputs;
function applyAccumulationState(state){
 if(!state)return;
 if($('calculateAccumulation'))$('calculateAccumulation').checked=state.enabled!==false;
 [['accumulationCurrentAge','currentAge'],['accumulationRetirementAge','retirementAge'],['accumulationCurrentPot','currentPot'],['accumulationMonthlyContribution','monthlyContribution'],['accumulationContributionEndAge','contributionEndAge'],['retirementPotOverride','overridePot']].forEach(([id,key])=>{if($(id)&&state[key]!==undefined)$(id).value=state[key]});
 if($('accumulationIndexContributions'))$('accumulationIndexContributions').checked=!!state.indexContributions;
 if($('useAccumulationMedian'))$('useAccumulationMedian').checked=state.useMedian!==false;
 if(Array.isArray(state.funds)&&state.funds.length)accumulationFunds.splice(0,accumulationFunds.length,...state.funds.map(f=>({...f,allocation:Number(f.allocation)||0,ret:Number(f.ret)||0,vol:Math.max(0,Number(f.vol)||0),corr:Math.max(0,Math.min(.99,Number(f.corr)||.8))})));
 accumulationResult=state.result||null;
 renderAll();
 toggleEnabled();
}
window.applyAccumulationState=applyAccumulationState;
window.getAccumulationResult=()=>accumulationResult;
window.renderAccumulationCurrency=()=>{renderResults();applyHandoff();};

function allocationTotal(){return accumulationFunds.reduce((s,f)=>s+Math.max(0,+f.allocation||0),0)}
function renderFunds(){
 const body=$('accumulationFundTable')?.querySelector('tbody');if(!body)return;body.innerHTML='';
 accumulationFunds.forEach((f,i)=>{
  const tr=document.createElement('tr');tr.innerHTML=`<td class="accumulation-fund-name"><strong>${escapeText(f.name)}</strong><small>${escapeText(f.category||'Custom')}${f.identifier?' · '+escapeText(f.identifier):''}</small></td><td><input class="acc-allocation" data-i="${i}" type="number" min="0" step="0.1" value="${(+f.allocation||0).toFixed(1)}">%</td><td><input class="acc-ret" data-i="${i}" type="number" step="0.1" value="${f.ret}">%</td><td><input class="acc-vol" data-i="${i}" type="number" min="0" step="0.1" value="${f.vol}">%</td><td><input class="acc-corr" data-i="${i}" type="number" min="0" max="0.99" step="0.01" value="${f.corr}"></td><td><button class="danger small acc-remove" data-i="${i}" type="button">Remove</button></td>`;body.appendChild(tr);
 });
 body.querySelectorAll('.acc-allocation').forEach(el=>el.oninput=e=>{accumulationFunds[+e.target.dataset.i].allocation=Math.max(0,+e.target.value||0);updateTotal();invalidate()});
 body.querySelectorAll('.acc-ret').forEach(el=>el.oninput=e=>{accumulationFunds[+e.target.dataset.i].ret=+e.target.value||0;invalidate()});
 body.querySelectorAll('.acc-vol').forEach(el=>el.oninput=e=>{accumulationFunds[+e.target.dataset.i].vol=Math.max(0,+e.target.value||0);invalidate()});
 body.querySelectorAll('.acc-corr').forEach(el=>el.oninput=e=>{accumulationFunds[+e.target.dataset.i].corr=Math.max(0,Math.min(.99,+e.target.value||0));invalidate()});
 body.querySelectorAll('.acc-remove').forEach(el=>el.onclick=e=>{if(accumulationFunds.length<=1){alert('The accumulation portfolio needs at least one fund.');return}accumulationFunds.splice(+e.currentTarget.dataset.i,1);renderFunds();renderLibrary();invalidate()});
 updateTotal();
}
function escapeText(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function updateTotal(){const total=allocationTotal(),el=$('accumulationAllocationTotal');if(el){el.textContent=total.toFixed(1)+'%';el.classList.toggle('accumulation-allocation-warning',Math.abs(total-100)>.05)}}
function normalise(){const total=allocationTotal();if(total<=0){const each=100/accumulationFunds.length;accumulationFunds.forEach(f=>f.allocation=each)}else accumulationFunds.forEach(f=>f.allocation=f.allocation/total*100);renderFunds();invalidate()}

function renderLibrary(){
 const tree=$('accumulationLibraryTree');if(!tree||!window.FUND_LIBRARY)return;const q=($('accumulationLibrarySearch')?.value||'').toLowerCase().trim();tree.innerHTML='';
 const categories=window.FUND_CATEGORY_ORDER||['Popular','Global Equity','US Equity','UK Equity','Europe','Japan','Emerging Markets','Multi-Asset','Income','Defensive / Flexible','Bonds and Cash'];
 categories.forEach((category,idx)=>{let items=category==='Popular'?FUND_LIBRARY.filter(f=>f.popular):FUND_LIBRARY.filter(f=>f.category===category);if(q)items=items.filter(f=>[f.name,f.provider,f.category,f.type,f.identifier,f.description].join(' ').toLowerCase().includes(q));if(!items.length)return;const d=document.createElement('details');d.className='fund-library-category';d.open=!!q||idx===0;d.innerHTML=`<summary><span>${category}</span><small>${items.length} funds</small></summary><div class="fund-library-grid"></div>`;const grid=d.querySelector('.fund-library-grid');items.forEach(item=>{const added=accumulationFunds.some(f=>f.libraryId===item.id);const card=document.createElement('article');card.className='fund-library-card';card.innerHTML=`<div class="fund-library-card-top"><div><span class="fund-provider">${escapeText(item.provider)}</span><h4>${escapeText(item.name)}</h4></div><span class="fund-type-chip">${escapeText(item.category)}</span></div><p>${escapeText(item.description)}</p><div class="fund-library-metrics"><span><b>${item.ret.toFixed(1)}%</b> return</span><span><b>${item.vol.toFixed(1)}%</b> volatility</span><span><b>${item.corr.toFixed(2)}</b> correlation</span></div><div class="fund-library-card-footer"><small>${escapeText(item.identifier||'Planning profile')}</small><button type="button" class="${added?'ghost':'primary'} small acc-add-library" data-id="${item.id}" ${added?'disabled':''}>${added?'Added':'Add to portfolio'}</button></div>`;grid.appendChild(card)});tree.appendChild(d)});
 tree.querySelectorAll('.acc-add-library').forEach(btn=>btn.onclick=()=>addLibrary(btn.dataset.id));
}
function addLibrary(id){const item=FUND_LIBRARY.find(f=>f.id===id);if(!item)return;accumulationFunds.push({id:'acc-'+item.id,libraryId:item.id,name:item.name,allocation:0,ret:item.ret,vol:item.vol,corr:item.corr,category:item.category,provider:item.provider,identifier:item.identifier});renderFunds();renderLibrary();invalidate()}

function rand(seed){return function(){let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function normal(rng){let u=0,v=0;while(!u)u=rng();while(!v)v=rng();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
function chol(A){const n=A.length,L=Array.from({length:n},()=>Array(n).fill(0));for(let i=0;i<n;i++)for(let j=0;j<=i;j++){let s=0;for(let k=0;k<j;k++)s+=L[i][k]*L[j][k];L[i][j]=i===j?Math.sqrt(Math.max(A[i][i]-s,1e-12)):(A[i][j]-s)/L[j][j]}return L}
function q(arr,p){const a=[...arr].sort((x,y)=>x-y),x=(a.length-1)*p,i=Math.floor(x),r=x-i;return a[i+1]===undefined?a[i]:a[i]+r*(a[i+1]-a[i])}
function runProjection(){
 if(!enabled()){alert('Enable Calculate accumulation on the Dashboard first.');return}
 const start=num('accumulationCurrentAge'),retire=num('accumulationRetirementAge');if(retire<=start){alert('Planned retirement age must be later than current age.');return}
 if(Math.abs(allocationTotal()-100)>.1){alert('Accumulation allocations must total 100%.');return}
 const years=Math.ceil(retire-start),sims=Math.max(1000,Math.min(25000,Number($('simCount')?.value)||10000)),seed=Number($('seed')?.value)||2026,inflMean=(Number($('inflMean')?.value)||2.5)/100,inflVol=(Number($('inflVol')?.value)||0)/100;
 const weights=accumulationFunds.map(f=>f.allocation/100),n=weights.length,C=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?1:Math.sqrt(accumulationFunds[i].corr*accumulationFunds[j].corr))),L=chol(C),rng=rand(seed+6900),byYear=Array.from({length:years+1},()=>[]),finals=[];
 const initial=Math.max(0,num('accumulationCurrentPot')),baseMonthly=Math.max(0,num('accumulationMonthlyContribution')),endAge=num('accumulationContributionEndAge'),indexContrib=$('accumulationIndexContributions').checked;
 let totalNominalContrib=initial;
 for(let sim=0;sim<sims;sim++){
  let funds=weights.map(w=>initial*w),monthly=baseMonthly;byYear[0].push(initial);
  for(let y=0;y<years;y++){
   const age=start+y,z=Array.from({length:n},()=>normal(rng)),cz=L.map(row=>row.reduce((s,v,k)=>s+v*z[k],0));
   const active=age<endAge;const annualContribution=active?monthly*12:0;
   // Contributions arrive throughout the year: apply approximately half the annual return to new money.
   for(let i=0;i<n;i++){
    const mu=accumulationFunds[i].ret/100,vol=accumulationFunds[i].vol/100,lr=(mu-.5*vol*vol)+vol*cz[i],factor=Math.exp(lr);
    funds[i]=funds[i]*factor+annualContribution*weights[i]*Math.sqrt(Math.max(.05,factor));
   }
   if(indexContrib&&active){const inflation=Math.max(-.05,inflMean+inflVol*normal(rng));monthly*=1+inflation}
   byYear[y+1].push(funds.reduce((s,v)=>s+v,0));
  }
  finals.push(funds.reduce((s,v)=>s+v,0));
 }
 // Representative nominal contributions for the displayed breakdown, using mean inflation.
 let m=baseMonthly;totalNominalContrib=initial;for(let y=0;y<years;y++){if(start+y<endAge){totalNominalContrib+=m*12;if(indexContrib)m*=1+inflMean}}
 const series=byYear.map((values,i)=>({age:Math.min(retire,start+i),p10:q(values,.1),median:q(values,.5),p90:q(values,.9)}));
 accumulationResult={p10:q(finals,.1),median:q(finals,.5),p90:q(finals,.9),series,totalContributed:totalNominalContrib};
 renderResults();applyHandoff();scheduleProjectSave?.();
}
function renderResults(){
 const r=accumulationResult;$('accumulationP10').textContent=r?money(r.p10):'—';$('accumulationMedian').textContent=r?money(r.median):'—';$('accumulationP90').textContent=r?money(r.p90):'—';
 $('dashAccumulationPot').textContent=r?money(r.median):'Not calculated';
 $('accumulationBreakdown').innerHTML=r?`<span>Total starting pot and investments: <strong>${money(r.totalContributed)}</strong></span><span>Median investment growth: <strong>${money(r.median-r.totalContributed)}</strong></span>`:'<span>Total invested: —</span><span>Median investment growth: —</span>';
 drawChart();
}
function drawChart(){
 const canvas=$('accumulationChart'),wrap=canvas?.parentElement;if(!canvas||!wrap)return;const data=accumulationResult?.series||[],w=Math.max(320,wrap.clientWidth),h=Math.max(240,wrap.clientHeight),dpr=Math.max(1,devicePixelRatio||1);canvas.width=w*dpr;canvas.height=h*dpr;const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);if(!data.length){c.fillStyle='#67858b';c.font='12px Inter';c.textAlign='center';c.fillText('Run the accumulation projection to display the journey.',w/2,h/2);return}
 const pad={l:62,r:18,t:20,b:38},pw=w-pad.l-pad.r,ph=h-pad.t-pad.b,max=Math.max(...data.map(d=>d.p90))*1.08,x=i=>pad.l+(data.length===1?pw/2:i/(data.length-1)*pw),y=v=>pad.t+(max-v)/max*ph;
 c.font='10px Inter';c.textBaseline='middle';for(let i=0;i<=4;i++){const yy=pad.t+i/4*ph,val=max*(1-i/4);c.strokeStyle='rgba(86,139,145,.16)';c.beginPath();c.moveTo(pad.l,yy);c.lineTo(w-pad.r,yy);c.stroke();c.fillStyle='#69868b';c.textAlign='right';c.fillText(currencySymbol()+Math.round(val/1000)+'k',pad.l-7,yy)}
 c.textAlign='center';c.textBaseline='top';data.forEach((d,i)=>{c.fillStyle='#69868b';c.fillText(String(d.age),x(i),h-pad.b+11)});
 function line(key,color,width){c.beginPath();data.forEach((d,i)=>i?c.lineTo(x(i),y(d[key])):c.moveTo(x(i),y(d[key])));c.strokeStyle=color;c.lineWidth=width;c.lineJoin='round';c.stroke()}
 // percentile band
 c.beginPath();data.forEach((d,i)=>i?c.lineTo(x(i),y(d.p90)):c.moveTo(x(i),y(d.p90)));for(let i=data.length-1;i>=0;i--)c.lineTo(x(i),y(data[i].p10));c.closePath();c.fillStyle='rgba(64,157,163,.12)';c.fill();line('p10','#527f85',1);line('p90','#527f85',1);line('median','#67c1c5',2.5);
 accumulationChartPoints=data.map((d,i)=>({x:x(i),y:y(d.median),d}));
}
function applyHandoff(){
 const use=$('useAccumulationMedian')?.checked,median=accumulationResult?.median,override=num('retirementPotOverride');let value=use&&Number.isFinite(median)?median:override;
 if(use&&!Number.isFinite(median))value=override;
 if($('retirementPotOverride'))$('retirementPotOverride').disabled=!!use;
 $('retirementPotApplied').textContent=money(value);
 if($('sippTotal')&&value>=0){$('sippTotal').value=Math.round(value);if($('accumulationRetirementAge'))$('currentAge').value=$('accumulationRetirementAge').value;syncSippToCore?.()}
}
function toggleEnabled(){
 const on=enabled();
 const overlay=$('accumulationDisabled');
 if(overlay){
   overlay.classList.toggle('hidden',on);
   overlay.setAttribute('aria-hidden',String(on));
 }
 const tab=document.querySelector('.accumulation-tab-button');
 if(tab){
   tab.classList.toggle('tab-disabled',!on);
   tab.setAttribute('aria-disabled',String(!on));
 }
 if(!on&&document.querySelector('.tabpanel[data-panel="accumulation"]')?.classList.contains('active'))openTab('dashboard');
 applyHandoff();
 scheduleProjectSave?.();
}
function invalidate(){accumulationResult=null;renderResults();scheduleProjectSave?.()}
function renderAll(){renderFunds();renderLibrary();renderResults();toggleEnabled();applyHandoff()}

$('openAccumulationLibrary')?.addEventListener('click',()=>{$('accumulationFundLibrary').classList.remove('hidden');renderLibrary();$('accumulationFundLibrary').scrollIntoView({behavior:'smooth'})});$('closeAccumulationLibrary')?.addEventListener('click',()=>$('accumulationFundLibrary').classList.add('hidden'));$('accumulationLibrarySearch')?.addEventListener('input',renderLibrary);$('normaliseAccumulation')?.addEventListener('click',normalise);$('runAccumulation')?.addEventListener('click',runProjection);$('calculateAccumulation')?.addEventListener('change',toggleEnabled);
$('calculateAccumulation')?.addEventListener('input',toggleEnabled);$('useAccumulationMedian')?.addEventListener('change',()=>{applyHandoff();scheduleProjectSave?.()});$('retirementPotOverride')?.addEventListener('input',()=>{applyHandoff();scheduleProjectSave?.()});
['accumulationCurrentAge','accumulationRetirementAge','accumulationCurrentPot','accumulationMonthlyContribution','accumulationContributionEndAge','accumulationIndexContributions'].forEach(id=>$(id)?.addEventListener('input',invalidate));
$('showAccumulationCustomFund')?.addEventListener('click',()=>$('accumulationFundBuilder').classList.remove('hidden'));$('cancelAccumulationFund')?.addEventListener('click',()=>$('accumulationFundBuilder').classList.add('hidden'));$('confirmAccumulationFund')?.addEventListener('click',()=>{const name=$('accumulationNewFundName').value.trim();if(!name){alert('Enter a fund name.');return}accumulationFunds.push({id:'acc-custom-'+Date.now(),name,allocation:0,ret:num('accumulationNewFundReturn'),vol:num('accumulationNewFundVolatility'),corr:.8,category:'Custom'});$('accumulationFundBuilder').classList.add('hidden');renderFunds();invalidate()});
window.addEventListener('resize',()=>requestAnimationFrame(drawChart));
const originalCurrencyRefresh=window.refreshCurrencyDisplay; // formatter calls render hooks indirectly
setTimeout(renderAll,0);
})();
