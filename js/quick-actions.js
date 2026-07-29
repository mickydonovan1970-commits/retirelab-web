
document.querySelectorAll('.quick-run-model').forEach(button=>{
  button.addEventListener('click',()=>{
    const mainRun=document.getElementById('runBtn');
    if(mainRun) mainRun.click();
  });
});
document.querySelectorAll('.quick-optimise-model').forEach(button=>{
  button.addEventListener('click',()=>{
    openTab('optimiser');
    const optimiser=document.getElementById('rebalanceBtn');
    if(optimiser) optimiser.click();
  });
});
