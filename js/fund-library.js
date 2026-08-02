const FUND_LIBRARY=[
  {
    "id": "vanguard-global-all-cap",
    "name": "Vanguard FTSE Global All Cap Index Fund",
    "provider": "Vanguard",
    "category": "Global Equity",
    "type": "Global all-cap index fund",
    "identifier": "VAFTGAG",
    "ret": 7.4,
    "vol": 16.0,
    "corr": 0.89,
    "popular": true,
    "description": "Developed and emerging-market large, mid and small companies."
  },
  {
    "id": "vanguard-all-world-etf",
    "name": "Vanguard FTSE All-World UCITS ETF",
    "provider": "Vanguard",
    "category": "Global Equity",
    "type": "Global large/mid-cap ETF",
    "identifier": "VWRP / VWRL",
    "ret": 7.4,
    "vol": 15.8,
    "corr": 0.9,
    "popular": true,
    "description": "Broad developed and emerging-market equity tracker."
  },
  {
    "id": "hsbc-all-world",
    "name": "HSBC FTSE All-World Index Fund",
    "provider": "HSBC",
    "category": "Global Equity",
    "type": "Global index fund",
    "identifier": "—",
    "ret": 7.4,
    "vol": 15.8,
    "corr": 0.9,
    "popular": true,
    "description": "Low-cost developed and emerging-market equity exposure."
  },
  {
    "id": "fidelity-index-world",
    "name": "Fidelity Index World Fund",
    "provider": "Fidelity",
    "category": "Global Equity",
    "type": "Developed-world index fund",
    "identifier": "—",
    "ret": 7.3,
    "vol": 15.5,
    "corr": 0.9,
    "popular": false,
    "description": "Developed-market large and mid-cap equities."
  },
  {
    "id": "lg-global-100",
    "name": "L&G Global 100 Index Trust",
    "provider": "L&G",
    "category": "Global Equity",
    "type": "Global mega-cap index fund",
    "identifier": "GB00B0CNH056",
    "ret": 7.5,
    "vol": 16.5,
    "corr": 0.86,
    "popular": true,
    "description": "Concentrated exposure to 100 large multinational companies."
  },
  {
    "id": "spdr-acwi-imi",
    "name": "SPDR MSCI ACWI IMI UCITS ETF",
    "provider": "State Street SPDR",
    "category": "Global Equity",
    "type": "Global all-cap ETF",
    "identifier": "SPYI",
    "ret": 7.4,
    "vol": 16.0,
    "corr": 0.89,
    "popular": false,
    "description": "Developed and emerging-market large, mid and small companies."
  },
  {
    "id": "vanguard-sp500",
    "name": "Vanguard S&P 500 UCITS ETF",
    "provider": "Vanguard",
    "category": "US Equity",
    "type": "US large-cap ETF",
    "identifier": "VUAG / VUSA",
    "ret": 7.3,
    "vol": 17.0,
    "corr": 0.91,
    "popular": true,
    "description": "Tracks 500 large US companies."
  },
  {
    "id": "spdr-sp500",
    "name": "State Street SPDR S&P 500 UCITS ETF",
    "provider": "State Street SPDR",
    "category": "US Equity",
    "type": "US large-cap ETF",
    "identifier": "SPXL / SPY5",
    "ret": 7.3,
    "vol": 17.0,
    "corr": 0.91,
    "popular": true,
    "description": "S&P 500 tracker in UCITS ETF form."
  },
  {
    "id": "ishares-sp500",
    "name": "iShares Core S&P 500 UCITS ETF",
    "provider": "iShares",
    "category": "US Equity",
    "type": "US large-cap ETF",
    "identifier": "CSPX / IUSA",
    "ret": 7.3,
    "vol": 17.0,
    "corr": 0.91,
    "popular": true,
    "description": "Core S&P 500 tracker."
  },
  {
    "id": "ishares-ftse100",
    "name": "iShares Core FTSE 100 UCITS ETF",
    "provider": "iShares",
    "category": "UK Equity",
    "type": "UK large-cap ETF",
    "identifier": "ISF",
    "ret": 6.8,
    "vol": 14.0,
    "corr": 0.78,
    "popular": true,
    "description": "Tracks the 100 largest UK-listed companies."
  },
  {
    "id": "vanguard-ftse250",
    "name": "Vanguard FTSE 250 UCITS ETF",
    "provider": "Vanguard",
    "category": "UK Equity",
    "type": "UK mid-cap ETF",
    "identifier": "VMIG / VMID",
    "ret": 7.2,
    "vol": 18.0,
    "corr": 0.76,
    "popular": true,
    "description": "Tracks mid-sized UK companies."
  },
  {
    "id": "vanguard-uk-all-share",
    "name": "Vanguard FTSE UK All Share Index Fund",
    "provider": "Vanguard",
    "category": "UK Equity",
    "type": "Broad UK index fund",
    "identifier": "—",
    "ret": 6.9,
    "vol": 15.5,
    "corr": 0.78,
    "popular": false,
    "description": "Broad exposure across large, mid and small UK companies."
  },
  {
    "id": "vanguard-europe-exuk",
    "name": "Vanguard FTSE Developed Europe ex UK UCITS ETF",
    "provider": "Vanguard",
    "category": "Europe",
    "type": "Developed Europe ex-UK ETF",
    "identifier": "VERX / VEUR",
    "ret": 7.0,
    "vol": 16.5,
    "corr": 0.82,
    "popular": true,
    "description": "Developed European equities excluding the UK."
  },
  {
    "id": "ishares-core-europe",
    "name": "iShares Core MSCI Europe UCITS ETF",
    "provider": "iShares",
    "category": "Europe",
    "type": "Developed Europe ETF",
    "identifier": "IMEU / SMEA",
    "ret": 7.0,
    "vol": 16.2,
    "corr": 0.83,
    "popular": false,
    "description": "Broad developed European equity exposure."
  },
  {
    "id": "ishares-japan-imi",
    "name": "iShares Core MSCI Japan IMI UCITS ETF",
    "provider": "iShares",
    "category": "Japan",
    "type": "Japan all-cap ETF",
    "identifier": "SJPA / SJPD",
    "ret": 7.0,
    "vol": 15.0,
    "corr": 0.74,
    "popular": true,
    "description": "Japanese large, mid and small-cap companies."
  },
  {
    "id": "vanguard-japan",
    "name": "Vanguard Japan Stock Index Fund",
    "provider": "Vanguard",
    "category": "Japan",
    "type": "Japan index fund",
    "identifier": "—",
    "ret": 7.0,
    "vol": 15.0,
    "corr": 0.74,
    "popular": false,
    "description": "Broad Japanese equity tracker."
  },
  {
    "id": "vanguard-em",
    "name": "Vanguard Emerging Markets Stock Index Fund",
    "provider": "Vanguard",
    "category": "Emerging Markets",
    "type": "Emerging-markets index fund",
    "identifier": "—",
    "ret": 7.6,
    "vol": 20.0,
    "corr": 0.75,
    "popular": true,
    "description": "Diversified emerging-market equity exposure."
  },
  {
    "id": "ishares-em-imi",
    "name": "iShares Core MSCI Emerging Markets IMI UCITS ETF",
    "provider": "iShares",
    "category": "Emerging Markets",
    "type": "Emerging-markets all-cap ETF",
    "identifier": "EIMI",
    "ret": 7.6,
    "vol": 20.0,
    "corr": 0.75,
    "popular": false,
    "description": "Emerging-market large, mid and small companies."
  },
  {
    "id": "lifestrategy20",
    "name": "Vanguard LifeStrategy 20% Equity Fund",
    "provider": "Vanguard",
    "category": "Multi-Asset",
    "type": "20% equity / 80% bond multi-asset",
    "identifier": "VGLS20A",
    "ret": 4.5,
    "vol": 6.5,
    "corr": 0.42,
    "popular": true,
    "description": "Low-equity diversified multi-asset fund."
  },
  {
    "id": "lifestrategy40",
    "name": "Vanguard LifeStrategy 40% Equity Fund",
    "provider": "Vanguard",
    "category": "Multi-Asset",
    "type": "40% equity / 60% bond multi-asset",
    "identifier": "—",
    "ret": 5.3,
    "vol": 8.5,
    "corr": 0.52,
    "popular": true,
    "description": "Cautious-to-balanced diversified multi-asset fund."
  },
  {
    "id": "lifestrategy60",
    "name": "Vanguard LifeStrategy 60% Equity Fund",
    "provider": "Vanguard",
    "category": "Multi-Asset",
    "type": "60% equity / 40% bond multi-asset",
    "identifier": "—",
    "ret": 6.1,
    "vol": 11.0,
    "corr": 0.63,
    "popular": true,
    "description": "Balanced diversified multi-asset fund."
  },
  {
    "id": "lifestrategy80",
    "name": "Vanguard LifeStrategy 80% Equity Fund",
    "provider": "Vanguard",
    "category": "Multi-Asset",
    "type": "80% equity / 20% bond multi-asset",
    "identifier": "—",
    "ret": 6.8,
    "vol": 13.5,
    "corr": 0.75,
    "popular": true,
    "description": "Growth-oriented diversified multi-asset fund."
  },
  {
    "id": "lifestrategy100",
    "name": "Vanguard LifeStrategy 100% Equity Fund",
    "provider": "Vanguard",
    "category": "Multi-Asset",
    "type": "100% equity fund-of-index-funds",
    "identifier": "VGL100A",
    "ret": 7.3,
    "vol": 16.0,
    "corr": 0.88,
    "popular": true,
    "description": "Globally diversified equity fund with a UK tilt."
  },
  {
    "id": "lifestrategy-global20",
    "name": "Vanguard LifeStrategy Global 20% Equity Fund",
    "provider": "Vanguard",
    "category": "Multi-Asset",
    "type": "20% equity / 80% bond global multi-asset",
    "identifier": "VL20AGA",
    "ret": 4.6,
    "vol": 6.5,
    "corr": 0.42,
    "popular": true,
    "description": "Global-market multi-asset fund with approximately 20% equities and no deliberate UK home bias."
  },
  {
    "id": "lifestrategy-global40",
    "name": "Vanguard LifeStrategy Global 40% Equity Fund",
    "provider": "Vanguard",
    "category": "Multi-Asset",
    "type": "40% equity / 60% bond global multi-asset",
    "identifier": "VL40AGA",
    "ret": 5.4,
    "vol": 8.5,
    "corr": 0.52,
    "popular": true,
    "description": "Global-market multi-asset fund with approximately 40% equities and 60% fixed income."
  },
  {
    "id": "lifestrategy-global60",
    "name": "Vanguard LifeStrategy Global 60% Equity Fund",
    "provider": "Vanguard",
    "category": "Multi-Asset",
    "type": "60% equity / 40% bond global multi-asset",
    "identifier": "VL60AGA",
    "ret": 6.2,
    "vol": 11.0,
    "corr": 0.63,
    "popular": true,
    "description": "Global-market balanced fund with approximately 60% equities and 40% fixed income."
  },
  {
    "id": "lifestrategy-global80",
    "name": "Vanguard LifeStrategy Global 80% Equity Fund",
    "provider": "Vanguard",
    "category": "Multi-Asset",
    "type": "80% equity / 20% bond global multi-asset",
    "identifier": "VL80AGA",
    "ret": 6.9,
    "vol": 13.5,
    "corr": 0.75,
    "popular": true,
    "description": "Growth-oriented global-market fund with approximately 80% equities and 20% fixed income."
  },
  {
    "id": "lifestrategy-global100",
    "name": "Vanguard LifeStrategy Global 100% Equity Fund",
    "provider": "Vanguard",
    "category": "Multi-Asset",
    "type": "100% equity global fund-of-index-funds",
    "identifier": "VL100AA",
    "ret": 7.4,
    "vol": 16.0,
    "corr": 0.88,
    "popular": true,
    "description": "Globally diversified all-equity fund aligned broadly with global market weights and without the regular LifeStrategy UK tilt."
  },
  {
    "id": "orbis-balanced",
    "name": "Orbis Global Balanced",
    "provider": "Orbis",
    "category": "Defensive / Flexible",
    "type": "Active global balanced fund",
    "identifier": "GB00BJ02KY25",
    "ret": 7.0,
    "vol": 10.5,
    "corr": 0.72,
    "popular": true,
    "description": "Value-oriented flexible multi-asset strategy."
  },
  {
    "id": "ruffer-total-return",
    "name": "Ruffer Total Return Fund",
    "provider": "Ruffer",
    "category": "Defensive / Flexible",
    "type": "Capital-preservation multi-asset",
    "identifier": "—",
    "ret": 5.2,
    "vol": 7.5,
    "corr": 0.42,
    "popular": false,
    "description": "Flexible defensive strategy focused on capital preservation."
  },
  {
    "id": "artemis-global-income",
    "name": "Artemis Global Income",
    "provider": "Artemis",
    "category": "Income",
    "type": "Active global equity income",
    "identifier": "GB00B5N99561",
    "ret": 7.5,
    "vol": 15.5,
    "corr": 0.88,
    "popular": true,
    "description": "Contrarian global dividend portfolio with a value bias."
  },
  {
    "id": "bny-global-income",
    "name": "BNY Mellon Global Income",
    "provider": "BNY",
    "category": "Income",
    "type": "Active global equity income",
    "identifier": "GB00B7S9KM94",
    "ret": 7.3,
    "vol": 14.5,
    "corr": 0.86,
    "popular": true,
    "description": "Diversified global equity-income strategy."
  },
  {
    "id": "fidelity-global-dividend",
    "name": "Fidelity Global Dividend Fund",
    "provider": "Fidelity",
    "category": "Income",
    "type": "Active global dividend equity",
    "identifier": "—",
    "ret": 7.1,
    "vol": 14.0,
    "corr": 0.84,
    "popular": false,
    "description": "Global dividend and quality-oriented equity strategy."
  },
  {
    "id": "vanguard-global-bond",
    "name": "Vanguard Global Bond Index Fund GBP Hedged",
    "provider": "Vanguard",
    "category": "Bonds and Cash",
    "type": "Global aggregate bond index",
    "identifier": "—",
    "ret": 4.2,
    "vol": 7.0,
    "corr": 0.28,
    "popular": true,
    "description": "Investment-grade global bonds hedged to sterling."
  },
  {
    "id": "ishares-uk-gilts",
    "name": "iShares Core UK Gilts UCITS ETF",
    "provider": "iShares",
    "category": "Bonds and Cash",
    "type": "UK government bond ETF",
    "identifier": "IGLT",
    "ret": 4.0,
    "vol": 8.0,
    "corr": 0.22,
    "popular": false,
    "description": "Broad UK government-bond exposure."
  },
  {
    "id": "royal-london-stmm",
    "name": "Royal London Short Term Money Market Fund",
    "provider": "Royal London",
    "category": "Bonds and Cash",
    "type": "Sterling short-term money market",
    "identifier": "—",
    "ret": 3.2,
    "vol": 1.0,
    "corr": 0.05,
    "popular": true,
    "description": "Low-volatility sterling money-market holding."
  }
];
const FUND_LIBRARY_REVIEWED='30 July 2026';
const FUND_CATEGORY_ORDER=['Popular','Global Equity','US Equity','UK Equity','Europe','Japan','Emerging Markets','Multi-Asset','Income','Defensive / Flexible','Bonds and Cash'];

