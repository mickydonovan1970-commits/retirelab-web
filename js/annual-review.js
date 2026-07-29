
(function(){
  let selectedAge = null;
  let roadmap = null;

  function annualInflationFactor(age){
    const inp=getInputs();
    const years=Math.max(0,age-inp.currentAge);
    return Math.pow(1+inp.inflMean,years);
  }

  function normalSpendAt(age){
    const inp=getInputs();
    return inp.spending*(inp.spendingIndex==='inflation'?annualInflationFactor(age):1);
  }

  function largeSpendAt(age){
    const inp=getInputs();
    return inp.expenses.reduce((sum,e)=>{
      if(age+1e-9<e.start || age>=e.start+e.term-1e-9)return sum;
      const annual=e.term<=1?e.amount:e.amount/e.term;
      return sum+annual*(e.indexed?annualInflationFactor(age):1);
    },0);
  }

  function incomeAt(age){
    const inp=getInputs();
    return inp.incomes.reduce((sum,x)=>{
      if(age+1e-9<x.start || age>x.end)return sum;
      const startFactor=x.basis==='today'
        ?Math.pow(1+inp.inflMean,Math.max(0,x.start-inp.currentAge))
        :1;
      const indexed=Math.pow(1+x.index/100,Math.max(0,age-x.start));
      return sum+x.amount*startFactor*indexed;
    },0);
  }

  function medianFundReturn(fund){
    const mu=(+fund.ret||0)/100;
    const vol=(+fund.vol||0)/100;
    return Math.exp(mu-.5*vol*vol)-1;
  }

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
      funds.forEach((value,index)=>{
        const take=Math.min(value,amount*value/total);
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
        if(value>.005&&overweight>bestOver){
          best=index;
          bestOver=overweight;
        }
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
    return {
      amount,
      sales:applyFundSale(funds,amount,method,targetWeights)
    };
  }

  function buildMedianRoadmap(){
    const inp=getInputs();
    const start=Math.ceil(inp.currentAge);
    const end=Math.floor(inp.endAge);
    const startingCore=Math.max(0,inp.sippTotal-inp.cashStart);
    const targetWeights=startingCore>0
      ?fundDefs.map(f=>Math.max(0,f.value)/startingCore)
      :fundDefs.map(()=>1/fundDefs.length);

    let funds=targetWeights.map(weight=>startingCore*weight);
    let cash=Math.max(0,inp.cashStart);
    let priorReturn=0;
    let priorGain=0;
    let priorReviewCore=startingCore;
    const rows=[];

    for(let age=start;age<=end;age++){
      const openingFunds=[...funds];
      const openingCore=openingFunds.reduce((sum,value)=>sum+value,0);
      const openingCash=cash;
      const normal=normalSpendAt(age);
      const large=largeSpendAt(age);
      const totalSpend=normal+large;
      const income=incomeAt(age);
      let need=Math.max(0,totalSpend-income);
      const surplus=Math.max(0,income-totalSpend);
      cash+=surplus;

      const isGood=priorReturn>inp.trigger;
      let fromCash=0;
      let fromCore=0;
      let sales=funds.map(()=>0);
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

        const firstCore=takeCore(Math.min(need,coreBudget));
        need-=firstCore;
        const cashTaken=takeCash(need,true);
        fromCash+=cashTaken;
        need-=cashTaken;
        if(need>.005)need-=takeCore(need);
      }else if(inp.badYearRule==='core_first'){
        need-=takeCore(need);
        if(need>.005){
          const cashTaken=takeCash(need,false);
          fromCash+=cashTaken;
          need-=cashTaken;
        }
      }else{
        const cashTaken=takeCash(need,false);
        fromCash+=cashTaken;
        need-=cashTaken;
        if(need>.005)need-=takeCore(need);
      }

      // Any amount still unfunded is shown explicitly.
      const unfunded=Math.max(0,need);

      const coreAfterWithdrawal=funds.reduce((sum,value)=>sum+value,0);
      const beforeReturnCore=coreAfterWithdrawal;
      funds=funds.map((value,index)=>value*(1+medianFundReturn(fundDefs[index])));
      const closingCore=funds.reduce((sum,value)=>sum+value,0);
      const annualGain=closingCore-beforeReturnCore;
      const annualReturn=beforeReturnCore>0?closingCore/beforeReturnCore-1:0;

      rows.push({
        age,
        normal,
        large,
        totalSpend,
        income,
        withdrawal:Math.max(0,totalSpend-income),
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
        closingPortfolio:cash+closingCore
      });

      priorReturn=annualReturn;
      priorGain=Math.max(0,annualGain);
      priorReviewCore=beforeReturnCore;
    }
    return rows;
  }

  function saleMethodText(){
    if(saleMethod.value==='equal')return 'equal £ sales from each fund';
    if(saleMethod.value==='proportional')return 'sales in proportion to the current CORE allocation';
    return 'sales from the most overweight fund first';
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
      button.addEventListener('click',()=>{
        selectedAge=age;
        renderAgeStrip();
        renderAnnualReview();
      });
      annualAgeStrip.appendChild(button);
    }
  }

  function renderAnnualReview(){
    const age=selectedAge??Math.ceil(getInputs().currentAge);
    annualReviewAgeDisplay.textContent=`Age ${age}`;
    const row=roadmap?.find(item=>item.age===age);

    if(!row){
      const normal=normalSpendAt(age);
      const large=largeSpendAt(age);
      const income=incomeAt(age);
      arNormalSpend.textContent=gbp(normal);
      arLargeSpend.textContent=gbp(large);
      arTotalSpend.textContent=gbp(normal+large);
      arIncome.textContent=gbp(income);
      arWithdrawal.textContent=gbp(Math.max(0,normal+large-income));
      arPortfolio.textContent='Refresh roadmap';
      arCash.textContent='—';
      arCore.textContent='—';
      arCashTarget.textContent='—';
      arCoreSale.textContent='—';
      arClosingPortfolio.textContent='—';
      arCashPct.textContent='—';
      arCorePct.textContent='—';
      arCashBar.style.width='0%';
      arCoreBar.style.width='0%';
      arYearBadge.classList.remove('good-year','weak-year');
      arYearBadge.textContent='—';
      arPriorReturn.textContent='Previous CORE return —';
      arPlanExplanation.textContent='Refresh the median roadmap to apply the withdrawal strategy year by year.';
      arActionExplanation.textContent='The roadmap will decide how much comes from cash and how much comes from CORE using the selected trigger and funding rules.';
      arFundSales.innerHTML='<div class="annual-empty">Refresh the roadmap to calculate fund sales.</div>';
      arSalesExplanation.textContent=`Suggested sales will follow the Strategy setting: ${saleMethodText()}.`;
      return;
    }

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

    arPlanExplanation.textContent=
      `Gross withdrawal is planned expenditure of ${gbp(row.totalSpend)} less guaranteed income of ${gbp(row.income)}. Figures are gross, before tax.`;

    const triggerText=`${(getInputs().trigger*100).toFixed(1)}%`;
    const returnText=pct(row.priorReturn);
    const classification=row.isGood?'above':'at or below';
    let actionText=`The preceding median CORE return is ${returnText}, ${classification} the ${triggerText} trigger. `;
    actionText+=`The selected rules therefore fund ${gbp(row.fromCore)} from CORE and ${gbp(row.fromCash)} from cash.`;
    if(row.unfunded>.005)actionText+=` ${gbp(row.unfunded)} remains unfunded because both available sources were exhausted or protected by the cash floor.`;
    arActionExplanation.textContent=actionText;

    arFundSales.innerHTML='';
    if(row.fromCore<=.005){
      arFundSales.innerHTML='<div class="annual-empty">No CORE sale indicated for this year.</div>';
    }else{
      const colours=typeof portfolioPieColours==='function'
        ?portfolioPieColours(fundDefs.length+1).slice(1)
        :fundDefs.map(()=> '#5f91df');
      fundDefs.forEach((fund,index)=>{
        const sale=row.sales[index]||0;
        const saleRow=document.createElement('div');
        saleRow.className='annual-sale-row';
        saleRow.innerHTML=`<span class="annual-sale-dot" style="background:${colours[index%colours.length]}"></span>
          <span class="annual-sale-name">${fund.name}</span>
          <span class="annual-sale-value">${gbp(sale)}</span>`;
        arFundSales.appendChild(saleRow);
      });
    }
    arSalesExplanation.textContent=`Suggested sales follow the Strategy setting: ${saleMethodText()}.`;
  }

  function refreshRoadmap(){
    refreshAnnualReview.disabled=true;
    refreshAnnualReview.textContent='Calculating median path…';
    setTimeout(()=>{
      try{
        roadmap=buildMedianRoadmap();
        renderAgeStrip();
        renderAnnualReview();
      }catch(error){
        console.error(error);
        alert('The Annual Review roadmap could not be calculated. Please check the model inputs.');
      }finally{
        refreshAnnualReview.disabled=false;
        refreshAnnualReview.textContent='Refresh median roadmap';
      }
    },30);
  }


  arWhyButton.addEventListener('click',()=>{
    arWhyPanel.classList.toggle('hidden');
    arWhyButton.textContent=arWhyPanel.classList.contains('hidden')?'Why?':'Hide why';
  });

  refreshAnnualReview.addEventListener('click',refreshRoadmap);

  document.addEventListener('input',event=>{
    if(event.target.closest('[data-panel="annual-review"]'))return;
    roadmap=null;
    renderAgeStrip();
    renderAnnualReview();
  });
  document.addEventListener('change',event=>{
    if(event.target.closest('[data-panel="annual-review"]'))return;
    roadmap=null;
    renderAgeStrip();
    renderAnnualReview();
  });

  setTimeout(()=>{
    renderAgeStrip();
    renderAnnualReview();
  },400);
})();
