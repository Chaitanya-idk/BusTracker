
let currentRole = 'user';
let currentUser = null;
let map = null;
let busMarker = null;
let directionsService = null;
let directionsRenderer = null;
let currentTheme = 'light';


const busLocations = {
    'TS07-2450': { lat: 17.3850, lng: 78.4867, location: 'Hyderabad' },
    'AP05-1823': { lat: 16.5062, lng: 80.6480, location: 'Vijayawada' },
    'KA03-0976': { lat: 15.3173, lng: 75.7139, location: 'Bagalkot' }
};


document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    initializeTheme();
    setupThemeToggle();
});


function initializeApp() {
    setupRoleSwitching();
    setupSearchOptions();
    setupLoginForm();
    setCurrentTime();
    
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}


function initializeTheme() {
    const savedTheme = localStorage.getItem('bustracker-theme') || 'light';
    currentTheme = savedTheme;
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcons();
}

function setupThemeToggle() {
    const toggles = document.querySelectorAll('.theme-toggle');
    toggles.forEach(toggle => {
        toggle.addEventListener('click', toggleTheme);
    });
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('bustracker-theme', currentTheme);
    updateThemeIcons();
}

function updateThemeIcons() {
    const themeIcons = document.querySelectorAll('.theme-icon');
    themeIcons.forEach(icon => {
   
        icon.innerHTML = '';
        
        
        if (currentTheme === 'light') {
            icon.setAttribute('data-lucide', 'moon');
        } else {
            icon.setAttribute('data-lucide', 'sun');
        }
    });
    

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}


function setupRoleSwitching() {
    document.querySelectorAll('.role-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.role-option').forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            currentRole = this.dataset.role;
            
            const usernameLabel = document.getElementById('usernameLabel');
            const usernameInput = document.getElementById('username');
            
            if (currentRole === 'user') {
                usernameLabel.textContent = 'Phone Number';
                usernameInput.placeholder = '+91 98765 43210';
                usernameInput.type = 'tel';
            } else {
                usernameLabel.textContent = 'Service ID';
                usernameInput.placeholder = 'RTC001';
                usernameInput.type = 'text';
            }
        });
    });
}

function setupSearchOptions() {
    document.querySelectorAll('.search-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.search-option').forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            
            const serviceSearch = document.getElementById('serviceSearch');
            const routeSearch = document.getElementById('routeSearch');
            
            if (this.dataset.search === 'service') {
                serviceSearch.classList.remove('hidden');
                routeSearch.classList.add('hidden');
            } else {
                serviceSearch.classList.add('hidden');
                routeSearch.classList.remove('hidden');
            }
            
            document.getElementById('busListSection').classList.add('hidden');
        });
    });
}


function setupLoginForm() {
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (username && password) {
            currentUser = username;
            
            if (currentRole === 'user') {
                document.getElementById('userPhone').textContent = username;
                showUserDashboard();
            } else {
                document.getElementById('authorityId').textContent = `Authority ID: ${username}`;
                showAuthorityDashboard();
            }
        }
    });
}

function showUserDashboard() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('userDashboard').style.display = 'block';
}


function showAuthorityDashboard() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('authorityDashboard').style.display = 'block';
}


function searchByService() {
    const serviceId = document.getElementById('serviceIdInput').value.trim();
    if (serviceId) {
        showTrackingPage(serviceId);
    } else {
        alert('Please enter a valid Service ID');
    }
}


function searchByRoute() {
    const source = document.getElementById('sourceSelect').value;
    const destination = document.getElementById('destinationSelect').value;
    
    if (source && destination) {
 
        const buses = [
            { 
                serviceId: 'TS07-2450', 
                route: `${capitalizeFirst(source)} → ${capitalizeFirst(destination)}`, 
                status: 'On Route',
                nextStop: 'Shamshabad',
                eta: '6 hours'
            },
            { 
                serviceId: 'AP05-1823', 
                route: `${capitalizeFirst(source)} → ${capitalizeFirst(destination)}`, 
                status: 'Scheduled',
                nextStop: 'Departure in 2 hours',
                eta: '8 hours'
            },
            { 
                serviceId: 'KA03-0976', 
                route: `${capitalizeFirst(source)} → ${capitalizeFirst(destination)}`, 
                status: 'On Route',
                nextStop: 'Kurnool',
                eta: '7 hours'
            }
        ];
        
        displayBusList(buses);
    } else {
        alert('Please select both source and destination');
    }
}


