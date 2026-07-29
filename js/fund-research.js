
const researchedFundProfiles=[
 {
  role:'Core stabiliser',
  type:'Global value-oriented multi-asset (equity-heavy)',
  confidence:'Medium',
  equity:'Approximately 75–80%',
  defensive:'Approximately 20–25%',
  ocf:'Performance-fee structure; no conventional fixed OCF shown in the Morningstar report',
  range:'6.0%–8.0%',
  reviewed:'28 July 2026',
  notes:'The fund is benchmarked against 60% global equities and 40% global government bonds, but its published May 2026 allocation was materially more equity-heavy: about 75.6% equities, 18.7% bonds and 2.9% cash. RetireLab therefore models it closer to an equity-heavy 80/20 value-oriented multi-asset fund than a classic 60/40 portfolio. The 7.0% nominal return is a planning assumption, not a forecast.',
  sources:'Orbis fund page and benchmark description; Morningstar report dated 27 July 2026; published 3-year standard deviation 8.24%.'
 },
 {
  role:'Income and dividend growth',
  type:'Active global equity income / value',
  confidence:'Medium',
  equity:'Predominantly equities',
  defensive:'Minimal',
  ocf:'0.825%',
  range:'6.3%–8.7%',
  reviewed:'28 July 2026',
  notes:'Artemis describes the fund as a contrarian global dividend portfolio with a strong value bias. Its May 2026 portfolio had 90 holdings and unusually high exposure to emerging markets, financials, industrials, materials and energy. RetireLab uses a full-equity volatility assumption with a modest value/income tilt rather than treating it as a lower-risk income fund.',
  sources:'Artemis Global Income official fund page and share-class data, May–June 2026.'
 },
 {
  role:'Diversified income',
  type:'Active global equity income / large value',
  confidence:'Medium',
  equity:'At least 75%; practically equity-dominant',
  defensive:'Small cash/other allocation',
  ocf:'0.81%',
  range:'6.1%–8.5%',
  reviewed:'28 July 2026',
  notes:'The fund aims for income plus long-term capital growth and must invest at least 75% in global equities. Current portfolio data classify it as large value, with roughly 60 equity holdings and a dividend-yield factor around 3.2%. RetireLab models it as slightly less volatile than a concentrated global large-cap index, but still as an equity fund.',
  sources:'BNY Mellon Global Income W Acc objective and Fidelity/Morningstar portfolio and charge data, May–July 2026.'
 },
 {
  role:'Growth engine',
  type:'S&P Global 100 net total-return index tracker',
  confidence:'Medium–High',
  equity:'Approximately 100%',
  defensive:'None',
  ocf:'0.15%',
  range:'6.2%–8.8%',
  reviewed:'28 July 2026',
  notes:'The fund replicates the S&P Global 100 Index and is therefore concentrated in very large multinational companies. It has high equity sensitivity and no meaningful defensive allocation. The 7.5% nominal planning return is intentionally below its strongest historical periods because current capital-market forecasts are more restrained, particularly for expensive US large-cap shares.',
  sources:'L&G/Fidelity investment objective, charges and portfolio data; Vanguard 2026 capital-market outlook.'
 }
];

function profileForFund(i){
 const key=fundDefs[i]?.profile;
 const map={orbis:researchedFundProfiles[0],artemis:researchedFundProfiles[1],bny:researchedFundProfiles[2],lg:researchedFundProfiles[3]};
 return map[key]||{
   role:'User-added holding',
   type:'Custom fund assumption',
   confidence:'User Defined',
   equity:'Not specified',
   defensive:'Not specified',
   ocf:'Not specified',
   range:'Not specified',
   reviewed:'User entry',
   notes:'This fund was added manually. RetireLab uses the return, volatility and correlation proxy entered on the Portfolio tab.',
   sources:'User-supplied assumptions.'
 };
}
function openFundDrawerV21(i){
 const p=profileForFund(i);
 document.getElementById('drawerFundName').textContent=fundDefs[i].name;
 document.getElementById('drawerRole').textContent=p.role||'';
 document.getElementById('drawerType').textContent=p.type||'—';
 document.getElementById('drawerReturn').textContent=(+fundDefs[i].ret).toFixed(1)+'%';
 document.getElementById('drawerVol').textContent=(+fundDefs[i].vol).toFixed(1)+'%';
 document.getElementById('drawerConfidence').textContent=p.confidence||'—';
 document.getElementById('drawerRange').textContent=p.range||'—';
 document.getElementById('drawerEquity').textContent=p.equity||'—';
 document.getElementById('drawerDefensive').textContent=p.defensive||'—';
 document.getElementById('drawerOcf').textContent=p.ocf||'—';
 document.getElementById('drawerReviewed').textContent=p.reviewed||'—';
 document.getElementById('drawerNotes').textContent=p.notes||'';
 document.getElementById('drawerSources').textContent=p.sources||'';
 document.getElementById('fundBackdrop').classList.add('open');
 document.getElementById('fundDrawer').classList.add('open');
}
function closeFundDrawerV21(){
 document.getElementById('fundBackdrop').classList.remove('open');
 document.getElementById('fundDrawer').classList.remove('open');
}
document.getElementById('closeFundDrawer').addEventListener('click',closeFundDrawerV21);
document.getElementById('fundBackdrop').addEventListener('click',closeFundDrawerV21);

function wireFundLinksV21(){
 document.querySelectorAll('.fund-details-btn').forEach(b=>{
   b.onclick=()=>openFundDrawerV21(+b.dataset.i);
 });
}
function updatePortfolioStatsV21(){
 const total=totalCore();
 const weights=total>0?fundDefs.map(f=>f.value/total):fundDefs.map(()=>0);
 const er=weights.reduce((s,w,i)=>s+w*(fundDefs[i].ret/100),0);
 const vols=fundDefs.map(f=>f.vol/100);
 let variance=0;
 for(let i=0;i<fundDefs.length;i++)for(let j=0;j<fundDefs.length;j++)variance+=weights[i]*weights[j]*vols[i]*vols[j]*buildCorrelationMatrix()[i][j];
 const vol=Math.sqrt(Math.max(0,variance));
 const infl=(+document.getElementById('inflMean').value||0)/100;
 document.getElementById('portReturn').textContent=(er*100).toFixed(2)+'%';
 document.getElementById('portRealReturn').textContent=(((1+er)/(1+infl)-1)*100).toFixed(2)+'%';
 document.getElementById('portVol').textContent=(vol*100).toFixed(2)+'%';
 document.getElementById('portAlloc').textContent=allocationSum().toFixed(2)+'%';
}
setTimeout(()=>{
 wireFundLinksV21();
 updatePortfolioStatsV21();
 document.querySelectorAll('#fundTable input').forEach(el=>el.addEventListener('input',updatePortfolioStatsV21));
 document.getElementById('inflMean').addEventListener('input',updatePortfolioStatsV21);
},0);
