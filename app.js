// --- 1. CONFIGURATION & STYLING ---
const statusColors = { drinkable: '#007BFF', undrinkable: '#28A745', dry: '#A0522D' };

const badgeLabels = { drinkable: 'PITNÝ', undrinkable: 'NEPITNÝ', dry: 'SUCHÝ' };
const typeLabels = { well: 'GRANT', stream: 'TOK' };

const badgeStyles = {
    drinkable: 'text-drinkable border-drinkable bg-drinkable/10',
    undrinkable: 'text-undrinkable border-undrinkable bg-undrinkable/10',
    dry: 'text-dry border-dry bg-dry/10'
};

// --- 2. INJECT SITE COPY, ROUTES UI & CONTACT ---
const siteCopyContainer = document.getElementById('site-copy');

const routesHTML = mapRoutes.map(route => `
    <div class="route-container mb-2">
        <button onclick="window.toggleRoute('${route.id}')" id="btn-route-${route.id}" class="w-full text-left px-3 py-2.5 rounded-lg border border-[#d4c4b5] bg-sepia text-ink/90 hover:bg-[#e4d4c3] hover:text-ink transition-all font-bold text-sm flex items-center justify-between shadow-sm cursor-pointer ring-inset focus:outline-none">
            <div class="flex items-center space-x-3">
                <span class="w-3.5 h-3.5 rounded-full block border border-ink/20 shrink-0" style="background-color: ${route.color}"></span>
                <span>${route.name}</span>
            </div>
            <div id="route-icon-${route.id}" class="text-ink hidden shrink-0 ml-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </div>
        </button>
        <div id="route-desc-${route.id}" class="hidden px-3 py-3 text-xs text-ink/80 leading-relaxed border-l-[3px] ml-1.5 mt-2 mb-2" style="border-color: ${route.color}">
            ${route.description}
        </div>
    </div>
`).join('');

siteCopyContainer.innerHTML = `
    <h2 class="text-3xl font-bold text-ink mb-4 pr-8 sm:pr-0">${siteContent.title}</h2>
    <p class="text-ink/80 leading-relaxed text-sm sm:text-base mb-8">${siteContent.description}</p>
    
    <div class="mb-4">
        <h4 class="text-[10px] font-bold uppercase tracking-widest text-ink/50 mb-3 font-mono">Tematické trasy</h4>
        <div class="flex flex-col">
            ${routesHTML}
        </div>
    </div>

    <div class="mt-4 pt-4 border-t border-[#d4c4b5]">
        <p class="text-sm text-ink/70 italic leading-relaxed">
            ${siteContent.contactPrompt} 
            <a href="${siteContent.contactEmail}" class="underline hover:text-ink font-bold not-italic transition-colors">${siteContent.contactLinkText}</a>
        </p>
    </div>
`;

// --- 3. MAP INITIALIZATION ---
const map = L.map('map', { zoomControl: false }).setView([48.8065, 19.13], 15);
L.control.zoom({ position: 'bottomright' }).addTo(map);

L.Control.Center = L.Control.extend({
    onAdd: function(map) {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const button = L.DomUtil.create('a', 'leaflet-control-custom', container);
        button.href = '#';
        button.role = 'button';
        button.style.width = '30px';
        button.style.height = '30px';
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
        button.title = 'Center Map';
        button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" style="width: 22px; height: 22px;"><path fill="#2C363F" d="M16 4 A12 12 0 0 0 4 16 A12 12 0 0 0 16 28 A12 12 0 0 0 28 16 A12 12 0 0 0 16 4 z M 16 8 A8 8 0 0 1 24 16 A8 8 0 0 1 16 24 A8 8 0 0 1 8 16 A8 8 0 0 1 16 8 z" /><circle cx="16" cy="16" r="2" fill="#EADDCF"/></svg>';
        button.style.backgroundColor = '#EADDCF';
        button.style.border = '1px solid #d4c4b5';
        button.style.cursor = 'pointer';

        L.DomEvent.on(button, 'click', L.DomEvent.stop);
        L.DomEvent.on(button, 'click', function(){ map.setView([48.8065, 19.13], 15); });
        return container;
    }
});
L.control.center = function(opts) { return new L.Control.Center(opts); }
L.control.center({ position: 'bottomright' }).addTo(map);

L.tileLayer('https://outdoor.tiles.freemap.sk/{z}/{x}/{y}', {
    maxZoom: 19,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, Style &copy; <a href="https://www.freemap.sk">Freemap Slovakia</a>'
}).addTo(map);

