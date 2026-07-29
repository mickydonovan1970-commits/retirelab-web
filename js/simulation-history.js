
let simulationHistoryRecords = [];
let nextSimulationNumber = 1;

function cloneSimple(value){
  return JSON.parse(JSON.stringify(value));
}

function buildSimulationSummary(){
  const core=targetCoreValue();
  const weights=core>0?fundDefs.map(f=>100*f.value/core):fundDefs.map(()=>0);
  const inp=getInputs();
  const fundSummary=fundDefs.map((f,i)=>`${f.name}: ${weights[i].toFixed(1)}%`).join(' · ');
  const goodRuleLabels={
    trigger_amount:`Use up to ${(+cashTrigger.value||0).toFixed(1)}% of start-of-year CORE, then cash`,
    actual_gain:'Use up to actual annual gain, then cash',
    all_core:'Use CORE for full shortfall'
  };
  const badRuleLabels={
    cash_first:'Cash first, then CORE',
    core_first:'CORE first'
  };
  const saleLabels={
    equal:'Equal £ sales from each fund',
    proportional:'Proportional sales',
    overweight:'Most-overweight fund first'
  };
  return [
    fundSummary,
    `Objective: ${gbp(inp.objectiveTarget)} at age ${inp.objectiveAge}`,
    `Cash: ${gbp(inp.cashStart)}`,
    `Trigger: ${(+cashTrigger.value||0).toFixed(1)}%`,
    `Good year: ${goodRuleLabels[inp.goodYearRule]||inp.goodYearRule}`,
    `Bad year: ${badRuleLabels[inp.badYearRule]||inp.badYearRule}`,
    `CORE sales: ${saleLabels[inp.saleMethod]||inp.saleMethod}`,
    `Annual spending: ${gbp(inp.spending)}`,
    `Inflation assumption: ${(+inflMean.value||0).toFixed(1)}%`,
    `Simulations: ${Number(inp.sims).toLocaleString('en-GB')}`
  ].join(' · ');
}


