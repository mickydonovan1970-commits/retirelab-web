
let expandedChartSource=null;
function openExpandedChart(source,title='Simulation chart'){
  expandedChartSource=source;
  chartModalTitle.textContent=title;
  chartModal.classList.remove('hidden');
  chartModal.setAttribute('aria-hidden','false');
  const canvas=document.getElementById('expandedChart');
  if(source.chartPoints){
    // Build full snapshots approximation only for display; use history renderer directly.
    canvas._retireLabRecord=source;
    renderHistoryCanvas(canvas,source,null);
    if(!canvas.dataset.interactive){
      let pinnedMonth=null;
      const getMonth=e=>{
        const rect=canvas.getBoundingClientRect(),clientX=e.touches?.[0]?.clientX??e.clientX;
        const xpx=(clientX-rect.left)*(canvas.width/rect.width);
        const maxM=source.chartPoints?.at(-1)?.m||1;
        return (xpx-96)/(canvas.width-96-130)*maxM;
      };
      canvas.onmousemove=e=>{if(pinnedMonth===null)renderHistoryCanvas(canvas,expandedChartSource,getMonth(e))};
      canvas.onmouseleave=()=>{if(pinnedMonth===null)renderHistoryCanvas(canvas,expandedChartSource,null)};
      canvas.onclick=e=>{pinnedMonth=Math.round(getMonth(e)/12)*12;renderHistoryCanvas(canvas,expandedChartSource,pinnedMonth)};
      canvas.dataset.interactive='1';
    }
  }else{
    canvas._retireLabResult=source;
    renderSimulationCanvas(canvas,source,null);
    if(!canvas.dataset.interactive)attachInteractiveChart(canvas,()=>canvas._retireLabResult);
  }
}
expandMainChart.addEventListener('click',()=>{
  if(chart._retireLabResult)openExpandedChart(chart._retireLabResult,'Current simulation');
});
closeChartModal.addEventListener('click',()=>{
  chartModal.classList.add('hidden');
  chartModal.setAttribute('aria-hidden','true');
});
chartModal.addEventListener('click',e=>{
  if(e.target===chartModal)closeChartModal.click();
});