function libraryFundById(id){return FUND_LIBRARY.find(f=>f.id===id)||null}
function activeLibraryIds(){return new Set(fundDefs.map(f=>f.libraryId).filter(Boolean))}
function libraryProfileForFund(fund){
  const item=libraryFundById(fund.libraryId);
  if(!item)return null;
  return {
    role:item.category,
    type:item.type,
    confidence:fund.assumptionOverride?'User Override':'Library Default',
    equity:item.category==='Bonds and Cash'?'Low or none':item.type,
    defensive:item.category==='Multi-Asset'||item.category==='Defensive / Flexible'||item.category==='Bonds and Cash'?'Built into the fund':'Minimal',
    ocf:'See current provider literature',
    range:`${(item.ret-1.2).toFixed(1)}%–${(item.ret+1.2).toFixed(1)}%`,
    reviewed:FUND_LIBRARY_REVIEWED,
    notes:`${item.description} RetireLab uses ${item.ret.toFixed(1)}% nominal return, ${item.vol.toFixed(1)}% volatility and ${item.corr.toFixed(2)} correlation proxy as editable planning defaults, not forecasts.`,
    sources:`Curated RetireLab library entry · ${item.provider} · ${item.identifier}`
  };
}
window.libraryProfileForFund=libraryProfileForFund;

