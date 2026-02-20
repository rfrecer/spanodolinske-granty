// --- 1. INJECT SITE COPY ---
const siteCopyContainer = document.getElementById('site-copy');
siteCopyContainer.innerHTML = `
    <h2 class="text-2xl font-bold text-gray-800 mb-4">${siteContent.title}</h2>
    <p class="text-gray-700 leading-relaxed text-sm sm:text-base">${siteContent.description}</p>
`;

// --- 2. MAP INITIALIZATION ---
const map = L.map('map', {
    zoomControl: false // Disable default zoom control
}).setView([48.8065, 19.13], 15); // Centered view

// Add zoom control to the bottom right
L.control.zoom({ position: 'bottomright' }).addTo(map);

// --- CUSTOM CENTER CONTROL ---
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
        button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" style="width: 22px; height: 22px;"><path d="M16 4 A12 12 0 0 0 4 16 A12 12 0 0 0 16 28 A12 12 0 0 0 28 16 A12 12 0 0 0 16 4 z M 16 8 A8 8 0 0 1 24 16 A8 8 0 0 1 16 24 A8 8 0 0 1 8 16 A8 8 0 0 1 16 8 z" /><circle cx="16" cy="16" r="2"/></svg>';
        button.style.backgroundColor = 'white';
        button.style.cursor = 'pointer';

        L.DomEvent.on(button, 'click', L.DomEvent.stop);
        L.DomEvent.on(button, 'click', function(){
            map.setView([48.8065, 19.13], 15);
        });

        return container;
    }
});

L.control.center = function(opts) {
    return new L.Control.Center(opts);
}

L.control.center({ position: 'bottomright' }).addTo(map);

// Use the reliable tile layer from Freemap.sk
L.tileLayer('https://outdoor.tiles.freemap.sk/{z}/{x}/{y}', {
    maxZoom: 19,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Map style &copy; <a href="https://www.freemap.sk">Freemap Slovakia</a>'
}).addTo(map);

// --- CUSTOM MARKER ICONS ---
function createMarkerIcon(shape, color) {
    const shapes = {
        well: 'M4 20 C4 30, 28 30, 28 20 Z',
        stream: 'M6 13 C 10 9, 14 17, 16 13 C 20 9, 22 17, 26 13 L26 19 C 22 23, 20 15, 16 19 C 14 23, 10 15, 6 19 Z'
    };
    const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" class="marker"><path fill-opacity="0.9" stroke="#000" stroke-width="1.5" stroke-opacity="0.7" fill="${color}" d="${shapes[shape]}"/></svg>`;
    const anchor = shape === 'well' ? [16, 30] : [16, 32];
    return L.icon({
        iconUrl: 'data:image/svg+xml;base64,' + btoa(svgIcon),
        iconSize: [32, 32],
        iconAnchor: anchor,
        popupAnchor: [0, -25],
    });
}

// --- SLOVAK TRANSLATIONS AND STYLES ---
const statusColors = { drinkable: '#007BFF', undrinkable: '#28A745', dry: '#A0522D' };
const statusTranslations = { drinkable: 'Pitný', undrinkable: 'Nepitný', dry: 'Suchý' };
const statusStyles = {
    drinkable: 'text-blue-800 bg-blue-100 border border-blue-300',
    undrinkable: 'text-green-800 bg-green-100 border border-green-300',
    dry: 'text-yellow-800 bg-yellow-100 border border-yellow-400'
};

// --- COLLAPSIBLE PANEL LOGIC ---
const infoPanel = document.getElementById('info-panel');
const toggleButton = document.getElementById('toggle-button');
toggleButton.addEventListener('click', () => {
    infoPanel.classList.toggle('collapsed');
});

