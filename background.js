chrome.runtime.onInstalled.addListener(() => {
  // Создаем контекстное меню для иконки
  chrome.contextMenus.create({
      id: "toggleMarkup",
      title: "Show markup",
      contexts: ["action"]
  });
  
  chrome.contextMenus.create({
      id: "hideMarkup",
      title: "Hide markup",
      contexts: ["action"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab) return;

  if (info.menuItemId === "toggleMarkup") {
      chrome.storage.local.set({ markupEnabled: true });
      chrome.tabs.sendMessage(tab.id, { action: "showMarkup" });
  } 
  else if (info.menuItemId === "hideMarkup") {
      chrome.storage.local.set({ markupEnabled: false });
      chrome.tabs.sendMessage(tab.id, { action: "hideMarkup" });
  }
});