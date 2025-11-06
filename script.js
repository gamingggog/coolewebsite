// Get browser and OS information
function getBrowserInfo() {
    const userAgent = navigator.userAgent;
    let browserName = 'Unknown';
    let platform = 'Unknown';

    // Detect Browser
    if (userAgent.indexOf('Firefox') > -1) {
        browserName = 'Firefox';
    } else if (userAgent.indexOf('SamsungBrowser') > -1) {
        browserName = 'Samsung Browser';
    } else if (userAgent.indexOf('Opera') > -1 || userAgent.indexOf('OPR') > -1) {
        browserName = 'Opera';
    } else if (userAgent.indexOf('Trident') > -1) {
        browserName = 'Internet Explorer';
    } else if (userAgent.indexOf('Edge') > -1) {
        browserName = 'Edge';
    } else if (userAgent.indexOf('Chrome') > -1) {
        browserName = 'Chrome';
    } else if (userAgent.indexOf('Safari') > -1) {
        browserName = 'Safari';
    }

    // Detect Platform
    if (userAgent.indexOf('Windows') > -1) {
        platform = 'Windows';
    } else if (userAgent.indexOf('Mac') > -1) {
        platform = 'Mac';
    } else if (userAgent.indexOf('Linux') > -1) {
        platform = 'Linux';
    } else if (userAgent.indexOf('Android') > -1) {
        platform = 'Android';
    } else if (userAgent.indexOf('iOS') > -1 || userAgent.indexOf('iPhone') > -1 || userAgent.indexOf('iPad') > -1) {
        platform = 'iOS';
    }

    return {
        browser: browserName,
        platform: platform,
        userAgent: userAgent
    };
}

// Format the current time
function formatTime(date) {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
}

// Get visitor's IP address using a free API
async function getIPAddress() {
    try {
        // First try ipapi.co
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
            const data = await response.json();
            return data.ip || 'Unknown';
        }
        
        // Fallback to ipify if the first one fails
        const fallbackResponse = await fetch('https://api.ipify.org?format=json');
        if (fallbackResponse.ok) {
            const data = await fallbackResponse.json();
            return data.ip || 'Unknown';
        }
        
        return 'Unknown';
    } catch (error) {
        console.error('Error fetching IP:', error);
        return 'Error';
    }
}

// Generate a unique ID for each visitor
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Save visitor data to localStorage
function saveVisitorData(ip, browser, platform) {
    const now = new Date();
    const visit = {
        id: generateId(),
        time: now.toISOString(),
        ip: ip,
        browser: browser,
        platform: platform,
        timestamp: now.getTime()
    };

    // Get existing visits or initialize empty array
    let visits = getAllVisits();
    
    // Check if this IP already exists in the last hour to prevent duplicates
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const isDuplicate = visits.some(visit => 
        visit.ip === ip && 
        visit.timestamp > oneHourAgo
    );
    
    // Only add if not a duplicate
    if (!isDuplicate) {
        visits.unshift(visit);
        // Keep only the last 1000 visits to prevent localStorage from getting too large
        if (visits.length > 1000) {
            visits = visits.slice(0, 1000);
        }
        
        // Save back to localStorage
        localStorage.setItem('visitorData', JSON.stringify(visits));
    }
    
    return visits;
}

// Get all visits from localStorage
function getAllVisits() {
    return JSON.parse(localStorage.getItem('visitorData') || '[]');
}

// Delete a specific visitor by ID
function deleteVisitor(visitorId) {
    let visits = getAllVisits();
    visits = visits.filter(visit => visit.id !== visitorId);
    localStorage.setItem('visitorData', JSON.stringify(visits));
    return visits;
}

// Clear all visitor data
function clearAllVisitors() {
    localStorage.removeItem('visitorData');
    return [];
}

// Create confirmation dialog
function createConfirmationDialog(message, onConfirm) {
    const dialog = document.createElement('div');
    dialog.className = 'confirmation-dialog';
    dialog.innerHTML = `
        <div class="confirmation-box">
            <p>${message}</p>
            <div class="confirmation-buttons">
                <button class="btn" id="confirmCancel">Cancel</button>
                <button class="btn btn-danger" id="confirmDelete">Delete</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Show the dialog
    setTimeout(() => dialog.classList.add('visible'), 10);
    
    // Handle button clicks
    document.getElementById('confirmCancel').addEventListener('click', () => {
        dialog.remove();
    });
    
    document.getElementById('confirmDelete').addEventListener('click', () => {
        onConfirm();
        dialog.remove();
    });
    
    // Close on click outside
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            dialog.remove();
        }
    });
}

// Update the dashboard with visitor data
function updateDashboard(visits) {
    const visitorTableBody = document.getElementById('visitorTableBody');
    const totalVisitorsElement = document.getElementById('totalVisitors');
    
    // Clear existing rows
    visitorTableBody.innerHTML = '';
    
    // Count unique IPs
    const uniqueIPs = new Set(visits.map(visit => visit.ip));
    
    // Update stats
    totalVisitorsElement.textContent = visits.length;
    document.getElementById('uniqueIPs').textContent = uniqueIPs.size;
    
    // Add rows for each visit (show only the 100 most recent)
    const recentVisits = visits.slice(0, 100);
    
    if (recentVisits.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-light);">
                No visitor data available
            </td>
        `;
        visitorTableBody.appendChild(row);
        return;
    }
    
    recentVisits.forEach(visit => {
        const row = document.createElement('tr');
        const visitTime = new Date(visit.time);
        
        row.innerHTML = `
            <td>${formatTime(visitTime)}</td>
            <td>${visit.ip || 'Unknown'}</td>
            <td>${visit.browser || 'Unknown'}</td>
            <td>${visit.platform || 'Unknown'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${visit.id}" title="Delete this entry">
                        <i class="material-icons">delete</i>
                    </button>
                </div>
            </td>
        `;
        
        // Add delete button event listener
        const deleteBtn = row.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const visitorId = deleteBtn.getAttribute('data-id');
                createConfirmationDialog(
                    'Are you sure you want to delete this visitor entry?',
                    () => {
                        const updatedVisits = deleteVisitor(visitorId);
                        updateDashboard(updatedVisits);
                    }
                );
            });
        }
        
        visitorTableBody.appendChild(row);
    });
}

// Initialize the dashboard
async function initDashboard() {
    // Get visitor info
    const browserInfo = getBrowserInfo();
    
    try {
        const ip = await getIPAddress();
        // Save the visit
        saveVisitorData(ip, browserInfo.browser, browserInfo.platform);
    } catch (error) {
        console.error('Error saving visitor data:', error);
    }
    
    // Initial dashboard update
    updateDashboard(getAllVisits());
    
    // Set up clear all button
    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            createConfirmationDialog(
                'Are you sure you want to delete ALL visitor data? This cannot be undone!',
                () => {
                    clearAllVisitors();
                    updateDashboard([]);
                }
            );
        });
    }
    
    // Update the dashboard every 30 seconds to show any new visits
    setInterval(() => {
        updateDashboard(getAllVisits());
    }, 30000);
}

// Start the dashboard when the page loads
window.addEventListener('DOMContentLoaded', initDashboard);