// --- MARKER CREATION ---
waterFeatures.forEach((source) => {
    // Skip sources with placeholder coordinates
    if (source.lat === 0 && source.lng === 0) {
        return;
    }

    const icon = createMarkerIcon(source.type, statusColors[source.status]);
    const marker = L.marker([source.lat, source.lng], { icon: icon }).addTo(map);

    const typeBadgeText = source.type === 'well' ? 'Grant' : 'Tok';
    const statusBadgeText = statusTranslations[source.status];
    const statusBadgeStyle = statusStyles[source.status];

    const popupContent = `
        <div class="w-[250px]">
            <h3 class="text-lg font-bold mb-2">${source.name}</h3>
            <div class="flex items-center space-x-2 mb-3">
                <span class="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-gray-200 text-gray-700 border border-gray-400">${typeBadgeText}</span>
                <span class="inline-block px-3 py-1 text-sm font-semibold rounded-full ${statusBadgeStyle}">${statusBadgeText}</span>
            </div>
            <div id="gallery-${source.id}" class="popup-gallery relative group mb-3">
                <img src="assets/${source.slug}-1.jpg" loading="lazy" alt="Fotka 1 z ${source.name}" class="site-image shadow-md">
                <button class="prev-image-btn popup-gallery-btn absolute top-1/2 left-2 transform -translate-y-1/2 bg-black bg-opacity-40 text-white rounded-full p-1 hidden group-hover:block focus:outline-none">&lt;</button>
                <button class="next-image-btn popup-gallery-btn absolute top-1/2 right-2 transform -translate-y-1/2 bg-black bg-opacity-40 text-white rounded-full p-1 hidden group-hover:block focus:outline-none">&gt;</button>
            </div>
            <p class="text-sm text-gray-700">${source.description}</p>
        </div>
    `;
    // Add autoPanPadding to give Leaflet more room to pan the popup into view
    marker.bindPopup(popupContent, { autoPanPadding: L.point(80, 80) });
});

// --- POPUP AND PANEL INTERACTION LOGIC ---
map.on('popupopen', function(e) {
    // If on mobile (small screen) and panel is open, collapse it when popup opens
    if (window.innerWidth < 640 && !infoPanel.classList.contains('collapsed')) {
        infoPanel.classList.add('collapsed');
    }
    // Original desktop collision logic
    else if (!infoPanel.classList.contains('collapsed')) {
        const panelRect = infoPanel.getBoundingClientRect();
        const popupRect = e.popup.getElement().getBoundingClientRect();
        if (popupRect.right > panelRect.left && popupRect.left < panelRect.right) {
             infoPanel.classList.add('collapsed');
        }
    }

    const popupNode = e.popup.getElement();
    const sourceName = popupNode.querySelector('h3').textContent;
    const source = waterFeatures.find(s => s.name === sourceName);
    
    if (!source) return;

    const prevButton = popupNode.querySelector('.prev-image-btn');
    const nextButton = popupNode.querySelector('.next-image-btn');
    
    // Dynamically build the images array for this source
    const images = [];
    for(let i = 1; i <= source.imageCount; i++) {
        images.push(`assets/${source.slug}-${i}.jpg`);
    }
    
    if (images.length <= 1) {
        prevButton.style.display = 'none';
        nextButton.style.display = 'none';
        return;
    }

    let currentIndex = 0;
    const imgElement = popupNode.querySelector('.site-image');
    const gallery = popupNode.querySelector('.popup-gallery');

    function updateGalleryView() {
        imgElement.src = images[currentIndex];
        imgElement.alt = `Fotka ${currentIndex + 1} z ${source.name}`;
        prevButton.disabled = currentIndex === 0;
        nextButton.disabled = currentIndex === images.length - 1;
        prevButton.style.display = 'block';
        nextButton.style.display = 'block';
    }

    prevButton.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (currentIndex > 0) {
            currentIndex--;
            updateGalleryView();
        }
    });

    nextButton.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (currentIndex < images.length - 1) {
            currentIndex++;
            updateGalleryView();
        }
    });
    
    gallery.addEventListener('wheel', (event) => {
        event.preventDefault();
        if (event.deltaY < 0) {
            if (currentIndex > 0) {
                currentIndex--;
                updateGalleryView();
            }
        } else {
            if (currentIndex < images.length - 1) {
                currentIndex++;
                updateGalleryView();
            }
        }
    }, { passive: false });

    updateGalleryView();
});