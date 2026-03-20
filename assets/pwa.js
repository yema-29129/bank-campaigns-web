let deferredInstallPrompt = null;

function setInstallButtonVisible(visible) {
  document.querySelectorAll('[data-install-app]').forEach((button) => {
    button.classList.toggle('hidden', !visible);
  });
}

async function handleInstallClick() {
  if (!deferredInstallPrompt) return;

  deferredInstallPrompt.prompt();
  const choice = await deferredInstallPrompt.userChoice;
  if (choice && choice.outcome === 'accepted') {
    setInstallButtonVisible(false);
  }
  deferredInstallPrompt = null;
}

function bindInstallButtons() {
  document.querySelectorAll('[data-install-app]').forEach((button) => {
    button.addEventListener('click', handleInstallClick);
  });
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch((error) => {
      console.error('Service Worker 注册失败', error);
    });
  });
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  setInstallButtonVisible(true);
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  setInstallButtonVisible(false);
});

bindInstallButtons();
registerServiceWorker();
