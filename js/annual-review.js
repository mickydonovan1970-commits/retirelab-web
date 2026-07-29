
(function(){
  let selectedAge = null;
  let medianResult = null;

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

  function medianPortfolioAt(age){
    const inp=getInputs();
    if(Math.abs(age-inp.currentAge)<.001)return inp.sippTotal;
    if(!medianResult || !medianResult.snapshots)return NaN;
    const month=Math.max(0,Math.min(medianResult.months,Math.round((age-inp.currentAge)*12)));
    const values=medianResult.snapshots[month]||[];
    return values.length?quantile(values,.5):NaN;
  }

  function splitProjectedPortfolio(total,age){
    const inp=getInputs();
    if(Math.abs(age-inp.currentAge)<.001){
      return {cash:inp.cashStart,core:Math.max(0,inp.sippTotal-inp.cashStart)};
    }
    const cashRatio=inp.sippTotal>0?inp.cashStart/inp.sippTotal:0;
    const cash=Math.max(0,total*cashRatio);
    return {cash,core:Math.max(0,total-cash)};
  }

  function salePlan(amount,core){
    amount=Math.max(0,Math.min(amount,core));
    if(amount<=.005)return fundDefs.map(()=>0);
    const weights=totalCore()>0?fundDefs.map(f=>f.value/totalCore()):fundDefs.map(()=>1/fundDefs.length);

    if(saleMethod.value==='equal'){
      const each=amount/fundDefs.length;
      return fundDefs.map(()=>each);
    }
    if(saleMethod.value==='proportional'){
      return weights.map(w=>amount*w);
    }

    const projected=weights.map(w=>core*w);
    const sales=projected.map(()=>0);
    let remaining=amount;
    while(remaining>.01 && projected.reduce((a,b)=>a+b,0)>.01){
      const total=projected.reduce((a,b)=>a+b,0);
      let best=0,bestOver=-Infinity;
      projected.forEach((v,i)=>{
        const over=v/total-weights[i];
        if(v>0 && over>bestOver){best=i;bestOver=over}
      });
      const take=Math.min(remaining,projected[best]);
      projected[best]-=take;sales[best]+=take;remaining-=take;
    }
    return sales;
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
    if(selectedAge===null || selectedAge<start || selectedAge>end)selectedAge=start;

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

    const normal=normalSpendAt(age);
    const large=largeSpendAt(age);
    const totalSpend=normal+large;
    const income=incomeAt(age);
    const withdrawal=Math.max(0,totalSpend-income);
    const portfolio=medianPortfolioAt(age);
    const position=splitProjectedPortfolio(Number.isFinite(portfolio)?portfolio:0,age);
    const coreSale=Math.max(0,withdrawal-position.cash);
    const sales=salePlan(coreSale,position.core);

    arNormalSpend.textContent=gbp(normal);
    arLargeSpend.textContent=gbp(large);
    arTotalSpend.textContent=gbp(totalSpend);
    arIncome.textContent=gbp(income);
    arWithdrawal.textContent=gbp(withdrawal);
    arPortfolio.textContent=Number.isFinite(portfolio)?gbp(portfolio):'Refresh roadmap';
    arCash.textContent=Number.isFinite(portfolio)?gbp(position.cash):'—';
    arCore.textContent=Number.isFinite(portfolio)?gbp(position.core):'—';
    arCashTarget.textContent=gbp(withdrawal);
    arCoreSale.textContent=Number.isFinite(portfolio)?gbp(coreSale):'—';

    arPlanExplanation.textContent=
      `Gross withdrawal is planned expenditure of ${gbp(totalSpend)} less guaranteed income of ${gbp(income)}. Figures are gross, before any tax.`;

    arActionExplanation.textContent=Number.isFinite(portfolio)
      ?(coreSale>0
        ?`The indicative cash balance is ${gbp(position.cash)}, leaving ${gbp(coreSale)} to be raised from CORE for the year's spending MMF.`
        :`The indicative cash balance covers the full gross withdrawal, so no CORE sale is shown for this planning year.`)
      :'Refresh the median roadmap to calculate the projected portfolio position.';

    arFundSales.innerHTML='';
    if(!Number.isFinite(portfolio)){
      arFundSales.innerHTML='<div class="annual-empty">Refresh the roadmap to calculate fund sales.</div>';
    }else if(coreSale<=.005){
      arFundSales.innerHTML='<div class="annual-empty">No CORE sale indicated.</div>';
    }else{
      const colours=typeof portfolioPieColours==='function'
        ?portfolioPieColours(fundDefs.length+1).slice(1)
        :fundDefs.map(()=> '#5f91df');
      fundDefs.forEach((fund,i)=>{
        const row=document.createElement('div');
        row.className='annual-sale-row';
        row.innerHTML=`<span class="annual-sale-dot" style="background:${colours[i%colours.length]}"></span>
          <span class="annual-sale-name">${fund.name}</span>
          <span class="annual-sale-value">${gbp(sales[i])}</span>`;
        arFundSales.appendChild(row);
      });
    }
    arSalesExplanation.textContent=`Suggested sales follow the Strategy setting: ${saleMethodText()}.`;
  }

  function refreshRoadmap(){
    refreshAnnualReview.disabled=true;
    refreshAnnualReview.textContent='Calculating median path…';
    setTimeout(()=>{
      try{
        const requested=Math.max(800,Math.min(+simCount.value||3000,3000));
        medianResult=runSimulation(null,requested,26000,true,null);
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

  refreshAnnualReview.addEventListener('click',refreshRoadmap);

  document.addEventListener('input',event=>{
    if(event.target.closest('[data-panel="annual-review"]'))return;
    medianResult=null;
    renderAgeStrip();
    renderAnnualReview();
  });
  document.addEventListener('change',event=>{
    if(event.target.closest('[data-panel="annual-review"]'))return;
    medianResult=null;
    renderAgeStrip();
    renderAnnualReview();
  });

  setTimeout(()=>{
    renderAgeStrip();
    renderAnnualReview();
  },400);
})();
