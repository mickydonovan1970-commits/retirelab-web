(function(){
  let selectedAge = null;
  let roadmap = null;
  let roadmapMode = 'median';
  let exampleNumber = 1;

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
      cash*=1+inp.cashRate;
      const closingCore=funds.reduce((sum,value)=>sum+value,0);
      const annualGain=closingCore-coreBeforeReturn;
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
    arPortfolio.textContent=gbp(row.openingPortfolio);
    arCash.textContent=gbp(row.openingCash);
    arCore.textContent=gbp(row.openingCore);
    arCashTarget.textContent=gbp(row.fromCash);
    arCoreSale.textContent=gbp(row.fromCore);
    arClosingPortfolio.textContent=gbp(row.closingPortfolio);

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

    arPlanExplanation.textContent=`Gross withdrawal is planned expenditure of ${gbp(row.totalSpend)} less guaranteed income of ${gbp(row.income)}. Figures are gross, before tax.`;
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
