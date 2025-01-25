document.addEventListener('DOMContentLoaded', () => {
  loadConfigs();
  document.getElementById('loadGithub').addEventListener('click', loadFromGithub);
  document.getElementById('localFile').addEventListener('change', handleFileUpload);
});

function loadConfigs() {
  chrome.storage.local.get('configs', (data) => {
      const container = document.getElementById('configList');
      container.innerHTML = '';

      if (!data.configs || data.configs.length === 0) {
          container.innerHTML = '<p>No configurations loaded</p>';
          return;
      }

      data.configs.forEach(config => {
          const item = document.createElement('div');
          item.className = 'config-item';
          
          item.innerHTML = `
              <span>${config.site}</span>
              <span class="delete-btn" data-site="${config.site}">🗑️ Delete</span>
          `;

          item.querySelector('.delete-btn').addEventListener('click', deleteConfig);
          container.appendChild(item);
      });
  });
}

function deleteConfig(event) {
  const siteToDelete = event.target.dataset.site;
  
  chrome.storage.local.get('configs', (data) => {
      const updatedConfigs = data.configs.filter(c => c.site !== siteToDelete);
      chrome.storage.local.set({ configs: updatedConfigs }, () => {
          loadConfigs(); 
      });
  });
}

function loadFromGithub() {
  const url = document.getElementById('githubUrl').value.trim();
  if (!url) return;

  fetch(url)
      .then(response => {
          if (!response.ok) throw new Error('Error loading');
          return response.json();
      })
      .then(config => {
          validateConfig(config);
          saveConfig(config);
          alert('Configuration loaded!');
      })
      .catch(error => alert(`Error: ${error.message}`));
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
      try {
          const config = JSON.parse(e.target.result);
          validateConfig(config);
          saveConfig(config);
          alert('Configuration loaded!');
      } catch (error) {
          alert(`JSON parsing error: ${error.message}`);
      }
  };
  reader.readAsText(file);
}

function validateConfig(config) {
  if (!config.site || !config.pages) {
      throw new Error('Invalid configuration format');
  }
}

function saveConfig(newConfig) {
  chrome.storage.local.get('configs', (data) => {
      let configs = data.configs || [];
      configs = configs.filter(c => c.site !== newConfig.site);
      configs.push(newConfig);
      chrome.storage.local.set({ configs }, () => {
          loadConfigs();
      });
  });
}
