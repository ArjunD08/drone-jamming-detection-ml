// --- START OF FILE dashboard_logic_enhanced.js ---

// --- References ---
const statusCard = document.getElementById('statusCard');
const statusValueElement = document.getElementById('currentStatusValue');
const lastDetectedElement = document.getElementById('lastDetected');
const currentChannelElement = document.getElementById('currentChannel');
const batteryValueElement = document.getElementById('batteryValue');
const gpsLocationElement = document.getElementById('gpsLocation');
const suggestedChannelElement = document.getElementById('suggestedChannelValue');
const freqSuggestionContainer = document.getElementById('freqSuggestion'); // Container for suggestion
const historyTableBody = document.getElementById('eventHistoryBody');
const actionDropdown = document.getElementById('actionDropdown');
const counteractionStatusElement = document.getElementById('counteractionStatus');
const downloadLogsBtn = document.getElementById('downloadLogsBtn');
const overrideBtn = document.getElementById('overrideBtn');
const signalGraphPlaceholder = document.getElementById('signalGraph'); // Placeholder ref
const flightMapPlaceholder = document.getElementById('flightMap'); // Placeholder ref

const originalTitle = document.title;
let lastJamTimestamp = null;
let titleFlashInterval = null;
let isOverridden = false; // Track override state
let historyData = []; // Store history events for potential export

// --- Title Flashing ---
function startTitleFlash(message) {
    stopTitleFlash(); // Clear any existing interval
    let isOriginal = true;
    titleFlashInterval = setInterval(() => {
        document.title = isOriginal ? message : originalTitle;
        isOriginal = !isOriginal;
    }, 800); // Flash every 800ms
}
function stopTitleFlash() {
    if (titleFlashInterval) {
        clearInterval(titleFlashInterval);
        titleFlashInterval = null;
        document.title = originalTitle; // Restore original title
    }
}

// --- Update Battery Display ---
function updateBatteryDisplay(level) {
    if (level === null || level === undefined || level < 0) {
        batteryValueElement.innerHTML = `--- % <i class="fas fa-question-circle"></i>`;
        batteryValueElement.className = 'value'; // Reset class
        return;
    }

    let iconClass = 'fas fa-battery-';
    let battClass = 'value '; // Base class plus space
    if (level <= 15) { iconClass += 'empty batt-low'; battClass += 'batt-low'; }
    else if (level <= 35) { iconClass += 'quarter batt-medium'; battClass += 'batt-medium'; }
    else if (level <= 65) { iconClass += 'half batt-medium'; battClass += 'batt-medium'; }
    else if (level <= 85) { iconClass += 'three-quarters batt-high'; battClass += 'batt-high'; }
    else { iconClass += 'full batt-high'; battClass += 'batt-high'; }

    batteryValueElement.innerHTML = `${level}% <i class="${iconClass}"></i>`;
    batteryValueElement.className = battClass;
}