// --- 4. MARKER CREATION ---
function createMarkerIcon(shape, color) {
    const shapes = {
        well: 'M4 20 C4 30, 28 30, 28 20 Z',
        stream: 'M6 13 C 10 9, 14 17, 16 13 C 20 9, 22 17, 26 13 L26 19 C 22 23, 20 15, 16 19 C 14 23, 10 15, 6 19 Z'
    };
    const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" class="marker"><path fill-opacity="0.95" stroke="#2C363F" stroke-width="1.5" stroke-opacity="0.9" fill="${color}" d="${shapes[shape]}"/></svg>`;
    const anchor = shape === 'well' ? [16, 30] : [16, 32];
    
    return L.icon({
        iconUrl: 'data:image/svg+xml;base64,' + btoa(svgIcon),
        iconSize: [32, 32],
        iconAnchor: anchor,
        popupAnchor: [0, -25],
    });
}

// --- 5. PANEL UI COLLISION LOGIC ---
const infoPanel = document.getElementById('info-panel');
const toggleButton = document.getElementById('toggle-button');
const mobileCloseBtn = document.getElementById('mobile-close-btn');

function handlePanelToggle() {
    const isCurrentlyCollapsed = infoPanel.classList.contains('collapsed');
    if (isCurrentlyCollapsed && map._popup) {
        const panelWidth = infoPanel.offsetWidth;
        const popupRect = map._popup.getElement().getBoundingClientRect();
        if (popupRect.left < (panelWidth + 16)) {
            map.closePopup();
        }
    }
    infoPanel.classList.toggle('collapsed');
}

toggleButton.addEventListener('click', handlePanelToggle);
mobileCloseBtn.addEventListener('click', handlePanelToggle);

// --- 6. GLOBAL REGISTRY & DECLARATIVE POPUPS ---
window.siteRegistry = {};

window.flipGallery = function(slug, direction) {
    const site = window.siteRegistry[slug];
    site.currentIndex += direction;
    site.marker.getPopup().setContent(getPopupHTML(slug));
};

function getPopupHTML(slug) {
    const site = window.siteRegistry[slug];
    const source = site.source;
    const currentImg = site.images[site.currentIndex];
    
    const isFirst = site.currentIndex === 0;
    const isLast = site.currentIndex === site.images.length - 1;
    const showArrows = site.images.length > 1;

    return `
        <div class="flex flex-col w-full h-full bg-sepia p-4 rounded-xl box-border">
            <div id="gallery-${source.id}" class="relative w-full mb-4">
                <img src="${currentImg}" alt="Fotka ${site.currentIndex + 1} z ${source.name}" width="238" height="238" class="site-image w-full aspect-square object-cover block m-0 rounded-lg shadow-sm border border-[#d4c4b5]">
                ${showArrows ? `
                    <button type="button" onclick="event.stopPropagation(); window.flipGallery('${slug}', -1);" ${isFirst ? 'disabled' : ''} class="absolute z-50 left-1 top-1/2 transform -translate-y-1/2 text-white/80 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed drop-shadow-md transition-colors focus:outline-none p-2 cursor-pointer">
                        <svg class="pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    </button>
                    <button type="button" onclick="event.stopPropagation(); window.flipGallery('${slug}', 1);" ${isLast ? 'disabled' : ''} class="absolute z-50 right-1 top-1/2 transform -translate-y-1/2 text-white/80 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed drop-shadow-md transition-colors focus:outline-none p-2 cursor-pointer">
                        <svg class="pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    </button>
                ` : ''}
            </div>
            <div class="w-full">
                <h3 class="text-[20px] font-bold text-ink mb-2 leading-tight">${source.name}</h3>
                <div class="flex items-center space-x-2 mb-3 font-mono text-[10px] tracking-wider font-bold">
                    <span class="px-2 py-1 rounded border border-ink/30 text-ink/80">${typeLabels[source.type]}</span>
                    <span class="px-2 py-1 rounded border ${badgeStyles[source.status]}">${badgeLabels[source.status]}</span>
                </div>
                <p class="text-sm text-ink/90 leading-relaxed m-0">${source.description}</p>
            </div>
        </div>
    `;
}

// --- 7. RENDER MARKERS ---
waterFeatures.forEach((source) => {
    if (source.lat === 0 && source.lng === 0) return;

    const icon = createMarkerIcon(source.type, statusColors[source.status]);
    const marker = L.marker([source.lat, source.lng], { icon: icon }).addTo(map);

    const images = [];
    for(let i = 1; i <= source.imageCount; i++) {
        images.push(`assets/${source.slug}-${i}.jpg`);
    }

    window.siteRegistry[source.slug] = {
        source: source,
        images: images,
        currentIndex: 0,
        marker: marker
    };
    
    marker.bindPopup(() => getPopupHTML(source.slug), { autoPanPadding: L.point(40, 40), closeButton: false });
});

// --- 8. NARRATIVE ROUTES & FOCUS MODE LOGIC ---
window.activeRoute = null;
window.activePolyline = null;