function addLibraryFund(id){
  const item=libraryFundById(id); if(!item)return;
  if(fundDefs.some(f=>f.libraryId===id)){alert(`${item.name} is already in the portfolio.`);return}
  fundDefs.push({
    id:'fund-'+item.id,
    libraryId:item.id,
    name:item.name,
    value:0,
    ret:item.ret,
    vol:item.vol,
    corr:item.corr,
    defaultRet:item.ret,
    defaultVol:item.vol,
    defaultCorr:item.corr,
    category:item.category,
    type:item.type,
    provider:item.provider,
    identifier:item.identifier,
    description:item.description,
    profile:'library',
    assumptionOverride:false
  });
  renderFunds();
  renderFundLibrary();
  scheduleProjectSave?.();
}
function renderFundLibrary(){
  const tree=document.getElementById('fundLibraryTree'); if(!tree)return;
  const q=(document.getElementById('fundLibrarySearch')?.value||'').trim().toLowerCase();
  const active=activeLibraryIds();
  tree.innerHTML='';
  FUND_CATEGORY_ORDER.forEach((category,index)=>{
    let items=category==='Popular'?FUND_LIBRARY.filter(f=>f.popular):FUND_LIBRARY.filter(f=>f.category===category);
    if(q)items=items.filter(f=>[f.name,f.provider,f.category,f.type,f.identifier,f.description].join(' ').toLowerCase().includes(q));
    if(!items.length)return;
    const details=document.createElement('details');
    details.className='fund-library-category';
    details.open=q?true:index===0;
    details.innerHTML=`<summary><span>${category}</span><small>${items.length} funds</small></summary><div class="fund-library-grid"></div>`;
    const grid=details.querySelector('.fund-library-grid');
    items.forEach(item=>{
      const added=active.has(item.id);
      const card=document.createElement('article'); card.className='fund-library-card';
      card.innerHTML=`<div class="fund-library-card-top"><div><span class="fund-provider">${item.provider}</span><h4>${item.name}</h4></div><span class="fund-type-chip">${item.category}</span></div>
        <p>${item.description}</p>
        <div class="fund-library-metrics"><span><b>${item.ret.toFixed(1)}%</b> return</span><span><b>${item.vol.toFixed(1)}%</b> volatility</span><span><b>${item.corr.toFixed(2)}</b> correlation</span></div>
        <div class="fund-library-card-footer"><small>${item.identifier||'Planning profile'}</small><button type="button" class="${added?'ghost':'primary'} small add-library-fund" data-id="${item.id}" ${added?'disabled':''}>${added?'Added':'Add to portfolio'}</button></div>`;
      grid.appendChild(card);
    });
    tree.appendChild(details);
  });
  if(!tree.children.length)tree.innerHTML='<div class="annual-empty">No library funds match that search.</div>';
  tree.querySelectorAll('.add-library-fund').forEach(btn=>btn.addEventListener('click',()=>addLibraryFund(btn.dataset.id)));
}

