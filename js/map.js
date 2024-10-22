/* globals turf */

// prepare data for maps

// map basetiles
const mapBoxTile = L.tileLayer('https://api.mapbox.com/styles/v1/junyiy/clpdjdrj7005r01qjb99zhdr5/tiles/{tileSize}/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoianVueWl5IiwiYSI6ImNsdWVxcHowcDBxbWUyam92MWx5aW40MnkifQ.QR9kni83fZBO-EFBXAaX7g', {
  maxZoom: 19,
  zoomOffset: -1,
  tileSize: 512,
  attribution: `© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>`,
});

// other tile options for layer control
const esriWorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
});

// data layers style
const boundaryStyle = {
  stroke: true,
  fill: false,
  color: '#F0BAAB',
  weight: 3,
};

const censusTractStyle = {
  stroke: true,
  fill: false,
  color: '#919191',
  dashArray: '2 2',
  weight: 0.5,
};

const countyStyle = {
  stroke: true,
  fill: false,
  color: '#919191',
  dashArray: '2 2',
  weight: 1,
};

const huc10Style = {
  stroke: true,
  fill: false,
  color: '#AAB9F0',
  weight: 1,
};

const huc12Style = {
  stroke: true,
  fill: false,
  color: '#AAB9F0',
  weight: 1,
};

const shorelineBaseStyle = {
  stroke: true,
  color: '#EF8F5D',
  weight: 1.8,
};

function initializeMap(censusTracts, dataBoundary, huc10, huc12, county, shorelineBase, previousProjects) {
  const map = L.map('map-projects', {zoomSnap: 0, layers: [mapBoxTile]}).setView([42.57, -79.22], 10); // zoomSnap 0 make the zoom level to real number

  const baseMaps = {
    'Simple': mapBoxTile,
    'Satellite': esriWorldImagery,
  };

  // add layers
  // if have a lot of layers, it is better to add layers as map's attributes
  map.dataBoundaryLayer = L.geoJSON(dataBoundary, boundaryStyle);
  map.dataBoundaryLayer.addTo(map);

  map.censusTractLayer = L.geoJSON(censusTracts, censusTractStyle);

  map.countyLayer = L.geoJSON(county, countyStyle);

  map.huc10Layer = L.geoJSON(huc10, huc10Style);

  map.huc12Layer = L.geoJSON(huc12, huc12Style);

  map.shorelineBaseLayer = L.geoJSON(shorelineBase,
    shorelineBaseStyle).bringToFront();
  map.shorelineBaseLayer.addTo(map);

  // initialize legend
  map.legend = L.control({position: 'bottomright'});

  // add back button
  const backView = L.control({position: 'topleft'});
  backView.onAdd = (map) => {
    return backButtonStyle(map);
  };
  backView.addTo(map);

  // layer control
  map.countyLayer.addTo(map); // need to add it to map in order to have this layer show up when initialize

  const layerControl = {
    'Census Tract': map.censusTractLayer,
    'County': map.countyLayer,
    'HUC 10': map.huc10Layer,
    'HUC12': map.huc12Layer,
  };

  // multiple tile layer
  L.control.layers(baseMaps, layerControl).addTo(map);

  // add scale bar
  L.control.scale().addTo(map);

  // make the zoom level fit different browser size
  // always focus on the buffer zone when initialize the map
  const zoomRef = turf.buffer(dataBoundary, 20);
  map.zoomRefLayer = L.geoJSON(zoomRef);
  map.fitBounds(map.zoomRefLayer.getBounds());

  // always put coastal layer on the top when adding new layers to the map
  map.addEventListener('overlayadd', () => {
    map.shorelineBaseLayer.bringToFront();
    map.sliceLayer.bringToFront();
    if (map.colorLayer !== null) {
      map.colorLayer.bringToFront();
    }
    map.dataBoundaryLayer.bringToFront();
  });


  return map;
}

// back button
function backButtonStyle(map) {
  const backDiv = document.createElement('div');
  backDiv.classList.add('back-button'); // div class
  backDiv.title = 'Back'; // this will be shown when cursor hover over the button
  backDiv.innerHTML = `<svg id="back" width="23px" height="18px" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="#3d3d3d" stroke="#3d3d3d" stroke-width="33.792"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path fill="#474747" d="M224 480h640a32 32 0 1 1 0 64H224a32 32 0 0 1 0-64z"></path><path fill="#474747" d="m237.248 512 265.408 265.344a32 32 0 0 1-45.312 45.312l-288-288a32 32 0 0 1 0-45.312l288-288a32 32 0 1 1 45.312 45.312L237.248 512z"></path></g></svg>`;

  backDiv.addEventListener('click', () => {
    resetAllStyles(map);
  });
  return backDiv;
}

function resetAllStyles(map) {
  map.fitBounds(map.zoomRefLayer.getBounds());
}

export {
  initializeMap,
};