function displayBusList(buses) {
    const busResults = document.getElementById('busResults');
    const busListSection = document.getElementById('busListSection');
    
    busResults.innerHTML = buses.map(bus => `
        <div class="bus-card" onclick="showTrackingPage('${bus.serviceId}')">
            <div class="bus-info">
                <div>
                    <div class="bus-route">
                        <i data-lucide="route" style="display: inline; width: 18px; height: 18px; vertical-align: middle; margin-right: 8px;"></i>
                        ${bus.route}
                    </div>
                    <small><i data-lucide="activity" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;"></i>Status: ${bus.status}</small>
                    <small><i data-lucide="navigation" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;"></i>Next: ${bus.nextStop}</small>
                    <small><i data-lucide="clock" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;"></i>ETA: ${bus.eta}</small>
                </div>
                <div class="bus-service-id">
                    <i data-lucide="hash" style="width: 16px; height: 16px; margin-right: 4px;"></i>
                    ${bus.serviceId}
                </div>
            </div>
        </div>
    `).join('');
    
    busListSection.classList.remove('hidden');
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}


function showTrackingPage(serviceId) {
    document.getElementById('trackingServiceId').textContent = `Service: ${serviceId}`;
    document.getElementById('userDashboard').style.display = 'none';
    document.getElementById('trackingPage').style.display = 'block';
    
    setTimeout(() => initializeMap(serviceId), 500);
    simulateLiveUpdates(serviceId);
}


function initMap() {
    
    console.log('Google Maps API loaded');
}


function initializeMap(serviceId) {
    const mapElement = document.getElementById('map');
    const loadingElement = document.getElementById('mapLoading');
    
    if (!mapElement) return;
    

    const busLocation = busLocations[serviceId] || { lat: 17.3850, lng: 78.4867, location: 'Hyderabad' };
    
    try {

        map = new google.maps.Map(mapElement, {
            zoom: 12,
            center: busLocation,
            mapTypeId: 'roadmap',
            styles: [
                {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'off' }]
                },
                {
                    featureType: 'transit.station.bus',
                    elementType: 'labels',
                    stylers: [{ visibility: 'on' }]
                }
            ]
        });

        const busIcon = {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="24" cy="24" r="22" fill="#3b82f6" stroke="white" stroke-width="4"/>
                    <g transform="translate(24, 24)">
                        <path d="M-8,-6 L8,-6 L8,6 L-8,6 Z" fill="white"/>
                        <rect x="-6" y="-4" width="3" height="3" fill="#3b82f6"/>
                        <rect x="-1" y="-4" width="3" height="3" fill="#3b82f6"/>
                        <rect x="4" y="-4" width="3" height="3" fill="#3b82f6"/>
                        <rect x="-6" y="1" width="12" height="2" fill="#3b82f6"/>
                        <circle cx="-4" cy="4" r="1" fill="#3b82f6"/>
                        <circle cx="4" cy="4" r="1" fill="#3b82f6"/>
                    </g>
                </svg>
            `),
            scaledSize: new google.maps.Size(48, 48),
            anchor: new google.maps.Point(24, 24)
        };

   
        busMarker = new google.maps.Marker({
            position: busLocation,
            map: map,
            title: `Bus ${serviceId}`,
            icon: busIcon,
            animation: google.maps.Animation.BOUNCE
        });


        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div style="padding: 10px;">
                    <h4 style="color: #667eea; margin: 0 0 8px 0;">🚌 Bus ${serviceId}</h4>
                    <p style="margin: 4px 0; color: #4a5568;"><strong>Current Location:</strong> ${busLocation.location}</p>
                    <p style="margin: 4px 0; color: #4a5568;"><strong>Status:</strong> On Route</p>
                    <p style="margin: 4px 0; color: #4a5568;"><strong>Next Stop:</strong> Shamshabad</p>
                    <p style="margin: 4px 0; color: #4a5568;"><strong>Speed:</strong> 65 km/h</p>
                </div>
            `
        });

    
        busMarker.addListener('click', () => {
            infoWindow.open(map, busMarker);
        });

       
        setTimeout(() => {
            infoWindow.open(map, busMarker);
        }, 1000);

        
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }

        setTimeout(() => {
            busMarker.setAnimation(null);
        }, 3000);

        
        simulateBusMovement(serviceId);

    } catch (error) {
        console.error('Error initializing map:', error);
        showMapFallback();
    }
}