addFundBtn.onclick=()=>{fundLibrary.classList.remove('hidden');renderFundLibrary();fundLibrary.scrollIntoView({behavior:'smooth',block:'start'})};
closeFundLibraryBtn.onclick=()=>fundLibrary.classList.add('hidden');
fundLibrarySearch.addEventListener('input',renderFundLibrary);
showCustomFundBtn.onclick=()=>{fundBuilder.classList.remove('hidden');newFundName.focus()};
cancelFundBtn.onclick=()=>fundBuilder.classList.add('hidden');
confirmFundBtn.onclick=()=>{
  const name=(newFundName.value||'').trim();
  if(!name){alert('Please enter a fund name.');newFundName.focus();return}
  const ret=Number(newFundReturn.value),vol=Number(newFundVolatility.value),value=Math.max(0,Number(newFundValue.value)||0);
  if(!Number.isFinite(ret)){alert('Please enter an expected nominal return.');return}
  if(!Number.isFinite(vol)||vol<0){alert('Please enter a volatility of 0% or above.');return}
  fundDefs.push({id:'custom-'+Date.now(),name,value,ret,vol,corr:.80,profile:'custom',assumptionOverride:true});
  newFundName.value='';newFundReturn.value='7.0';newFundVolatility.value='15.0';newFundValue.value='0';
  fundBuilder.classList.add('hidden');renderFunds();renderFundLibrary();scheduleProjectSave?.();
};

// Attach library identities to the original four holdings without changing user values.
const legacyMap={orbis:'orbis-balanced',artemis:'artemis-global-income',bny:'bny-global-income',lg:'lg-global-100'};
fundDefs.forEach(f=>{
  const id=f.libraryId||legacyMap[f.profile]; const item=libraryFundById(id);
  if(item&&!f.libraryId)Object.assign(f,{libraryId:item.id,defaultRet:item.ret,defaultVol:item.vol,defaultCorr:item.corr,category:item.category,type:item.type,provider:item.provider,identifier:item.identifier,description:item.description});
});
setTimeout(()=>{renderFundLibrary();renderAssumptionsTable()},0);
