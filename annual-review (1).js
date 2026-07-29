
document.querySelectorAll('.view-results-btn').forEach(button=>{
  button.addEventListener('click',()=>{
    if(!button.disabled)openTab('results');
  });
});

// Preserve "results ready" after loading a project that already has simulations.
function refreshRunFeedbackFromHistory(){
  const hasResults=typeof simulationHistoryRecords!=='undefined' && simulationHistoryRecords.length>0;
  if(hasResults)setRunFeedbackState('complete','Results ready');
}
setTimeout(refreshRunFeedbackFromHistory,500);