// --- Update Status Display ---
function updateStatusDisplay(status, data = {}) {
    const {
        timestamp = null,
        currentChannel = "---",
        batteryLevel = null, // Expect battery level
        gpsCoords = null, // Expect { lat: number, lon: number } or null
        suggestedChannel = null // Expect suggested channel or null
    } = data;

    let statusText = '';
    let statusIcon = '';
    let cardClass = 'status-item'; // Base class

    const now = new Date();
    const displayTimestamp = timestamp || now.toISOString().slice(0, 19).replace('T', ' ');

    statusCard.classList.remove('status-normal', 'status-jammed', 'status-loading');

    switch (status) {
        case 'NORMAL':
            cardClass += ' status-normal';
            statusIcon = '<i class="fas fa-check-circle"></i>';
            statusText = 'Operational';
            stopTitleFlash();
            freqSuggestionContainer.style.display = 'none'; // Hide suggestion
            if (!isOverridden) hideCounteractionStatus(); // Hide status if not overridden
            break;
        case 'JAMMED':
            cardClass += ' status-jammed';
            statusIcon = '<i class="fas fa-exclamation-triangle"></i>';
            statusText = 'JAMMING DETECTED';
            lastJamTimestamp = displayTimestamp;
            startTitleFlash('🔴 JAMMING DETECTED!');
            if (suggestedChannel) {
                 suggestedChannelElement.textContent = `Try CH ${suggestedChannel}`;
                 freqSuggestionContainer.style.display = 'block'; // Show suggestion
            } else {
                 freqSuggestionContainer.style.display = 'none'; // Hide if no suggestion
            }
            break;
        case 'LOADING...':
        default:
            cardClass += ' status-loading';
            statusIcon = '<i class="fas fa-spinner fa-spin"></i>';
            statusText = 'Initializing...';
            stopTitleFlash();
            hideCounteractionStatus();
            freqSuggestionContainer.style.display = 'none';
            currentChannelElement.textContent = "---";
            gpsLocationElement.textContent = "--- , ---";
            break;
    }

    statusValueElement.innerHTML = `${statusIcon} ${statusText}`;
    statusCard.className = cardClass; // Apply updated classes to the card

    lastDetectedElement.textContent = displayTimestamp;
    currentChannelElement.textContent = currentChannel === "---" ? "---" : `CH ${currentChannel}`;
    gpsLocationElement.textContent = gpsCoords ? `${gpsCoords.lat.toFixed(6)}, ${gpsCoords.lon.toFixed(6)}` : "Unavailable";
    gpsLocationElement.title = gpsCoords ? `Lat: ${gpsCoords.lat}, Lon: ${gpsCoords.lon}` : ''; // Add tooltip for full coords
    updateBatteryDisplay(batteryLevel);

    // Update suggested action only if not manually overridden
    if (!isOverridden) {
        updateSuggestedActionDropdown(status);
    }
}


// --- Add History Event ---
const MAX_HISTORY_ITEMS = 25; // More history

function addHistoryEvent(eventData) {
    const { timestamp, status, channel, location = null } = eventData;

    // Add to internal array first (for potential export)
    historyData.unshift(eventData); // Add to beginning
    if (historyData.length > MAX_HISTORY_ITEMS * 2) { // Keep more in memory than displayed
         historyData.pop();
    }

    // Add to HTML table
    const historyRow = historyTableBody.insertRow(0);

    const cellTime = historyRow.insertCell(0);
    const cellStatus = historyRow.insertCell(1);
    const cellChannel = historyRow.insertCell(2);
    const cellLocation = historyRow.insertCell(3); // New cell

    cellTime.setAttribute('data-label', 'Timestamp');
    cellStatus.setAttribute('data-label', 'Status');
    cellChannel.setAttribute('data-label', 'Channel');
    cellLocation.setAttribute('data-label', 'Location'); // Data label for location

    cellTime.textContent = timestamp;
    cellStatus.textContent = status;
    cellChannel.textContent = channel ? `CH ${channel}` : '---';

    if (location && location.lat !== undefined && location.lon !== undefined) {
         cellLocation.textContent = `${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`;
         cellLocation.title = `Lat: ${location.lat}, Lon: ${location.lon}`;
    } else {
         cellLocation.textContent = 'N/A';
    }
    cellLocation.classList.add('location-cell');


    cellStatus.style.fontWeight = '500';
    if (status === 'JAMMED') cellStatus.style.color = 'var(--color-status-jammed)';
    else if (status === 'NORMAL') cellStatus.style.color = 'var(--color-status-normal)';
    else cellStatus.style.color = 'var(--color-accent-secondary)';

    while (historyTableBody.rows.length > MAX_HISTORY_ITEMS) {
        historyTableBody.deleteRow(historyTableBody.rows.length - 1);
    }
}

// --- Update Suggested Action Dropdown ---
function updateSuggestedActionDropdown(status) {
    actionDropdown.classList.remove('highlight-jammed');
    actionDropdown.disabled = false;

    if (isOverridden) { // If overridden, disable dropdown
         actionDropdown.disabled = true;
         return;
    }

    if (status === 'JAMMED') {
        actionDropdown.value = 'abort';
        actionDropdown.classList.add('highlight-jammed');
    } else if (status === 'NORMAL') {
        actionDropdown.value = 'monitor';
    } else { // Loading
        actionDropdown.value = 'monitor';
        actionDropdown.disabled = true;
    }
}

