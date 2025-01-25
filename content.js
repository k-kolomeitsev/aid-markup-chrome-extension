let currentHighlights = new Map();

function showAttributes(element) {
  const existingTooltip = document.querySelector(`[data-aid-tooltip="${element.id}"]`);
  if (existingTooltip) {
      existingTooltip.remove();
  }

  const attrs = Array.from(element.attributes)
      .filter(attr => attr.name.startsWith('aid-'))
      .map(attr => `${attr.name}: "${attr.value}"`)
      .join('\n');

  if (!attrs) return;

  const tooltip = document.createElement('div');
  tooltip.className = 'aid-tooltip';
  tooltip.textContent = attrs;
  tooltip.dataset.aidTooltip = element.id || Date.now();

  const rect = element.getBoundingClientRect();
  tooltip.style.position = 'absolute';
  tooltip.style.top = `${rect.top + window.scrollY}px`;
  tooltip.style.left = `${rect.left + window.scrollX}px`;
  tooltip.style.transform = 'translateY(-100%)';
  
  document.body.appendChild(tooltip);
}

function applyMarkup() {
  chrome.storage.local.get('configs', (data) => {
      removeMarkup();

      data.configs?.forEach(config => {
          if (!isDomainMatch(location.hostname, config.site)) return;
          
          config.pages.forEach(page => {
              if (page.page !== location.pathname) return;
              
              Object.keys(page.selectors).forEach(selector => {
                  document.querySelectorAll(selector).forEach(element => {
                      currentHighlights.set(element, {
                          outline: element.style.outline,
                      });
                      element.style.outline = '3px solid red';
                      showAttributes(element);
                  });
              });
          });
      });
  });
}

function removeMarkup() {
  document.querySelectorAll('.aid-tooltip').forEach(tooltip => tooltip.remove());

  currentHighlights.forEach((originalStyles, element) => {
      if (element.style) {
          element.style.outline = originalStyles.outline;
          element.style.position = originalStyles.position;
      }
  });

  currentHighlights.clear();
}

chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'showMarkup') applyMarkup();
    if (message.action === 'hideMarkup') removeMarkup();
});

chrome.storage.local.get('markupEnabled', (data) => {
    if (data.markupEnabled) applyMarkup();
});

const observer = new MutationObserver((mutations) => {
  if (!document.body) return;
  
  mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
          chrome.storage.local.get('markupEnabled', (data) => {
              if (data.markupEnabled) {
                  setTimeout(applyMarkup, 100);
              }
          });
      }
  });
});

function applyAttributes(selectors) {
  Object.entries(selectors).forEach(([selector, attrStr]) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) return;

      const regex = /(\S+?)="(.*?)"/g;
      const attributes = {};
      let match;
      while ((match = regex.exec(attrStr)) !== null) {
          attributes[match[1]] = match[2];
      }

      elements.forEach(element => {
          Object.entries(attributes).forEach(([key, value]) => {
              element.setAttribute(key, value);
          });
      });
  });
}

function isDomainMatch(currentHost, configSite) {
  return currentHost === configSite || currentHost.endsWith('.' + configSite);
}

function processPage() {
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;

  chrome.storage.local.get('configs', (data) => {
      if (!data.configs) return;

      data.configs.forEach(config => {
          if (isDomainMatch(hostname, config.site)) {
              config.pages.forEach(page => {
                  if (page.page === pathname) {
                      applyAttributes(page.selectors);
                  }
              });
          }
      });
  });
}

processPage();