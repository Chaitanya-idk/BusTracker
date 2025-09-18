
let currentRole = 'user';
let currentUser = null;
let map = null;
let busMarker = null;
let directionsService = null;
let directionsRenderer = null;
let currentTheme = 'light';

let currentBus = null; // holds latest bus document
let locationPollIntervalId = null;

const API_BASE = window.APP_API_BASE || (location.hostname.includes('localhost') ? 'http://localhost:5000' : 'https://YOUR-RENDER-APP.onrender.com');

async function apiGet(path) {
	const res = await fetch(`${API_BASE}${path}`);
	if (!res.ok) throw new Error(`GET ${path} failed`);
	return res.json();
}

async function apiPost(path, body) {
	const res = await fetch(`${API_BASE}${path}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
	if (!res.ok) throw new Error(`POST ${path} failed`);
	return res.json();
}

async function apiPatch(path, body) {
	const res = await fetch(`${API_BASE}${path}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
	if (!res.ok) throw new Error(`PATCH ${path} failed`);
	return res.json();
}


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
				loadAuthorityData();
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


async function searchByRoute() {
    const source = document.getElementById('sourceSelect').value;
    const destination = document.getElementById('destinationSelect').value;
    if (source && destination) {
        try {
            const results = await apiGet(`/api/search?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}`);
            const buses = (results || []).map(doc => ({
                serviceId: doc.vehicleNumber || String(doc.serviceNumber),
                route: `${capitalizeFirst(doc.source)} → ${capitalizeFirst(doc.destination)}`,
                status: doc.currentStatus || 'Unknown',
                nextStop: '—',
                eta: '—'
            }));
            if (buses.length === 0) {
                showNotification('No buses found for route', 'warning');
            }
            displayBusList(buses);
        } catch (e) {
            showNotification('Search failed', 'error');
        }
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


async function showTrackingPage(serviceId) {
	document.getElementById('trackingServiceId').textContent = `Service: ${serviceId}`;
	document.getElementById('userDashboard').style.display = 'none';
	document.getElementById('trackingPage').style.display = 'block';

	try {
		const isNumeric = /^\d{3,}$/.test(serviceId);
		const queryParam = isNumeric ? `serviceNumber=${encodeURIComponent(parseInt(serviceId, 10))}` : `vehicleNumber=${encodeURIComponent(serviceId)}`;
		currentBus = await apiGet(`/api/bus?${queryParam}`);
		setTimeout(() => initializeMapWithBus(currentBus), 300);
		startPollingLocation(currentBus, isNumeric ? 'serviceNumber' : 'vehicleNumber');
	} catch (err) {
		console.error('Failed to load bus from API', err);
		showNotification('Bus not found. Please check the ID.', 'error');
		goBackToDashboard();
	}

	simulateLiveUpdates(serviceId);
}


function initMap() {
    
    console.log('Google Maps API loaded');
}


function initializeMapWithBus(busDoc) {
    const mapElement = document.getElementById('map');
    const loadingElement = document.getElementById('mapLoading');
    
    if (!mapElement) return;
    
	const center = { lat: busDoc?.latitude ?? 17.3850, lng: busDoc?.longitude ?? 78.4867 };
    
    try {

		map = new google.maps.Map(mapElement, {
            zoom: 12,
			center: center,
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
			position: center,
            map: map,
			title: `Bus ${busDoc?.vehicleNumber || busDoc?.serviceNumber || ''}`,
            icon: busIcon,
            animation: google.maps.Animation.BOUNCE
        });


		const infoWindow = new google.maps.InfoWindow({
            content: `
                <div style="padding: 10px;">
					<h4 style="color: #667eea; margin: 0 0 8px 0;">🚌 Bus ${busDoc?.vehicleNumber || busDoc?.serviceNumber || ''}</h4>
					<p style="margin: 4px 0; color: #4a5568;"><strong>Source:</strong> ${busDoc?.source || '-'} → <strong>Dest:</strong> ${busDoc?.destination || '-'}</p>
					<p style="margin: 4px 0; color: #4a5568;"><strong>Status:</strong> ${busDoc?.currentStatus || 'Unknown'}</p>
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


    } catch (error) {
        console.error('Error initializing map:', error);
        showMapFallback();
    }
}

async function startPollingLocation(busDoc, idType) {
	if (locationPollIntervalId) {
		clearInterval(locationPollIntervalId);
		locationPollIntervalId = null;
	}

	const idValue = idType === 'serviceNumber' ? busDoc.serviceNumber : busDoc.vehicleNumber;
	const qp = idType === 'serviceNumber' ? `serviceNumber=${encodeURIComponent(busDoc.serviceNumber)}` : `vehicleNumber=${encodeURIComponent(busDoc.vehicleNumber)}`;

	locationPollIntervalId = setInterval(async () => {
		try {
			const latest = await apiGet(`/api/bus?${qp}`);
			currentBus = latest;
			if (map && busMarker && typeof latest.latitude === 'number' && typeof latest.longitude === 'number') {
				const newPos = { lat: latest.latitude, lng: latest.longitude };
				busMarker.setPosition(newPos);
				map.setCenter(newPos);
			}
		} catch (e) {
			console.warn('Polling failed', e);
		}
	}, 5000);
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


function simulateBusMovement() {}


function clearAllIntervals() {
    activeIntervals.forEach(intervalId => {
        clearInterval(intervalId);
    });
    activeIntervals = [];
	if (locationPollIntervalId) {
		clearInterval(locationPollIntervalId);
		locationPollIntervalId = null;
	}
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

async function updateBusStatus() {
	const statusUpdate = document.getElementById('statusUpdate').value;
	const updateTime = document.getElementById('updateTime').value;
	const selector = document.getElementById('authorityBusSelect');
	const selectedVehicle = selector?.value;
	
	if (statusUpdate && updateTime && selectedVehicle) {
		try {
			await apiPatch('/api/location', { vehicleNumber: selectedVehicle, currentStatus: statusUpdate });
			// UI feedback
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
			if (typeof lucide !== 'undefined') {
				lucide.createIcons();
			}
		} catch (e) {
			showNotification('Failed to update status', 'error');
		}
	} else {
		showNotification('Please fill in all fields', 'error');
	}
}

async function loadAuthorityData() {
	try {
		const buses = await apiGet('/api/main');
		const select = document.getElementById('authorityBusSelect');
		if (select) {
			select.innerHTML = '<option value="">Select Vehicle Number</option>' + buses.map(b => `<option value="${b.vehicleNumber}">${b.vehicleNumber} (${b.serviceNumber})</option>`).join('');
		}
	} catch (e) {
		console.warn('Failed to load bus list');
	}
}

async function submitBusForm(e) {
	e?.preventDefault?.();
	const form = document.getElementById('busForm');
	if (!form) return;
	const formData = new FormData(form);
	const payload = Object.fromEntries(formData.entries());
	// coerce numeric fields
	if (payload.serviceNumber) payload.serviceNumber = parseInt(payload.serviceNumber, 10);
	if (payload.latitude) payload.latitude = parseFloat(payload.latitude);
	if (payload.longitude) payload.longitude = parseFloat(payload.longitude);
	try {
		await apiPost('/api/main', payload);
		showNotification('Bus saved successfully', 'success');
		form.reset();
		loadAuthorityData();
	} catch (e) {
		showNotification('Failed to save bus', 'error');
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

// Attach authority form handler if present
document.addEventListener('DOMContentLoaded', () => {
	const form = document.getElementById('busForm');
	if (form) {
		form.addEventListener('submit', submitBusForm);
	}
});