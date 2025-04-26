console.log("Background script is running!");

chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed or updated.");
});

chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.sendMessage(tab.id, { action: "toggleToolbar" });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "logMessage") {
        console.log(message.msg);
    }
    if (message.action === "capture") {
        chrome.tabs.captureVisibleTab(null, { format: "png" }, function (dataUrl) {
            sendResponse(dataUrl);
        });
        return true; // Needed for async response
    }
});
