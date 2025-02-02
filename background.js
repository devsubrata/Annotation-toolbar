console.log("Background script is running!");

chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed or updated.");
});

chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.sendMessage(tab.id, { action: "toggleToolbar" });
});
