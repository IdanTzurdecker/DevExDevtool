document.getElementById('extractButton').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

    chrome.scripting.executeScript({
        target: {tabId: tab.id},
        function: extractAccessToken,
    }, (results) => {
        const messageElement = document.getElementById('message');
        if (results && results[0]) {
            const token = results[0].result;
            if (token) {
                navigator.clipboard.writeText(token).then(() => {
                    messageElement.textContent = 'Access Token copied to clipboard!';
                }).catch(err => {
                    messageElement.textContent = 'Failed to copy: ' + err;
                });
            } else {
                messageElement.textContent = 'No token found or an error occurred.';
            }
        }
    });
});

function extractAccessToken() {
    try {
        const token = JSON.parse(localStorage.getItem("okta-token-storage")).accessToken.accessToken;
        return token;
    } catch (error) {
        console.error('Error extracting access token:', error);
        return null;
    }
}

document.getElementById('trueList').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

    chrome.scripting.executeScript({
        target: {tabId: tab.id},
        function: getLaunchDarklyFlags,
    }, (results) => {
        if (results && results[0] && results[0].result) {
            const { trueList, falseList } = results[0].result;
            populateDropdown(trueList, 'trueList');
            populateDropdown(falseList, 'falseList');
        } else {
            console.log("No data returned or an error occurred.");
        }
    });
});

function getLaunchDarklyFlags() {
    const targetUrl = "https://app.launchdarkly.com/sdk/";
    const sdkRequests = performance.getEntriesByType('resource').filter(
        entry => entry.name.startsWith(targetUrl)
    );
    if (sdkRequests.length === 0) {
        console.log("No Launch Darkly SDK requests found.");
        return null;
    }
    const latestRequest = sdkRequests[sdkRequests.length - 1];
    return fetch(latestRequest.name)
        .then(response => response.json())
        .then(data => {
            const trueList = [];
            const falseList = [];
            for (const key in data) {
                if (data[key].value) {
                    trueList.push(key);
                } else {
                    falseList.push(key);
                }
            }
            return { trueList, falseList };
        })
        .catch(error => {
            console.error("Error fetching Launch Darkly flags JSON:", error);
            return null;
        });
}

function populateDropdown(items, dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    dropdown.innerHTML = '';
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = item;
        dropdown.appendChild(option);
    });
}