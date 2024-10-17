const App = {modules: {}}
document.addEventListener('DOMContentLoaded', () => {
  for (const module in App.modules) {
    if ('start' in App.modules[module]) {
      App.modules[module].start()
    }
  }
})
