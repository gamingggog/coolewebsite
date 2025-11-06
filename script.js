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

// Save visitor data to localStorage
function saveVisitorData(ip, browser, platform) {
    const now = new Date();
    const visit = {
        time: now.toISOString(),
        ip: ip,
        browser: browser,
        platform: platform,
        timestamp: now.getTime()
    };

    // Get existing visits or initialize empty array
    let visits = JSON.parse(localStorage.getItem('visitorData') || '[]');
    
    // Add new visit
    visits.unshift(visit);
    
    // Keep only the last 100 visits to prevent localStorage from getting too large
    if (visits.length > 100) {
        visits = visits.slice(0, 100);
    }
    
    // Save back to localStorage
    localStorage.setItem('visitorData', JSON.stringify(visits));
    
    return visits;
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
    
    // Add rows for each visit (show only the 20 most recent)
    const recentVisits = visits.slice(0, 20);
    recentVisits.forEach(visit => {
        const row = document.createElement('tr');
        const visitTime = new Date(visit.time);
        
        row.innerHTML = `
            <td>${formatTime(visitTime)}</td>
            <td>${visit.ip}</td>
            <td>${visit.browser}</td>
            <td>${visit.platform}</td>
        `;
        
        visitorTableBody.appendChild(row);
    });
}

// Initialize the dashboard
async function initDashboard() {
    // Get visitor info
    const browserInfo = getBrowserInfo();
    const ip = await getIPAddress();
    
    // Save the visit
    const visits = saveVisitorData(
        ip,
        browserInfo.browser,
        browserInfo.platform
    );
    
    // Update the dashboard
    updateDashboard(visits);
    
    // Update the dashboard every 5 seconds to show any new visits
    setInterval(() => {
        const storedVisits = JSON.parse(localStorage.getItem('visitorData') || '[]');
        updateDashboard(storedVisits);
    }, 5000);
}

// Start the dashboard when the page loads
window.addEventListener('DOMContentLoaded', initDashboard);