// --- Counteraction Status Display ---
function showCounteractionStatus(message, type = 'pending') { // types: 'pending', 'success', 'error'
    counteractionStatusElement.textContent = message;
    counteractionStatusElement.className = `action-status status-${type}`; // Set class based on type
    counteractionStatusElement.style.display = 'block'; // Make it visible
}

function hideCounteractionStatus() {
    if (!isOverridden || counteractionStatusElement.classList.contains('status-pending')) { // Only hide if not overridden OR if showing pending status (override message takes precedence)
        counteractionStatusElement.textContent = 'No action triggered.'; // Reset text
        counteractionStatusElement.className = 'action-status'; // Reset class
        counteractionStatusElement.style.display = 'none'; // Make it hidden
    }
}


// --- Dropdown Event Listener ---
actionDropdown.addEventListener('change', (event) => {
    if (isOverridden) return;

    const selectedValue = event.target.value;
    const selectedText = event.target.options[event.target.selectedIndex].text;
    console.log(`User selected action: Value='${selectedValue}', Text='${selectedText}'`);

    if (selectedValue !== 'monitor') {
        showCounteractionStatus(`Executing: ${selectedText}...`, 'pending');
        console.log(`TODO: Send command '${selectedValue}' to backend.`);
        // Simulate backend response
        setTimeout(() => {
            if (isOverridden) return; // Don't show result if override happened during wait
            const success = Math.random() > 0.2;
            if (success) {
                showCounteractionStatus(`Action Executed: ${selectedText}`, 'success');
            } else {
                showCounteractionStatus(`Execution Failed: ${selectedText}`, 'error');
            }
            // Optionally hide success/error message after a few seconds
            // setTimeout(hideCounteractionStatus, 5000);
        }, 1500 + Math.random() * 1500);
    } else {
        hideCounteractionStatus();
    }
});