function enableFocusMode(routeId) {
    const route = mapRoutes.find(r => r.id === routeId);
    for (const slug in window.siteRegistry) {
        const marker = window.siteRegistry[slug].marker;
        const element = marker.getElement();
        
        if (route.slugs.includes(slug)) {
            marker.setOpacity(1);
            marker.setZIndexOffset(1000); 
            if (element) element.style.filter = 'none';
        } else {
            marker.setOpacity(1); 
            marker.setZIndexOffset(0);
            if (element) element.style.filter = 'grayscale(85%)';
        }
    }
}

function resetFocusMode() {
    for (const slug in window.siteRegistry) {
        const marker = window.siteRegistry[slug].marker;
        marker.setOpacity(1);
        marker.setZIndexOffset(0);
        const element = marker.getElement();
        if (element) element.style.filter = 'none';
    }
}

function turnOffRoute(routeId) {
    const btn = document.getElementById(`btn-route-${routeId}`);
    const desc = document.getElementById(`route-desc-${routeId}`);
    const icon = document.getElementById(`route-icon-${routeId}`);
    
    if (window.activePolyline && window.activePolyline !== 'loading') {
        map.removeLayer(window.activePolyline);
    }
    window.activePolyline = null;
    window.activeRoute = null;
    
    if (btn) btn.classList.remove('ring-2', 'ring-ink/40', 'bg-[#e4d4c3]', 'ring-inset');
    if (desc) desc.classList.add('hidden');
    if (icon) icon.classList.add('hidden');
    
    resetFocusMode();
}

function turnOnRoute(routeId) {
    window.activeRoute = routeId;
    const route = mapRoutes.find(r => r.id === routeId);
    if (!route) return;

    const btn = document.getElementById(`btn-route-${routeId}`);
    const desc = document.getElementById(`route-desc-${routeId}`);
    const icon = document.getElementById(`route-icon-${routeId}`);

    if (btn) btn.classList.add('ring-2', 'ring-ink/40', 'bg-[#e4d4c3]', 'ring-inset');
    if (desc) desc.classList.remove('hidden');
    if (icon) icon.classList.remove('hidden');

    enableFocusMode(routeId);
    window.activePolyline = 'loading';

    // MOBILE FIX: Instantly collapse the panel on mobile so the map is visible
    if (window.innerWidth < 640 && !infoPanel.classList.contains('collapsed')) {
        infoPanel.classList.add('collapsed');
    }

    fetch(route.file)
        .then(response => response.text())
        .then(xmlString => {
            if (window.activeRoute !== routeId) return; 

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, "text/xml");
            const points = Array.from(xmlDoc.querySelectorAll('trkpt, rtept')).map(pt => [
                parseFloat(pt.getAttribute('lat')),
                parseFloat(pt.getAttribute('lon'))
            ]);

            if (points.length > 0) {
                window.activePolyline = L.polyline(points, {
                    color: route.color,
                    weight: 4,
                    dashArray: '8, 8',
                    opacity: 0.85,
                    lineCap: 'round',
                    lineJoin: 'round'
                }).addTo(map);

                const panelWidth = (window.innerWidth < 640 || infoPanel.classList.contains('collapsed')) ? 0 : infoPanel.offsetWidth;
                map.fitBounds(window.activePolyline.getBounds(), { 
                    paddingTopLeft: [panelWidth + 40, 40],
                    paddingBottomRight: [40, 40],
                    animate: true,
                    duration: 1
                });
            } else {
                window.activePolyline = null;
            }
        })
        .catch(error => {
            console.error("Error loading GPX route:", error);
            window.activePolyline = null;
        });
}

window.toggleRoute = function(routeId) {
    if (window.activeRoute === routeId) {
        turnOffRoute(routeId); 
    } else {
        if (window.activeRoute) turnOffRoute(window.activeRoute); 
        turnOnRoute(routeId); 
    }
};

// --- 9. POPUP INTERACTION LOGIC ---
map.on('popupopen', function(e) {
    let clickedSlug = null;
    for (const slug in window.siteRegistry) {
        if (window.siteRegistry[slug].marker === e.popup._source) {
            clickedSlug = slug;
            break;
        }
    }

    if (window.activeRoute) {
        const route = mapRoutes.find(r => r.id === window.activeRoute);
        if (route && clickedSlug && !route.slugs.includes(clickedSlug)) {
            turnOffRoute(window.activeRoute);
        }
    }

    setTimeout(() => { e.popup.update(); }, 50);

    if (window.innerWidth < 640 && !infoPanel.classList.contains('collapsed')) {
        infoPanel.classList.add('collapsed');
    } else if (!infoPanel.classList.contains('collapsed')) {
        const panelRect = infoPanel.getBoundingClientRect();
        const popupRect = e.popup.getElement().getBoundingClientRect();
        if (popupRect.right > panelRect.left && popupRect.left < panelRect.right) {
             infoPanel.classList.add('collapsed');
        }
    }
});

map.on('popupclose', function(e) {
    for (const slug in window.siteRegistry) {
        window.siteRegistry[slug].currentIndex = 0;
    }
});