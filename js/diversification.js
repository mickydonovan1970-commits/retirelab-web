
(function(){
  const REGION_LABELS={
    us:'US',uk:'UK',europe:'Europe ex UK',japan:'Japan',
    emerging:'Emerging markets',other:'Other developed markets'
  };

  const BENCHMARK_GROUPS={
    'vanguard-global-all-cap':'Broad global equity',
    'vanguard-all-world-etf':'Broad global equity',
    'hsbc-all-world':'Broad global equity',
    'spdr-acwi-imi':'Broad global equity',
    'fidelity-index-world':'Developed-world equity',
    'lg-global-100':'Global mega-cap equity',
    'vanguard-sp500':'S&P 500',
    'spdr-sp500':'S&P 500',
    'ishares-sp500':'S&P 500',
    'ishares-ftse100':'FTSE 100',
    'vanguard-ftse250':'FTSE 250',
    'vanguard-uk-all-share':'Broad UK equity',
    'vanguard-europe-exuk':'Europe ex UK',
    'ishares-core-europe':'Europe',
    'ishares-japan-imi':'Japan equity',
    'vanguard-japan':'Japan equity',
    'vanguard-em':'Emerging markets',
    'ishares-em-imi':'Emerging markets',
    'lifestrategy20':'Vanguard LifeStrategy',
    'lifestrategy40':'Vanguard LifeStrategy',
    'lifestrategy60':'Vanguard LifeStrategy',
    'lifestrategy80':'Vanguard LifeStrategy',
    'lifestrategy100':'Vanguard LifeStrategy',
    'artemis-global-income':'Global equity income',
    'bny-global-income':'Global equity income',
    'fidelity-global-dividend':'Global equity income'
  };

  function normaliseName(value){return String(value||'').trim().toLowerCase()}

  function libraryItem(fund){
    return typeof libraryFundById==='function'&&fund.libraryId
      ?libraryFundById(fund.libraryId)
      :null;
  }

  function providerFor(fund){
    const item=libraryItem(fund);
    if(item?.provider)return item.provider;
    if(fund.provider)return fund.provider;
    const name=normaliseName(fund.name);
    const known=[
      ['vanguard','Vanguard'],['ishares','iShares'],['spdr','State Street SPDR'],
      ['legal & general','L&G'],['l&g','L&G'],['fidelity','Fidelity'],
      ['hsbc','HSBC'],['orbis','Orbis'],['artemis','Artemis'],
      ['bny','BNY'],['ruffer','Ruffer'],['royal london','Royal London']
    ];
    return known.find(([token])=>name.includes(token))?.[1]||'Unknown / custom';
  }

  function equityShare(fund){
    const item=libraryItem(fund);
    const category=item?.category||fund.category||'Custom';
    const type=normaliseName(item?.type||fund.type);
    const name=normaliseName(fund.name);
    if(category==='Bonds and Cash')return 0;
    if(category==='Multi-Asset'){
      const match=type.match(/(\d+)%\s*equity/)||name.match(/(\d+)%\s*equity/);
      if(match)return Math.max(0,Math.min(1,+match[1]/100));
      return .6;
    }
    if(category==='Defensive / Flexible'){
      if(name.includes('ruffer'))return .35;
      if(name.includes('orbis'))return .78;
      return .5;
    }
    return 1;
  }

  function regionMix(fund){
    const item=libraryItem(fund);
    const category=item?.category||fund.category||'Custom';
    const name=normaliseName(fund.name);
    const broadGlobal={us:.62,uk:.04,europe:.14,japan:.06,emerging:.10,other:.04};
    if(category==='US Equity')return {us:1};
    if(category==='UK Equity')return {uk:1};
    if(category==='Europe')return {europe:.92,uk:.08};
    if(category==='Japan')return {japan:1};
    if(category==='Emerging Markets')return {emerging:1};
    if(category==='Global Equity')return broadGlobal;
    if(category==='Income')return {us:.46,uk:.14,europe:.22,japan:.06,emerging:.07,other:.05};
    if(category==='Multi-Asset')return {us:.48,uk:.18,europe:.14,japan:.06,emerging:.09,other:.05};
    if(category==='Defensive / Flexible'){
      if(name.includes('orbis'))return {us:.38,uk:.11,europe:.20,japan:.10,emerging:.11,other:.10};
      return {us:.35,uk:.25,europe:.20,japan:.05,emerging:.05,other:.10};
    }
    return null;
  }

  function styleTags(fund){
    const item=libraryItem(fund);
    const name=normaliseName(fund.name);
    const type=normaliseName(item?.type||fund.type);
    const category=item?.category||fund.category||'Custom';
    const tags=[];
    if(type.includes('index')||type.includes('tracker')||type.includes('etf')||
       name.includes('index')||name.includes('s&p')||name.includes('ftse')||name.includes('msci'))tags.push('Passive / index');
    else tags.push('Active');
    if(category==='Income'||name.includes('income')||name.includes('dividend'))tags.push('Equity income');
    if(name.includes('orbis')||type.includes('value')||name.includes('value'))tags.push('Value / contrarian');
    if(name.includes('global 100')||type.includes('mega-cap')||name.includes('s&p 500'))tags.push('Large / mega cap');
    if(category==='Multi-Asset')tags.push('Multi-asset');
    if(category==='Defensive / Flexible'||category==='Bonds and Cash')tags.push('Defensive');
    return tags;
  }

  function benchmarkGroup(fund){
    if(fund.libraryId&&BENCHMARK_GROUPS[fund.libraryId])return BENCHMARK_GROUPS[fund.libraryId];
    const name=normaliseName(fund.name);
    if(name.includes('s&p 500'))return 'S&P 500';
    if(name.includes('global')&&(name.includes('index')||name.includes('all cap')||name.includes('all-world')))return 'Broad global equity';
    if(name.includes('income')||name.includes('dividend'))return 'Global equity income';
    return null;
  }

  function weightedBreakdown(entries,keyFn){
    const result=new Map();
    entries.forEach(entry=>{
      const key=keyFn(entry);
      if(!key)return;
      result.set(key,(result.get(key)||0)+entry.weight);
    });
    return [...result.entries()].sort((a,b)=>b[1]-a[1]);
  }

  function levelFromShare(share,moderate,severe){
    if(share>=severe)return 'high';
    if(share>=moderate)return 'watch';
    return 'good';
  }

  function equityExposureBand(equity){
    if(equity>=.9)return {label:'Very equity-heavy',status:'high'};
    if(equity>=.75)return {label:'Equity-heavy',status:'watch'};
    if(equity>=.5)return {label:'Mixed asset',status:'good'};
    return {label:'Defensive-leaning',status:'good'};
  }

  function dimensionCard(label,status,value,detail){
    return `<article class="diversification-dimension ${status}">
      <span>${label}</span><strong>${value}</strong><small>${detail}</small>
    </article>`;
  }

  function warningItem(level,title,text){
    return `<article class="diversification-warning ${level}">
      <span class="diversification-warning-icon">${level==='high'?'!':level==='watch'?'•':'✓'}</span>
      <div><strong>${title}</strong><p>${text}</p></div>
    </article>`;
  }

  function renderDiversificationAnalysis(){
    const panel=document.getElementById('diversificationPanel');
    if(!panel||!Array.isArray(window.fundDefs||fundDefs))return;
    const total=totalCore();
    const scoreEl=document.getElementById('diversificationScore');
    const ratingEl=document.getElementById('diversificationRating');
    const dimensionsEl=document.getElementById('diversificationDimensions');
    const warningsEl=document.getElementById('diversificationWarnings');
    const coverageEl=document.getElementById('diversificationCoverage');

    if(total<=0||!fundDefs.length){
      scoreEl.textContent='—';
      ratingEl.textContent='Waiting for portfolio';
      dimensionsEl.innerHTML='';
      warningsEl.innerHTML='<div class="annual-empty">Add and allocate funds to run the diversification check.</div>';
      coverageEl.innerHTML='';
      return;
    }

    const entries=fundDefs.map((fund,index)=>({
      fund,index,
      weight:Math.max(0,+fund.value||0)/total,
      provider:providerFor(fund),
      equity:equityShare(fund),
      regions:regionMix(fund),
      tags:styleTags(fund),
      benchmark:benchmarkGroup(fund),
      known:!!libraryItem(fund)
    })).filter(entry=>entry.weight>0.00001);

    const warnings=[];
    let penalty=0;

    // Fund concentration.
    const sorted=[...entries].sort((a,b)=>b.weight-a.weight);
    const largest=sorted[0];
    const hhi=entries.reduce((sum,e)=>sum+e.weight*e.weight,0);
    const effectiveFunds=hhi>0?1/hhi:0;
    if(largest.weight>=.5){
      penalty+=20;
      warnings.push(['high','Single-fund concentration',
        `${largest.fund.name} represents ${(largest.weight*100).toFixed(1)}% of CORE. One mandate will dominate the portfolio's behaviour.`]);
    }else if(largest.weight>=.35){
      penalty+=11;
      warnings.push(['watch','Large single-fund allocation',
        `${largest.fund.name} represents ${(largest.weight*100).toFixed(1)}% of CORE. Review whether that concentration is deliberate.`]);
    }else if(largest.weight>=.25&&entries.length<=3){
      penalty+=5;
    }
    if(effectiveFunds<2.2){penalty+=8}
    else if(effectiveFunds<3){penalty+=4}

    // Provider/manager concentration.
    const providers=weightedBreakdown(entries,e=>e.provider);
    const topProvider=providers[0];
    if(topProvider&&topProvider[0]!=='Unknown / custom'){
      if(topProvider[1]>=.65){
        penalty+=12;
        warnings.push(['high','Provider concentration',
          `${topProvider[0]} manages ${(topProvider[1]*100).toFixed(1)}% of CORE. Separate funds from one provider may still share construction, stewardship or operational risks.`]);
      }else if(topProvider[1]>=.45){
        penalty+=6;
        warnings.push(['watch','Provider concentration',
          `${topProvider[0]} manages ${(topProvider[1]*100).toFixed(1)}% of CORE across the selected holdings.`]);
      }
    }

    // Estimated asset-class exposure.
    const equity=entries.reduce((sum,e)=>sum+e.weight*e.equity,0);
    const defensive=1-equity;
    const equityBand=equityExposureBand(equity);
    if(equity>=.9){
      penalty+=11;
      warnings.push(['high','Very equity-heavy exposure',
        `Estimated equity exposure is about ${(equity*100).toFixed(0)}%. Most diversification is between equity mandates rather than between asset classes.`]);
    }else if(equity>=.75){
      penalty+=6;
      warnings.push(['watch','Equity-heavy exposure',
        `Estimated equity exposure is about ${(equity*100).toFixed(0)}%. The portfolio remains growth-oriented despite any balanced or defensive holdings.`]);
    }else if(defensive>=.75){
      penalty+=8;
      warnings.push(['watch','Defensive-asset concentration',
        `Estimated bond, cash and defensive exposure is about ${(defensive*100).toFixed(0)}%. Long-term growth may depend heavily on defensive assets.`]);
    }

    // Geographic concentration from mandate proxies.
    const regionTotals={};
    let regionCoverage=0;
    entries.forEach(e=>{
      if(!e.regions)return;
      regionCoverage+=e.weight;
      Object.entries(e.regions).forEach(([region,share])=>{
        regionTotals[region]=(regionTotals[region]||0)+e.weight*e.equity*share;
      });
    });
    const equityTotal=Math.max(.0001,equity);
    const regions=Object.entries(regionTotals)
      .map(([region,amount])=>[region,amount/equityTotal])
      .sort((a,b)=>b[1]-a[1]);
    const topRegion=regions[0];
    if(topRegion){
      const [region,share]=topRegion;
      const label=REGION_LABELS[region]||region;
      const threshold=region==='us'?.72:.45;
      const severe=region==='us'?.82:.65;
      if(share>=severe){
        penalty+=12;
        warnings.push(['high',`${label} concentration`,
          `The mandate-based proxy estimates roughly ${(share*100).toFixed(0)}% of equity exposure in ${label}.`]);
      }else if(share>=threshold){
        penalty+=6;
        warnings.push(['watch',`${label}-led exposure`,
          `The mandate-based proxy estimates roughly ${(share*100).toFixed(0)}% of equity exposure in ${label}. This may be normal for a global market portfolio, but it is still a concentration.`]);
      }
    }

    // Likely benchmark/mandate overlap.
    const benchmarks=weightedBreakdown(entries,e=>e.benchmark);
    benchmarks.forEach(([group,share])=>{
      const count=entries.filter(e=>e.benchmark===group).length;
      if(count<2)return;
      if(share>=.55){
        penalty+=10;
        warnings.push(['high','Potential holdings overlap',
          `${count} holdings with similar “${group}” mandates make up ${(share*100).toFixed(1)}% of CORE. Their underlying securities may overlap substantially.`]);
      }else if(share>=.3){
        penalty+=5;
        warnings.push(['watch','Potential holdings overlap',
          `${count} holdings with similar “${group}” mandates make up ${(share*100).toFixed(1)}% of CORE.`]);
      }
    });

    // Style concentration.
    const styleMap=new Map();
    entries.forEach(e=>e.tags.forEach(tag=>styleMap.set(tag,(styleMap.get(tag)||0)+e.weight)));
    const styles=[...styleMap.entries()].sort((a,b)=>b[1]-a[1]);
    const passive=styleMap.get('Passive / index')||0;
    const income=styleMap.get('Equity income')||0;
    const largeCap=styleMap.get('Large / mega cap')||0;
    if(passive>=.75&&equity>=.75){
      penalty+=4;
      warnings.push(['watch','Likely market-cap style exposure',
        `${(passive*100).toFixed(0)}% of CORE is held in index-like mandates. Multiple trackers may diversify wrappers without materially diversifying the underlying market exposure.`]);
    }
    if(income>=.5){
      penalty+=6;
      warnings.push(['watch','Likely equity-income style overlap',
        `${(income*100).toFixed(0)}% of CORE is in income-oriented equity mandates, which may share dividend, value and sector biases.`]);
    }
    if(largeCap>=.55){
      penalty+=5;
      warnings.push(['watch','Large-company bias',
        `${(largeCap*100).toFixed(0)}% of CORE is explicitly tilted to large or mega-cap companies.`]);
    }

    // Data coverage.
    const knownWeight=entries.filter(e=>e.known).reduce((s,e)=>s+e.weight,0);
    const unknownWeight=1-knownWeight;
    if(unknownWeight>.3){
      penalty+=4;
      warnings.push(['watch','Limited look-through information',
        `${(unknownWeight*100).toFixed(0)}% of CORE is in custom or unclassified holdings. Geographic and style overlap may therefore be understated.`]);
    }

    // Sensible rewards for genuinely different mandates, capped so score remains conservative.
    const categoryCount=new Set(entries.map(e=>(libraryItem(e.fund)?.category||e.fund.category||'Custom'))).size;
    if(entries.length>=4&&effectiveFunds>=3.4)penalty-=4;
    if(categoryCount>=3&&equity<.9)penalty-=4;
    if(providers.length>=4&&topProvider?.[1]<.4)penalty-=3;

    const score=Math.max(20,Math.min(95,Math.round(100-penalty)));
    let rating='Concentrated';
    if(score>=82)rating='Strong';
    else if(score>=68)rating='Good';
    else if(score>=52)rating='Moderate';

    scoreEl.textContent=String(score);
    ratingEl.textContent=rating;
    ratingEl.dataset.rating=rating.toLowerCase();

    const fundStatus=levelFromShare(largest.weight,.35,.5);
    const managerStatus=topProvider?levelFromShare(topProvider[1],.45,.65):'good';
    const assetStatus=equityBand.status;
    const overlapShare=benchmarks.find(([,share])=>share>=.3)?.[1]||0;
    const overlapStatus=overlapShare>=.55?'high':overlapShare>=.3?'watch':'good';

    dimensionsEl.innerHTML=[
      dimensionCard('Fund balance',fundStatus,
        `${(largest.weight*100).toFixed(0)}% largest`,
        `${effectiveFunds.toFixed(1)} effective funds`),
      dimensionCard('Provider concentration',managerStatus,
        topProvider?`${(topProvider[1]*100).toFixed(0)}% ${topProvider[0]}`:'—',
        `${providers.length} provider${providers.length===1?'':'s'}`),
      dimensionCard('Estimated equity exposure',assetStatus,
        `~${(equity*100).toFixed(0)}% equity`,
        `${equityBand.label} · ${(defensive*100).toFixed(0)}% defensive proxy`),
      dimensionCard('Potential holdings overlap',overlapStatus,
        overlapShare?`${(overlapShare*100).toFixed(0)}% similar mandates`:'Low flagged overlap',
        'Based on category and benchmark proxies')
    ].join('');

    if(!warnings.length){
      warnings.push(['good','No major concentration flags',
        'The mandate-based screen did not identify a dominant fund, provider, asset-class exposure or duplicated benchmark. Actual underlying holdings may still overlap.']);
    }
    warningsEl.innerHTML=warnings.slice(0,6).map(w=>warningItem(...w)).join('');

    const topRegionText=topRegion
      ?`${REGION_LABELS[topRegion[0]]||topRegion[0]} ${(topRegion[1]*100).toFixed(0)}% of estimated equity exposure`
      :'Geographic profile unavailable';
    coverageEl.innerHTML=`<span><strong>Model coverage:</strong> ${(knownWeight*100).toFixed(0)}% library-classified</span>
      <span><strong>Largest estimated geographic exposure:</strong> ${topRegionText}</span>`;
  }

  window.renderDiversificationAnalysis=renderDiversificationAnalysis;
  setTimeout(renderDiversificationAnalysis,350);
})();