// --- Button Listeners ---
downloadLogsBtn.addEventListener('click', () => {
    console.log('Download Logs Triggered');
    if (historyData.length === 0) {
        alert('No history data to download.');
        return;
    }

    // Basic CSV export example
    const headers = ['Timestamp', 'Status', 'Channel', 'Latitude', 'Longitude'];
    const csvContent = [
        headers.join(','), // Header row
        ...historyData.map(row => [
            `"${row.timestamp}"`, // Quote timestamp in case of commas
            row.status,
            row.channel || '', // Handle null channel
            row.location?.lat || '', // Handle null location
            row.location?.lon || ''
        ].join(',')) // Join values with commas
    ].join('\n'); // Join rows with newlines

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) { // Feature detection
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `drone_jamming_log_${new Date().toISOString().slice(0,10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
         alert('CSV download not supported by your browser.');
    }
});

overrideBtn.addEventListener('click', () => {
    if (!isOverridden) {
        isOverridden = true;
        overrideBtn.innerHTML = '<i class="fas fa-sync fa-spin"></i> Overriding...'; // Show processing state
        overrideBtn.classList.add('overridden');
        overrideBtn.disabled = true;
        actionDropdown.disabled = true;
        showCounteractionStatus('MANUAL OVERRIDE ENGAGED', 'error'); // Show override status distinctively
        console.log('Manual Override Activated!');
        // TODO: Send override command to backend - wait for confirmation?
        // Simulate confirmation delay
        setTimeout(() => {
             overrideBtn.innerHTML = '<i class="fas fa-times-circle"></i> Cancel Override'; // Now show cancel option
             overrideBtn.disabled = false;
             overrideBtn.classList.remove('overridden');
             overrideBtn.style.backgroundColor = 'var(--color-accent-secondary)'; // Change color to indicate cancel state
             overrideBtn.style.color = 'var(--color-bg-darkest)';
        }, 1000);
    } else {
        // Logic to Cancel Override
        isOverridden = false;
        overrideBtn.innerHTML = '<i class="fas fa-ban"></i> Manual Override'; // Reset button
        overrideBtn.disabled = false;
        overrideBtn.style.backgroundColor = ''; // Reset color
        overrideBtn.style.color = '';
        actionDropdown.disabled = false;
        hideCounteractionStatus();
        // Re-evaluate dropdown based on current actual status (query statusCard class)
        updateSuggestedActionDropdown(statusCard.classList.contains('status-jammed') ? 'JAMMED' : 'NORMAL');
        console.log('Manual Override Cancelled!');
        // TODO: Send cancel override command to backend
    }
});


// --- Placeholder for Graph/Map Init ---
function initializeVisualizations() {
    console.log("Initialize Signal Graph (Static Placeholder)");
    // No JS needed for static version, CSS handles it.
    // Actual implementation requires Chart.js or similar.

    console.log("Initialize Flight Map (Placeholder)");
    flightMapPlaceholder.innerHTML = '<div><i class="fas fa-map-marked-alt"></i> Flight Map (Requires Mapping Library)</div>';
    // Actual implementation requires Leaflet, Mapbox, Google Maps etc.
}


// --- ============================================================ ---
// --- SIMULATION - REPLACE WITH YOUR BACKEND INTEGRATION ---
// --- ============================================================ ---
function getCurrentTimestamp() { return new Date().toISOString().slice(0, 19).replace('T', ' '); }
let currentLat = 34.0522;
let currentLon = -118.2437;
let currentBatt = 95;
let simulationInterval = null; // Store interval ID

// Initial state
initializeVisualizations();
updateStatusDisplay("LOADING...");
addHistoryEvent({ timestamp: getCurrentTimestamp(), status: "SYSTEM INIT", channel: null, location: null });

// Simulate updates
function simulateUpdate() {
    // Don't simulate if overridden
    if (isOverridden) return;

    const isJamming = Math.random() < 0.25;
    const status = isJamming ? "JAMMED" : "NORMAL";
    currentBatt -= Math.random() * 0.5;
    if (currentBatt < 1) currentBatt = 0; // Stop at 0

    currentLat += (Math.random() - 0.5) * 0.0005;
    currentLon += (Math.random() - 0.5) * 0.0005;
    const gps = { lat: currentLat, lon: currentLon };
    const channel = 70 + Math.floor(Math.random() * 20);
    const suggested = isJamming ? (channel + 5 > 90 ? channel - 5 : channel + 5) : null; // Basic suggestion logic
    const ts = getCurrentTimestamp();

    const eventData = {
        timestamp: ts,
        status: status,
        channel: channel,
        location: gps
    };

    const displayData = {
        timestamp: ts,
        currentChannel: channel,
        batteryLevel: Math.round(currentBatt),
        gpsCoords: gps,
        suggestedChannel: suggested
    };

    updateStatusDisplay(status, displayData);
    addHistoryEvent(eventData);

    // TODO: Update signal graph data here
    // TODO: Update flight map marker here
}

// Start simulation loop after initial load display
setTimeout(() => {
    if (simulationInterval) clearInterval(simulationInterval); // Clear previous interval if any

    currentBatt = 88 + Math.random() * 10; // Start with good battery
    currentLat = 34.0530 + (Math.random() - 0.5) * 0.001;
    currentLon = -118.2450 + (Math.random() - 0.5) * 0.001;
    const firstChannel = 80 + Math.floor(Math.random()*5);
    const firstGps = {lat: currentLat, lon: currentLon};
    const firstData = { timestamp: getCurrentTimestamp(), currentChannel: firstChannel, batteryLevel: Math.round(currentBatt), gpsCoords: firstGps };

    updateStatusDisplay("NORMAL", firstData);
    addHistoryEvent({ timestamp: firstData.timestamp, status: "NORMAL", channel: firstChannel, location: firstGps });

    simulationInterval = setInterval(simulateUpdate, 4000); // Update every 4 seconds

}, 2500); // Delay after "Loading..."

// --- End of Simulation ---
// --- END OF FILE dashboard_logic_enhanced.js ---