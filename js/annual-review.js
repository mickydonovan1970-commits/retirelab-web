(function(){
  let selectedAge = null;
  let roadmap = null;
  let roadmapMode = 'median';
  let exampleNumber = 1;
  let roadmapChartPoints = [];
  let roadmapChartHoverIndex = null;

  function clampLocal(value,min,max){return Math.min(max,Math.max(min,value))}

  function applyFundSale(funds,amount,method,targetWeights){
    const sales=funds.map(()=>0);
    let remaining=Math.max(0,amount);
    if(remaining<=.005)return sales;

    if(method==='equal'){
      let active=funds.map((value,index)=>value>.005?index:null).filter(index=>index!==null);
      while(remaining>.005&&active.length){
        const each=remaining/active.length;
        const next=[];
        active.forEach(index=>{
          const take=Math.min(each,funds[index]);
          funds[index]-=take;
          sales[index]+=take;
          remaining-=take;
          if(funds[index]>.005)next.push(index);
        });
        active=next;
      }
      return sales;
    }

    if(method==='proportional'){
      const total=funds.reduce((sum,value)=>sum+value,0);
      if(total<=0)return sales;
      const requested=Math.min(amount,total);
      funds.forEach((value,index)=>{
        const take=Math.min(value,requested*value/total);
        funds[index]-=take;
        sales[index]+=take;
        remaining-=take;
      });
      return sales;
    }

    while(remaining>.005&&funds.reduce((sum,value)=>sum+value,0)>.005){
      const total=funds.reduce((sum,value)=>sum+value,0);
      let best=0,bestOver=-Infinity;
      funds.forEach((value,index)=>{
        const overweight=value/total-targetWeights[index];
        if(value>.005&&overweight>bestOver){best=index;bestOver=overweight}
      });
      const take=Math.min(remaining,funds[best]);
      funds[best]-=take;
      sales[best]+=take;
      remaining-=take;
    }
    return sales;
  }

  function fundWithdrawal(funds,requested,method,targetWeights){
    const available=funds.reduce((sum,value)=>sum+value,0);
    const amount=Math.min(Math.max(0,requested),available);
    return {amount,sales:applyFundSale(funds,amount,method,targetWeights)};
  }

  function correlatedAnnualNormals(rng,count){
    const L=cholesky(buildCorrelationMatrix());
    const z=Array.from({length:count},()=>randn(rng));
    const correlated=Array(count).fill(0);
    for(let i=0;i<count;i++)for(let k=0;k<=i;k++)correlated[i]+=L[i][k]*z[k];
    return correlated;
  }

  function yearlyFundReturns(mode,rng){
    if(mode==='median'){
      return fundDefs.map(fund=>{
        const mu=(+fund.ret||0)/100;
        const vol=Math.max(0,(+fund.vol||0)/100);
        return Math.exp(mu-.5*vol*vol)-1;
      });
    }
    const shocks=correlatedAnnualNormals(rng,fundDefs.length);
    return fundDefs.map((fund,index)=>{
      const mu=(+fund.ret||0)/100;
      const vol=Math.max(0,(+fund.vol||0)/100);
      return Math.exp(mu-.5*vol*vol+vol*shocks[index])-1;
    });
  }

  function spendingForYear(inp,age,inflationIndex){
    const normal=inp.spending*(inp.spendingIndex==='inflation'?inflationIndex:1);
    const large=inp.expenses.reduce((sum,e)=>{
      if(age+1e-9<e.start||age>=e.start+e.term-1e-9)return sum;
      const annual=e.term<=1?e.amount:e.amount/e.term;
      return sum+annual*(e.indexed?inflationIndex:1);
    },0);
    return {normal,large,total:normal+large};
  }

  function incomeForYear(inp,age,inflationIndex,incomeStartFactors){
    return inp.incomes.reduce((sum,x,index)=>{
      if(age+1e-9<x.start||age>x.end)return sum;
      if(incomeStartFactors[index]===null)incomeStartFactors[index]=inflationIndex;
      const startingAmount=x.basis==='today'?x.amount*incomeStartFactors[index]:x.amount;
      const indexed=Math.pow(1+x.index/100,Math.max(0,age-x.start));
      return sum+startingAmount*indexed;
    },0);
  }

  function buildRoadmap(mode='median',example=1){
    const inp=getInputs();
    const start=Math.ceil(inp.currentAge);
    const end=Math.floor(inp.endAge);
    const startingCore=Math.max(0,inp.sippTotal-inp.cashStart);
    const rawWeights=startingCore>0?fundDefs.map(f=>Math.max(0,+f.value||0)/startingCore):fundDefs.map(()=>1/fundDefs.length);
    const weightSum=rawWeights.reduce((a,b)=>a+b,0)||1;
    const targetWeights=rawWeights.map(w=>w/weightSum);
    let funds=targetWeights.map(weight=>startingCore*weight);
    let cash=Math.max(0,inp.cashStart);
    let inflationIndex=1;
    let priorReturn=0;
    let priorGain=0;
    let priorReviewCore=startingCore;
    const incomeStartFactors=inp.incomes.map(()=>null);
    const rng=mulberry32(((inp.seed||1)+(Math.max(1,example)-1)*100003+620000)>>>0);
    const rows=[];

    for(let age=start;age<=end;age++){
      const openingFunds=[...funds];
      const openingCore=openingFunds.reduce((sum,value)=>sum+value,0);
      const openingCash=cash;
      const spend=spendingForYear(inp,age,inflationIndex);
      const income=incomeForYear(inp,age,inflationIndex,incomeStartFactors);
      let need=Math.max(0,spend.total-income);
      const surplus=Math.max(0,income-spend.total);
      cash+=surplus;

      const isGood=priorReturn>inp.trigger;
      let fromCash=0;
      let fromCore=0;
      const sales=funds.map(()=>0);
      const floor=Math.max(0,inp.cashFloor);

      const takeCash=(requested,respectFloor=true)=>{
        const available=respectFloor?Math.max(0,cash-floor):Math.max(0,cash);
        const taken=Math.min(Math.max(0,requested),available);
        cash-=taken;
        return taken;
      };
      const takeCore=requested=>{
        const result=fundWithdrawal(funds,requested,inp.saleMethod,targetWeights);
        fromCore+=result.amount;
        result.sales.forEach((value,index)=>sales[index]+=value);
        return result.amount;
      };

      if(isGood){
        let coreBudget=0;
        if(inp.goodYearRule==='trigger_amount')coreBudget=Math.max(0,inp.trigger*priorReviewCore);
        else if(inp.goodYearRule==='actual_gain')coreBudget=Math.max(0,priorGain);
        else coreBudget=Infinity;
        need-=takeCore(Math.min(need,coreBudget));
        if(need>.005){const taken=takeCash(need,true);fromCash+=taken;need-=taken}
        if(need>.005)need-=takeCore(need);
      }else if(inp.badYearRule==='core_first'){
        need-=takeCore(need);
        if(need>.005){const taken=takeCash(need,false);fromCash+=taken;need-=taken}
      }else{
        const taken=takeCash(need,false);fromCash+=taken;need-=taken;
        if(need>.005)need-=takeCore(need);
      }

      const unfunded=Math.max(0,need);
      const coreBeforeReturn=funds.reduce((sum,value)=>sum+value,0);
      const fundReturns=yearlyFundReturns(mode,rng);
      funds=funds.map((value,index)=>value*(1+fundReturns[index]));
      const cashBeforeInterest=cash;
      cash*=1+inp.cashRate;
      const closingCore=funds.reduce((sum,value)=>sum+value,0);
      const annualGain=closingCore-coreBeforeReturn;
      const cashInterest=cash-cashBeforeInterest;
      const annualReturn=coreBeforeReturn>0?closingCore/coreBeforeReturn-1:0;
      const portfolioReturn=coreBeforeReturn>0
        ?fundReturns.reduce((sum,r,index)=>sum+r*(coreBeforeReturn?((funds[index]/(1+r))/coreBeforeReturn):0),0)
        :0;

      rows.push({
        age,
        normal:spend.normal,
        large:spend.large,
        totalSpend:spend.total,
        income,
        withdrawal:Math.max(0,spend.total-income),
        openingCash,
        openingCore,
        openingPortfolio:openingCash+openingCore,
        fundedCash:cashBeforeInterest,
        fundedCore:coreBeforeReturn,
        fundedPortfolio:cashBeforeInterest+coreBeforeReturn,
        fromCash,
        fromCore,
        unfunded,
        sales,
        priorReturn,
        priorGain,
        isGood,
        closingCash:cash,
        closingCore,
        closingPortfolio:cash+closingCore,
        surplus,
        annualGain,
        cashInterest,
        coreBeforeReturn,
        annualReturn,
        portfolioReturn,
        fundReturns,
        inflationRate:mode==='median'?inp.inflMean:clampLocal(inp.inflMean+inp.inflVol*randn(rng),-.02,.15),
        mode,
        example
      });

      priorReturn=annualReturn;
      priorGain=Math.max(0,annualGain);
      priorReviewCore=coreBeforeReturn;
      const nextInflation=rows[rows.length-1].inflationRate;
      inflationIndex*=1+nextInflation;
    }
    return rows;
  }

  function saleMethodText(){
    if(saleMethod.value==='equal')return 'equal £ sales from each fund';
    if(saleMethod.value==='proportional')return 'sales in proportion to the current CORE allocation';
    return 'sales from the most overweight fund first';
  }


  function roadmapEventsAtAge(age){
    const inp=getInputs();
    const events=[];
    inp.expenses.forEach(expense=>{
      if(age+1e-9<expense.start||age>=expense.start+expense.term-1e-9)return;
      const annual=expense.term<=1?expense.amount:expense.amount/expense.term;
      events.push({type:'expenditure',label:expense.name||'Planned expenditure',amount:annual});
    });
    inp.incomes.forEach(income=>{
      if(Math.abs(age-income.start)>.001)return;
      events.push({type:'income',label:income.name||'Guaranteed income begins',amount:income.amount});
    });
    return events;
  }

  function chartCurrency(value){
    if(!Number.isFinite(value))return '—';
    return new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(value);
  }

  function drawRoadmapChart(){
    const canvas=document.getElementById('roadmapWealthChart');
    const wrap=document.getElementById('roadmapChartWrap');
    const description=document.getElementById('roadmapJourneyDescription');
    if(!canvas||!wrap||!description)return;
    const rows=Array.isArray(roadmap)?roadmap:[];
    description.textContent=roadmapMode==='median'
      ?'Median Market — the smooth planning path used by the Roadmap.'
      :`Example Lifetime ${exampleNumber} — this exact seeded market and inflation sequence.`;

    const cssWidth=Math.max(320,wrap.clientWidth);
    const cssHeight=Math.max(220,wrap.clientHeight);
    const dpr=Math.max(1,window.devicePixelRatio||1);
    canvas.width=Math.round(cssWidth*dpr);
    canvas.height=Math.round(cssHeight*dpr);
    const ctx=canvas.getContext('2d');
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,cssWidth,cssHeight);

    if(!rows.length){
      ctx.fillStyle='#7d8795';ctx.font='12px Inter, system-ui, sans-serif';ctx.textAlign='center';
      ctx.fillText('Refresh the Roadmap to display the wealth journey.',cssWidth/2,cssHeight/2);
      roadmapChartPoints=[];return;
    }

    const pad={left:61,right:20,top:24,bottom:42};
    const plotW=cssWidth-pad.left-pad.right,plotH=cssHeight-pad.top-pad.bottom;
    const values=rows.map(row=>Math.max(0,row.closingPortfolio));
    const maximum=Math.max(...values,1),minimum=Math.min(...values,0),range=Math.max(1,maximum-minimum);
    const yMax=maximum+range*.12,yMin=Math.max(0,minimum-range*.08),yRange=Math.max(1,yMax-yMin);
    const xFor=index=>pad.left+(rows.length<=1?plotW/2:index/(rows.length-1)*plotW);
    const yFor=value=>pad.top+(yMax-value)/yRange*plotH;

    ctx.lineWidth=1;ctx.font='10px Inter, system-ui, sans-serif';ctx.textAlign='right';ctx.textBaseline='middle';
    for(let tick=0;tick<=4;tick++){
      const ratio=tick/4,y=pad.top+ratio*plotH,value=yMax-ratio*yRange;
      ctx.strokeStyle='rgba(119,130,145,.16)';ctx.beginPath();ctx.moveTo(pad.left,y);ctx.lineTo(cssWidth-pad.right,y);ctx.stroke();
      ctx.fillStyle='#778291';ctx.fillText(`£${Math.round(value/1000)}k`,pad.left-8,y);
    }
    ctx.textAlign='center';ctx.textBaseline='top';
    const labelEvery=rows.length>28?5:rows.length>18?3:rows.length>12?2:1;
    rows.forEach((row,index)=>{
      if(index%labelEvery!==0&&index!==rows.length-1)return;
      ctx.fillStyle='#778291';ctx.fillText(String(row.age),xFor(index),cssHeight-pad.bottom+12);
    });

    const gradient=ctx.createLinearGradient(0,pad.top,0,pad.top+plotH);
    gradient.addColorStop(0,'rgba(95,145,223,.20)');gradient.addColorStop(1,'rgba(95,145,223,0)');
    ctx.beginPath();
    rows.forEach((row,index)=>{const x=xFor(index),y=yFor(row.closingPortfolio);index===0?ctx.moveTo(x,y):ctx.lineTo(x,y)});
    ctx.lineTo(xFor(rows.length-1),pad.top+plotH);ctx.lineTo(xFor(0),pad.top+plotH);ctx.closePath();
    ctx.fillStyle=gradient;ctx.fill();

    ctx.beginPath();
    rows.forEach((row,index)=>{const x=xFor(index),y=yFor(row.closingPortfolio);index===0?ctx.moveTo(x,y):ctx.lineTo(x,y)});
    ctx.strokeStyle='#6f9ce0';ctx.lineWidth=2;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke();

    roadmapChartPoints=rows.map((row,index)=>({x:xFor(index),y:yFor(row.closingPortfolio),row,events:roadmapEventsAtAge(row.age)}));

    roadmapChartPoints.forEach(point=>{
      point.events.forEach((event,eventIndex)=>{
        const markerY=Math.max(pad.top+7,point.y-12-eventIndex*12);
        ctx.strokeStyle=event.type==='expenditure'?'rgba(179,154,120,.62)':'rgba(143,190,161,.62)';
        ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(point.x,point.y);ctx.lineTo(point.x,markerY);ctx.stroke();
        ctx.beginPath();ctx.arc(point.x,markerY,4.5,0,Math.PI*2);
        ctx.fillStyle=event.type==='expenditure'?'#b39a78':'#8fbea1';ctx.fill();
        ctx.strokeStyle='#101217';ctx.lineWidth=1.5;ctx.stroke();
      });
    });

    const selectedIndex=rows.findIndex(row=>row.age===selectedAge);
    if(selectedIndex>=0){
      const point=roadmapChartPoints[selectedIndex];
      ctx.strokeStyle='rgba(137,169,216,.32)';ctx.lineWidth=1;ctx.setLineDash([4,4]);
      ctx.beginPath();ctx.moveTo(point.x,pad.top);ctx.lineTo(point.x,pad.top+plotH);ctx.stroke();ctx.setLineDash([]);
      ctx.beginPath();ctx.arc(point.x,point.y,5.5,0,Math.PI*2);ctx.fillStyle='#89a9d8';ctx.fill();
      ctx.strokeStyle='#dbe6f5';ctx.lineWidth=1.5;ctx.stroke();
    }
    if(Number.isInteger(roadmapChartHoverIndex)&&roadmapChartPoints[roadmapChartHoverIndex]){
      const point=roadmapChartPoints[roadmapChartHoverIndex];
      ctx.beginPath();ctx.arc(point.x,point.y,4.5,0,Math.PI*2);ctx.fillStyle='#dbe6f5';ctx.fill();
      ctx.strokeStyle='#6f9ce0';ctx.lineWidth=2;ctx.stroke();
    }
  }

  function chartPointFromEvent(event){
    const canvas=document.getElementById('roadmapWealthChart');
    if(!canvas||!roadmapChartPoints.length)return null;
    const rect=canvas.getBoundingClientRect();
    const clientX=event.touches?.[0]?.clientX??event.clientX;
    const x=clientX-rect.left;
    let best=null,bestDistance=Infinity;
    roadmapChartPoints.forEach((point,index)=>{
      const distance=Math.abs(point.x-x);
      if(distance<bestDistance){bestDistance=distance;best={...point,index}}
    });
    return best;
  }

  function showRoadmapTooltip(point){
    const tooltip=document.getElementById('roadmapChartTooltip');
    const wrap=document.getElementById('roadmapChartWrap');
    if(!tooltip||!wrap||!point)return;
    const eventLines=point.events.map(event=>
      `<span class="roadmap-tooltip-event">${event.type==='expenditure'?'Planned expenditure':'Income begins'}: ${event.label}${Number.isFinite(event.amount)?` · ${chartCurrency(event.amount)}`:''}</span>`
    ).join('');
    tooltip.innerHTML=`<strong>Age ${point.row.age}</strong><span class="roadmap-tooltip-value">${chartCurrency(point.row.closingPortfolio)}</span><span class="roadmap-tooltip-event">End-of-year wealth remaining</span>${eventLines}`;
    tooltip.classList.remove('hidden');
    const left=Math.min(wrap.clientWidth-tooltip.offsetWidth-8,Math.max(8,point.x+12));
    const top=Math.min(wrap.clientHeight-tooltip.offsetHeight-8,Math.max(8,point.y-18));
    tooltip.style.left=`${left}px`;tooltip.style.top=`${top}px`;
  }

  function hideRoadmapTooltip(){
    document.getElementById('roadmapChartTooltip')?.classList.add('hidden');
    roadmapChartHoverIndex=null;drawRoadmapChart();
  }

  function setMode(mode){
    roadmapMode=mode;
    roadmapModeMedian.classList.toggle('active',mode==='median');
    roadmapModeExample.classList.toggle('active',mode==='example');
    roadmapExampleControls.classList.toggle('hidden',mode!=='example');
    refreshAnnualReview.textContent=mode==='median'?'Refresh median roadmap':'Refresh example lifetime';
    roadmap=null;
    refreshRoadmap();
  }

  function renderAgeStrip(){
    const inp=getInputs();
    const start=Math.ceil(inp.currentAge);
    const end=Math.floor(inp.endAge);
    if(selectedAge===null||selectedAge<start||selectedAge>end)selectedAge=start;
    annualAgeStrip.innerHTML='';
    for(let age=start;age<=end;age++){
      const button=document.createElement('button');
      button.type='button';
      button.className='annual-age-button'+(age===selectedAge?' active':'');
      button.textContent=age;
      button.addEventListener('click',()=>{selectedAge=age;renderAgeStrip();renderAnnualReview()});
      annualAgeStrip.appendChild(button);
    }
  }

  function resetRoadmapDisplay(age){
    const inp=getInputs();
    const inflation=Math.pow(1+inp.inflMean,Math.max(0,age-inp.currentAge));
    const spend=spendingForYear(inp,age,inflation);
    const income=incomeForYear(inp,age,inflation,inp.incomes.map(()=>null));
    arNormalSpend.textContent=gbp(spend.normal);
    arLargeSpend.textContent=gbp(spend.large);
    arTotalSpend.textContent=gbp(spend.total);
    arIncome.textContent=gbp(income);
    arWithdrawal.textContent=gbp(Math.max(0,spend.total-income));
    arPortfolio.textContent='Refresh roadmap';
    arCash.textContent=arCore.textContent=arCashTarget.textContent=arCoreSale.textContent=arClosingPortfolio.textContent='—';
    arClosingCash.textContent=arClosingCore.textContent='—';
    arPortfolioMovement.textContent=arCashMovement.textContent=arCoreMovement.textContent='—';
    arPortfolioChange.textContent=arCashChange.textContent=arCoreChange.textContent='—';
    arCashPct.textContent=arCorePct.textContent='—';
    arCashBar.style.width=arCoreBar.style.width='0%';
    arYearBadge.classList.remove('good-year','weak-year');
    arYearBadge.textContent='—';
    arPriorReturn.textContent='Previous CORE return —';
    arModeSource.textContent=roadmapMode==='median'?'Median assumptions':`Example Lifetime ${exampleNumber}`;
    arPlanExplanation.textContent='Refresh the roadmap to apply the withdrawal strategy year by year.';
    arActionExplanation.textContent='The roadmap will decide how much comes from cash and CORE using the selected trigger and funding rules.';
    arFundSales.innerHTML='<div class="annual-empty">Refresh the roadmap to calculate fund sales.</div>';
    arSalesExplanation.textContent=`Suggested sales will follow the Strategy setting: ${saleMethodText()}.`;
    drawRoadmapChart();
  }

  function signedGBP(value){
    if(Math.abs(value)<.005)return gbp(0);
    return `${value>0?'+':'−'}${gbp(Math.abs(value))}`;
  }

  function changeClass(value){
    if(Math.abs(value)<.005)return 'roadmap-neutral';
    return value>0?'roadmap-positive':'roadmap-negative';
  }

  function movementLines(items){
    return items.filter(item=>Math.abs(item.value)>.005).map(item=>
      `<div class="roadmap-movement-line"><span>${item.label}</span><strong class="${changeClass(item.value)}">${signedGBP(item.value)}</strong></div>`
    ).join('')||'<span class="roadmap-neutral">No movement</span>';
  }

  function renderChange(element,value,opening){
    const percentage=opening>0?value/opening:0;
    element.className=`roadmap-change ${changeClass(value)}`;
    element.innerHTML=`<strong>${signedGBP(value)}</strong><small>${percentage>0?'+':''}${(percentage*100).toFixed(1)}%</small>`;
  }

  function renderAnnualReview(){
    const age=selectedAge??Math.ceil(getInputs().currentAge);
    annualReviewAgeDisplay.textContent=`Age ${age}`;
    const row=roadmap?.find(item=>item.age===age);
    if(!row){resetRoadmapDisplay(age);return}

    arNormalSpend.textContent=gbp(row.normal);
    arLargeSpend.textContent=gbp(row.large);
    arTotalSpend.textContent=gbp(row.totalSpend);
    arIncome.textContent=gbp(row.income);
    arWithdrawal.textContent=gbp(row.withdrawal);
    arPortfolio.textContent=gbp(row.fundedPortfolio);
    arCash.textContent=gbp(row.fundedCash);
    arCore.textContent=gbp(row.fundedCore);
    arCashTarget.textContent=gbp(row.fromCash);
    arCoreSale.textContent=gbp(row.fromCore);
    arClosingPortfolio.textContent=gbp(row.closingPortfolio);
    arClosingCash.textContent=gbp(row.closingCash);
    arClosingCore.textContent=gbp(row.closingCore);

    const portfolioChange=row.closingPortfolio-row.fundedPortfolio;
    const cashChange=row.closingCash-row.fundedCash;
    const coreChange=row.closingCore-row.fundedCore;
    arPortfolioMovement.innerHTML=movementLines([
      {label:'Investment & cash return',value:row.annualGain+row.cashInterest}
    ]);
    arCashMovement.innerHTML=movementLines([
      {label:'Cash interest',value:row.cashInterest}
    ]);
    arCoreMovement.innerHTML=movementLines([
      {label:'Investment return',value:row.annualGain}
    ]);
    renderChange(arPortfolioChange,portfolioChange,row.fundedPortfolio);
    renderChange(arCashChange,cashChange,row.fundedCash);
    renderChange(arCoreChange,coreChange,row.fundedCore);

    const fundingTotal=Math.max(0,row.fromCash+row.fromCore);
    const cashPct=fundingTotal>0?row.fromCash/fundingTotal*100:0;
    const corePct=fundingTotal>0?row.fromCore/fundingTotal*100:0;
    arCashPct.textContent=`${cashPct.toFixed(0)}% of portfolio funding`;
    arCorePct.textContent=`${corePct.toFixed(0)}% of portfolio funding`;
    arCashBar.style.width=`${cashPct}%`;
    arCoreBar.style.width=`${corePct}%`;

    arYearBadge.classList.remove('good-year','weak-year');
    arYearBadge.classList.add(row.isGood?'good-year':'weak-year');
    arYearBadge.textContent=row.isGood?'Good year rule':'Weak year rule';
    arPriorReturn.textContent=`Previous CORE return ${pct(row.priorReturn)}`;
    arModeSource.textContent=roadmapMode==='median'
      ?`Median year return ${pct(row.annualReturn)}`
      :`Example ${exampleNumber} · this year ${pct(row.annualReturn)} · inflation ${pct(row.inflationRate)}`;

    arPlanExplanation.textContent=`Gross withdrawal is planned expenditure of ${gbp(row.totalSpend)} less guaranteed income of ${gbp(row.income)}. Once funded, that money leaves the investment model. Figures are gross, before tax.`;
    const triggerText=`${(getInputs().trigger*100).toFixed(1)}%`;
    const classification=row.isGood?'above':'at or below';
    let actionText=`The preceding CORE return is ${pct(row.priorReturn)}, ${classification} the ${triggerText} trigger. `;
    actionText+=`The selected rules therefore fund ${gbp(row.fromCore)} from CORE and ${gbp(row.fromCash)} from cash.`;
    if(row.unfunded>.005)actionText+=` ${gbp(row.unfunded)} remains unfunded.`;
    arActionExplanation.textContent=actionText;

    arFundSales.innerHTML='';
    if(row.fromCore<=.005){
      arFundSales.innerHTML='<div class="annual-empty">No CORE sale indicated for this year.</div>';
    }else{
      const colours=typeof portfolioPieColours==='function'?portfolioPieColours(fundDefs.length+1).slice(1):fundDefs.map(()=> '#5f91df');
      fundDefs.forEach((fund,index)=>{
        const saleRow=document.createElement('div');
        saleRow.className='annual-sale-row';
        saleRow.innerHTML=`<span class="annual-sale-dot" style="background:${colours[index%colours.length]}"></span><span class="annual-sale-name">${fund.name}</span><span class="annual-sale-value">${gbp(row.sales[index]||0)}</span>`;
        arFundSales.appendChild(saleRow);
      });
    }
    arSalesExplanation.textContent=`Suggested sales follow the Strategy setting: ${saleMethodText()}.`;
    drawRoadmapChart();
  }

  function refreshRoadmap(){
    refreshAnnualReview.disabled=true;
    refreshAnnualReview.textContent=roadmapMode==='median'?'Calculating median path…':'Generating example lifetime…';
    setTimeout(()=>{
      try{
        roadmap=buildRoadmap(roadmapMode,exampleNumber);
        renderAgeStrip();
        renderAnnualReview();
      }catch(error){
        console.error(error);
        alert('The Roadmap could not be calculated. Please check the model inputs.');
      }finally{
        refreshAnnualReview.disabled=false;
        refreshAnnualReview.textContent=roadmapMode==='median'?'Refresh median roadmap':'Refresh example lifetime';
      }
    },30);
  }

  arWhyButton.addEventListener('click',()=>{
    arWhyPanel.classList.toggle('hidden');
    arWhyButton.textContent=arWhyPanel.classList.contains('hidden')?'Why?':'Hide why';
  });
  roadmapModeMedian.addEventListener('click',()=>setMode('median'));
  roadmapModeExample.addEventListener('click',()=>setMode('example'));
  previousRoadmapSeed.addEventListener('click',()=>{
    exampleNumber=Math.max(1,exampleNumber-1);
    roadmapSeedNumber.value=exampleNumber;
    if(roadmapMode!=='example')setMode('example');else refreshRoadmap();
  });
  nextRoadmapSeed.addEventListener('click',()=>{
    exampleNumber+=1;
    roadmapSeedNumber.value=exampleNumber;
    if(roadmapMode!=='example')setMode('example');else refreshRoadmap();
  });
  roadmapSeedNumber.addEventListener('change',()=>{
    exampleNumber=Math.max(1,Math.floor(+roadmapSeedNumber.value||1));
    roadmapSeedNumber.value=exampleNumber;
    if(roadmapMode!=='example')setMode('example');else refreshRoadmap();
  });
  refreshAnnualReview.addEventListener('click',refreshRoadmap);

  const roadmapCanvas=document.getElementById('roadmapWealthChart');
  roadmapCanvas?.addEventListener('mousemove',event=>{
    const point=chartPointFromEvent(event);if(!point)return;
    roadmapChartHoverIndex=point.index;drawRoadmapChart();showRoadmapTooltip(point);
  });
  roadmapCanvas?.addEventListener('mouseleave',hideRoadmapTooltip);
  roadmapCanvas?.addEventListener('click',event=>{
    const point=chartPointFromEvent(event);if(!point)return;
    selectedAge=point.row.age;renderAgeStrip();renderAnnualReview();showRoadmapTooltip(point);
  });
  roadmapCanvas?.addEventListener('touchstart',event=>{
    const point=chartPointFromEvent(event);if(!point)return;
    event.preventDefault();roadmapChartHoverIndex=point.index;selectedAge=point.row.age;
    renderAgeStrip();renderAnnualReview();showRoadmapTooltip(point);
  },{passive:false});
  window.addEventListener('resize',()=>requestAnimationFrame(drawRoadmapChart));

  document.addEventListener('input',event=>{
    if(event.target.closest('[data-panel="annual-review"]'))return;
    roadmap=null;renderAgeStrip();renderAnnualReview();
  });
  document.addEventListener('change',event=>{
    if(event.target.closest('[data-panel="annual-review"]'))return;
    roadmap=null;renderAgeStrip();renderAnnualReview();
  });

  setTimeout(()=>{renderAgeStrip();renderAnnualReview()},400);
})();