function showMapFallback() {
    const mapElement = document.getElementById('map');
    const loadingElement = document.getElementById('mapLoading');
    
    if (mapElement && loadingElement) {
        loadingElement.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <h3 style="color: #667eea; margin-bottom: 15px;">🚌 Live Bus Tracking</h3>
                <div style="background: #667eea; color: white; padding: 15px; border-radius: 10px; margin: 10px 0;">
                    <strong>Bus Location: Hyderabad → Chennai Route</strong>
                </div>
                <p style="color: #718096; margin: 10px 0;">Current Position: Approaching Shamshabad</p>
                <p style="color: #718096;">Speed: 65 km/h | ETA: 6 hours</p>
                <div style="margin-top: 20px; padding: 15px; background: #f0f4f8; border-radius: 8px;">
                    <small style="color: #4a5568;">Note: Enable location services for real-time GPS tracking</small>
                </div>
            </div>
        `;
    }
}


function simulateBusMovement(serviceId) {
    if (!map || !busMarker) return;
    
    const movements = [
        { lat: 17.3750, lng: 78.4967, location: 'Shamshabad Area' },
        { lat: 17.3650, lng: 78.5167, location: 'Toll Plaza' },
        { lat: 17.3550, lng: 78.5367, location: 'Jadcherla Approach' }
    ];
    
    let currentMovement = 0;
    
    const moveInterval = setInterval(() => {
        if (currentMovement < movements.length && busMarker && map) {
            const newPosition = movements[currentMovement];
            busMarker.setPosition(newPosition);
            map.setCenter(newPosition);
            
          
            const infoWindow = new google.maps.InfoWindow({
                content: `
                    <div style="padding: 12px; font-family: Arial, sans-serif;">
                        <h4 style="color: #3b82f6; margin: 0 0 8px 0;">🚌 Bus ${serviceId}</h4>
                        <p style="margin: 4px 0; color: #333;"><strong>Location:</strong> ${newPosition.location}</p>
                        <p style="margin: 4px 0; color: #333;"><strong>Status:</strong> Moving</p>
                        <p style="margin: 4px 0; color: #333;"><strong>Speed:</strong> ${Math.round(60 + Math.random() * 20)} km/h</p>
                        <p style="margin: 4px 0; color: #10b981;"><strong>Updated:</strong> Just now</p>
                    </div>
                `
            });
            
            infoWindow.open(map, busMarker);
            currentMovement++;
        } else {
            clearInterval(moveInterval);
          
            activeIntervals = activeIntervals.filter(id => id !== moveInterval);
        }
    }, 8000);
    
   
    activeIntervals.push(moveInterval);
}


function clearAllIntervals() {
    activeIntervals.forEach(intervalId => {
        clearInterval(intervalId);
    });
    activeIntervals = [];
}


function goBackToDashboard() {
    document.getElementById('trackingPage').style.display = 'none';
    document.getElementById('userDashboard').style.display = 'block';
    

    if (map) {
        map = null;
    }
    if (busMarker) {
        busMarker = null;
    }
    

    clearAllIntervals();
}


function goBack() {
  
    if (document.getElementById('trackingPage').style.display === 'block') {
        goBackToDashboard();
    } else if (document.getElementById('userDashboard').style.display === 'block' || 
               document.getElementById('authorityDashboard').style.display === 'block') {
        logout();
    }
}


function goBackToSearch() {
    document.getElementById('busListSection').classList.add('hidden');

    document.getElementById('sourceSelect').value = '';
    document.getElementById('destinationSelect').value = '';
    document.getElementById('serviceIdInput').value = '';
}

let activeIntervals = [];


function simulateLiveUpdates(serviceId) {
    const updatesContainer = document.getElementById('liveUpdates');
    const updates = [
        { 
            time: getCurrentTime(1), 
            message: 'Bus crossing Shamshabad - Speed: 70 km/h',
            icon: 'navigation'
        },
        { 
            time: getCurrentTime(2), 
            message: 'Approaching Jadcherla - Traffic: Light',
            icon: 'map-pin'
        },
        { 
            time: getCurrentTime(3), 
            message: 'Passed Kurnool bypass - Next: Anantapur',
            icon: 'route'
        }
    ];
    
    let updateIndex = 0;
    const updateInterval = setInterval(() => {
        if (updateIndex < updates.length) {
            const update = updates[updateIndex];
            const updateElement = document.createElement('div');
            updateElement.className = 'update-item';
            updateElement.innerHTML = `
                <div class="update-time">
                    <i data-lucide="clock"></i>
                    ${update.time}
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="${update.icon}" style="width: 16px; height: 16px; color: var(--primary-color);"></i>
                    ${update.message}
                </div>
            `;
            
            updatesContainer.insertBefore(updateElement, updatesContainer.firstChild);
            
            
            updateElement.style.backgroundColor = 'var(--bg-tertiary)';
            setTimeout(() => {
                updateElement.style.backgroundColor = 'var(--bg-secondary)';
            }, 2000);
            
 
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            
            updateIndex++;
        } else {
            clearInterval(updateInterval);
           
            activeIntervals = activeIntervals.filter(id => id !== updateInterval);
        }
    }, 6000);
    

    activeIntervals.push(updateInterval);
}

function updateBusStatus() {
    const statusUpdate = document.getElementById('statusUpdate').value;
    const updateTime = document.getElementById('updateTime').value;
    
    if (statusUpdate && updateTime) {
      
        const updatesContainer = document.getElementById('authorityUpdates');
        const newUpdate = document.createElement('div');
        newUpdate.className = 'update-item';
        newUpdate.innerHTML = `
            <div class="update-time">
                <i data-lucide="clock"></i>
                ${updateTime}
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <i data-lucide="edit-3" style="width: 16px; height: 16px; color: var(--secondary-color);"></i>
                Updated: ${statusUpdate}
            </div>
        `;
        updatesContainer.insertBefore(newUpdate, updatesContainer.firstChild);
        

        const currentStatus = document.querySelector('.status-details p:last-child');
        if (currentStatus) {
            currentStatus.innerHTML = `
                <i data-lucide="map-pin"></i>
                Last Update: ${updateTime} - ${statusUpdate}
            `;
        }
        

        document.getElementById('statusUpdate').value = '';
        document.getElementById('updateTime').value = getCurrentTime();
        
      
        showNotification('Status updated successfully!', 'success');
        
       
        newUpdate.style.backgroundColor = 'var(--bg-tertiary)';
        setTimeout(() => {
            newUpdate.style.backgroundColor = 'var(--bg-secondary)';
        }, 3000);
        

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    } else {
        showNotification('Please fill in all fields', 'error');
    }
}


function logout() {
 
    clearAllIntervals();
    

    document.getElementById('userDashboard').style.display = 'none';
    document.getElementById('authorityDashboard').style.display = 'none';
    document.getElementById('trackingPage').style.display = 'none';
    

    if (map) {
        map = null;
    }
    if (busMarker) {
        busMarker = null;
    }
  
    document.body.style.cssText = '';
    document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    document.body.style.background = "var(--bg-secondary)";
    document.body.style.minHeight = "100vh";
    document.body.style.display = "flex";
    document.body.style.alignItems = "center";
    document.body.style.justifyContent = "center";
    document.body.style.color = "var(--text-primary)";
    document.body.style.transition = "background-color 0.3s ease, color 0.3s ease";
    

    const loginPage = document.getElementById('loginPage');
    loginPage.style.display = 'flex';
    loginPage.style.flexDirection = 'column';
    

    document.getElementById('loginForm').reset();
    currentUser = null;
    

    document.getElementById('busListSection').classList.add('hidden');
    document.getElementById('serviceSearch').classList.remove('hidden');
    document.getElementById('routeSearch').classList.add('hidden');
    

    document.querySelectorAll('.search-option').forEach(opt => opt.classList.remove('active'));
    document.querySelector('.search-option[data-search="service"]').classList.add('active');
    

    setTimeout(() => {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }, 100);
}


function capitalizeFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function getCurrentTime(addMinutes = 0) {
    const now = new Date();
    now.setMinutes(now.getMinutes() + addMinutes);
    return now.toTimeString().slice(0, 5);
}

function setCurrentTime() {
    const timeInput = document.getElementById('updateTime');
    if (timeInput) {
        timeInput.value = getCurrentTime();
    }
}


function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    
    let icon = '💡';
    let bgColor = 'var(--primary-color)';
    
    switch(type) {
        case 'success':
            icon = '✅';
            bgColor = 'var(--secondary-color)';
            break;
        case 'error':
            icon = '❌';
            bgColor = 'var(--danger-color)';
            break;
        case 'warning':
            icon = '⚠️';
            bgColor = 'var(--warning-color)';
            break;
    }
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 12px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        background: ${bgColor};
        box-shadow: var(--shadow-lg);
        display: flex;
        align-items: center;
        gap: 10px;
        border: 1px solid rgba(255, 255, 255, 0.2);
    `;
    
    notification.innerHTML = `
        <span style="font-size: 1.2rem;">${icon}</span>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}


const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    /* Smooth theme transitions */
    * {
        transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
    }
    
    /* Custom scrollbar for dark theme */
    [data-theme="dark"] ::-webkit-scrollbar {
        width: 8px;
    }
    
    [data-theme="dark"] ::-webkit-scrollbar-track {
        background: var(--bg-tertiary);
        border-radius: 4px;
    }
    
    [data-theme="dark"] ::-webkit-scrollbar-thumb {
        background: var(--border-hover);
        border-radius: 4px;
    }
    
    [data-theme="dark"] ::-webkit-scrollbar-thumb:hover {
        background: var(--text-muted);
    }
`;
document.head.appendChild(style);


window.gm_authFailure = function() {
    console.warn('Google Maps authentication failed');
    showMapFallback();
};


window.initMap = initMap;