function historyRecordAsResult(record){
 const currentAge=+(record.plan?.basics?.currentAge||0);
 const endAge=+(record.plan?.basics?.endAge||currentAge+(record.chartPoints?.at(-1)?.m||0)/12);
 const months=record.chartPoints?.at(-1)?.m||Math.max(0,(endAge-currentAge)*12);
 const snapshots=Array.from({length:months+1},()=>null);
 (record.chartPoints||[]).forEach(p=>{
   snapshots[p.m]=[p.p10,p.p50,p.p90];
 });
 // This special object carries precomputed points to avoid recomputing quantiles.
 return{
   currentAge,endAge,months,
   objectiveAge:record.objectiveAge,
   objectiveTarget:record.objectiveTarget,
   _historyPoints:record.chartPoints||[]
 };
}
function renderHistoryCanvas(canvas,record,hoverMonth=null){
 const res=historyRecordAsResult(record);
 const ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height;
 ctx.clearRect(0,0,W,H);ctx.fillStyle='#0d0f13';ctx.fillRect(0,0,W,H);
 const pts=res._historyPoints;
 if(!pts.length)return;

 const target=Math.max(0,res.objectiveTarget||0);
 const ymax=Math.max(...pts.map(p=>p.p90),target,1)*1.08;
 const Lm=76,Rm=106,Tm=20,Bm=38;
 ctx.strokeStyle='#252b34';ctx.lineWidth=1;ctx.font='600 13px Inter, system-ui';ctx.fillStyle='#aeb6c1';
 for(let i=0;i<=4;i++){
   const yy=Tm+(H-Tm-Bm)*i/4;
   ctx.beginPath();ctx.moveTo(Lm,yy);ctx.lineTo(W-Rm,yy);ctx.stroke();
   ctx.fillText(compactGBP(ymax*(1-i/4)),6,yy+4);
 }
 const maxM=pts[pts.length-1].m||1;
 const x=m=>Lm+(W-Lm-Rm)*m/maxM,y=v=>Tm+(H-Tm-Bm)*(1-v/ymax);
 [['p90','#8f99aa'],['p50','#5f91df'],['p10','#a75e65']].forEach(([k,col])=>{
   ctx.strokeStyle=col;ctx.lineWidth=k==='p50'?3:2;ctx.beginPath();
   pts.forEach((p,i)=>{const xx=x(p.m),yy=y(p[k]);i===0?ctx.moveTo(xx,yy):ctx.lineTo(xx,yy)});ctx.stroke();
 });
 for(let age=Math.ceil(res.currentAge/5)*5;age<=res.endAge;age+=5){
   const xx=x((age-res.currentAge)*12);ctx.fillStyle='#aeb6c1';
   ctx.fillText(age.toString(),xx-8,H-12);
 }
 const objectiveMonth=Math.max(0,Math.min(maxM,Math.round((res.objectiveAge-res.currentAge)*12)));
 const targetY=y(target),objectiveX=x(objectiveMonth);
 ctx.save();ctx.setLineDash([5,5]);ctx.strokeStyle='rgba(176,149,103,.7)';
 ctx.beginPath();ctx.moveTo(objectiveX,Tm);ctx.lineTo(objectiveX,H-Bm);ctx.stroke();
 ctx.beginPath();ctx.moveTo(Lm,targetY);ctx.lineTo(W-Rm,targetY);ctx.stroke();ctx.restore();

 const inspectMonth=hoverMonth===null?objectiveMonth:Math.max(0,Math.min(maxM,Math.round(hoverMonth/12)*12));
 const inspectX=x(inspectMonth),inspectAge=res.currentAge+inspectMonth/12;
 const point=pts.reduce((best,p)=>Math.abs(p.m-inspectMonth)<Math.abs(best.m-inspectMonth)?p:best,pts[0]);
 if(inspectMonth!==objectiveMonth){
   ctx.save();ctx.setLineDash([3,5]);ctx.strokeStyle='rgba(167,176,190,.45)';
   ctx.beginPath();ctx.moveTo(inspectX,Tm);ctx.lineTo(inspectX,H-Bm);ctx.stroke();ctx.restore();
 }
 ctx.font='600 13px Inter, system-ui';ctx.fillStyle='rgba(210,216,225,.72)';
 ctx.fillText(`Age ${Number.isInteger(inspectAge)?inspectAge:inspectAge.toFixed(1)}`,Math.min(inspectX+7,W-Rm-55),Tm+15);
 [{key:'p90',colour:'#8f99aa'},{key:'p50',colour:'#5f91df'},{key:'p10',colour:'#a75e65'}].forEach((item,idx)=>{
   const val=point[item.key],yy=y(val);
   ctx.fillStyle=item.colour;ctx.beginPath();ctx.arc(inspectX,yy,4,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='rgba(226,231,238,.75)';
   ctx.fillText(compactGBP(val),Math.min(inspectX+8,W-Rm+8),Math.max(Tm+15,Math.min(H-Bm-4,yy+(idx-1)*17)));
 });
}
function drawHistoryChart(canvas,record){
 canvas._retireLabRecord=record;
 renderHistoryCanvas(canvas,record,null);
 if(!canvas.dataset.interactive){
   let pinnedMonth=null;
   const getMonth=e=>{
     const rect=canvas.getBoundingClientRect(),clientX=e.touches?.[0]?.clientX??e.clientX;
     const xpx=(clientX-rect.left)*(canvas.width/rect.width);
     const maxM=record.chartPoints?.at(-1)?.m||1;
     return (xpx-76)/(canvas.width-76-106)*maxM;
   };
   canvas.onmousemove=e=>{if(pinnedMonth===null)renderHistoryCanvas(canvas,record,getMonth(e))};
   canvas.onmouseleave=()=>{if(pinnedMonth===null)renderHistoryCanvas(canvas,record,null)};
   canvas.onclick=e=>{pinnedMonth=Math.round(getMonth(e)/12)*12;renderHistoryCanvas(canvas,record,pinnedMonth)};
   canvas.ontouchmove=e=>{e.preventDefault();renderHistoryCanvas(canvas,record,getMonth(e))};
   canvas.dataset.interactive='1';
 }
}
function renderSimulationHistory(){
  const host=document.getElementById('simulationHistory');
  host.innerHTML='';
  if(!simulationHistoryRecords.length){
    host.innerHTML='<div class="empty-history">Run the model to create Simulation 1.</div>';
    return;
  }

  simulationHistoryRecords.forEach((record,index)=>{
    const card=document.createElement('article');
    card.className='sim-card'+(index===0?'':' collapsed');
    card.dataset.id=record.id;
    card.innerHTML=`
      <div class="sim-card-header">
        <div>
          <span class="sim-card-title">Simulation ${record.number}</span>
          <span class="sim-card-time">${record.time}</span>
        </div>
        <div class="sim-card-actions">
          <button type="button" class="collapse-btn small">${index===0?'Collapse':'Expand'}</button>
          ${index===0?'':`<button type="button" class="bin-btn small">Bin</button>`}
        </div>
      </div>
      <div class="sim-card-body">
        <div class="sim-metrics">
          <div class="sim-metric"><div class="k">Objective met</div><div class="v">${pct(record.objectiveMet)}</div></div>
          <div class="sim-metric"><div class="k">Median vs target</div><div class="v">${gbp(record.objectiveMedian-record.objectiveTarget)}</div></div>
          <div class="sim-metric"><div class="k">Plan success</div><div class="v">${pct(record.success)}</div></div>
          <div class="sim-metric"><div class="k">Survival to end age</div><div class="v">${pct(record.survive)}</div></div>
          <div class="sim-metric"><div class="k">10th percentile</div><div class="v">${gbp(record.p10)}</div></div>
          <div class="sim-metric"><div class="k">Median</div><div class="v">${gbp(record.median)}</div></div>
          <div class="sim-metric"><div class="k">90th percentile</div><div class="v">${gbp(record.p90)}</div></div>
        </div>
        <div class="chart-toolbar"><button type="button" class="ghost small expand-history-chart">Expand chart</button></div>
        <canvas class="sim-chart" width="1000" height="260"></canvas>
        <div class="sim-summary">${record.summary}</div>
      </div>`;
    host.appendChild(card);

    drawHistoryChart(card.querySelector('canvas'),record);
    card.querySelector('.expand-history-chart').addEventListener('click',()=>{
      openExpandedChart(record,`Simulation ${record.number}`);
    });

    const collapse=card.querySelector('.collapse-btn');
    collapse.addEventListener('click',()=>{
      card.classList.toggle('collapsed');
      collapse.textContent=card.classList.contains('collapsed')?'Expand':'Collapse';
    });

    const bin=card.querySelector('.bin-btn');
    if(bin){
      bin.addEventListener('click',()=>{
        simulationHistoryRecords=simulationHistoryRecords.filter(r=>r.id!==record.id);
        renderSimulationHistory();
      });
    }
  });
  if(typeof refreshComparisonSelectors==='function')refreshComparisonSelectors();
}

function snapshotSimulationResult(result){
  const step=Math.max(1,Math.floor(result.months/120));
  const chartPoints=[];
  for(let m=0;m<=result.months;m+=step){
    const arr=result.snapshots[m]||[0];
    chartPoints.push({
      m,
      p10:quantile(arr,.1),
      p50:quantile(arr,.5),
      p90:quantile(arr,.9)
    });
  }
  simulationHistoryRecords.unshift({
    id:Date.now()+'-'+Math.random().toString(36).slice(2),
    number:nextSimulationNumber++,
    time:new Date().toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'}),
    objectiveMet:result.objectiveMet,
    objectiveMedian:result.objectiveMedian,
    objectiveTarget:result.objectiveTarget,
    objectiveAge:result.objectiveAge,
    success:result.success,
    survive:result.survive,
    p10:result.p10,
    median:result.median,
    p90:result.p90,
    medianCash:result.medianCash,
    summary:buildSimulationSummary(),
    plan:cloneSimple(serialise()),
    chartPoints
  });
  renderSimulationHistory();
}
