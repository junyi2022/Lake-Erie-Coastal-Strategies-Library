/* globals turf */
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

// color scale for project categories
// more info at: https://d3js.org/d3-interpolate/color#interpolateRgb
const colorScale = d3.interpolateRgbBasis(['rgb(140, 152, 255)', 'rgb(154, 220, 255)', 'rgb(186, 249, 183)', 'rgb(255, 211, 153)', 'rgb(255, 155, 144)']);
window.colorScale = colorScale;

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

// project category style

const categoryStyle = {
  'Habitat Protection': 0,
  'Habitat Creation': 0.12,
  'Sediment Control': 0.24,
  'Erosion Control': 0.36,
  'Species Protection': 0.48,
  'Water Quality': 0.6,
  'Flood Control': 0.72,
  'Recreation and Access': 1,
};

// map

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
  const zoomRef = turf.buffer(dataBoundary, 2);
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

  // add previous projects

  map.projectLayer = L.geoJSON(previousProjects,
    {style: calProjectStyle,
      pointToLayer: (projects, latlng) => L.circleMarker(latlng), // just type latlng or any names and leaflet know how to find goejson's coordinate
      // Can also do the latlng manually, remember to flip the lon lat (leaflet and geojson read it in the opposite way)
      // pointToLayer: (parks) => L.circleMarker([parks.geometry.coordinates[1], parks.geometry.coordinates[0]]),
    }).bindTooltip((l) => {
    return `<p class="project-tooltip"><strong>Name:</strong> ${l.feature.properties.name}</p>`;
  }).bindPopup((l) => {
    return handlePopupContent(l);
  }, {maxWidth: handlePopupWidth()});


  map.projectLayer.addTo(map);

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

// project layer style

function calProjectStyle(projects) {
  const category = projects.properties.type[0];
  const catColor = colorScale(categoryStyle[category]);
  return {
    radius: 8,
    fillColor: catColor,
    color: catColor,
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8,
  };
}

// Popup related dynamics

function handlePopupWidth() {
  const screenWidth = window.innerWidth;
  return screenWidth * 0.6;
}

function handlePopupContent(l) {
  const popDiv = document.createElement('div'); // abstract html div tag
  popDiv.classList.add('popup-all-wrapper'); // div class
  popDiv.innerHTML = `<h3 class="pop-title"><a href=${l.feature.properties.link[0]} target="_blank">${l.feature.properties.name}</a></h3>`; // add html content

  // div for info and image
  const popContent = document.createElement('div');
  popContent.classList.add('popup-info-warp');

  // div for info list on the left
  const popInfoDiv = document.createElement('div');
  popInfoDiv.classList.add('pop-info');
  const infoHtml = `
    <p class="pop-content"><strong>Start Time:</strong> ${l.feature.properties.startTime}</p>
    <p class="pop-content"><strong>End Time:</strong> ${l.feature.properties.endTime}</p>
    <p class="pop-content"><strong>Location:</strong> ${l.feature.properties.location}</p>
    <p class="pop-content"><strong>Funding:</strong> ${l.feature.properties.funding}</p>
    <p class="pop-content"><strong>Recipient:</strong> ${l.feature.properties.recipients}</p>
    <p class="pop-content"><strong>Project Type:</strong> ${l.feature.properties.type}</p>
  `;

  popInfoDiv.innerHTML = infoHtml;

  popContent.appendChild(popInfoDiv);

  // Create and append image element when there are images
  if (l.feature.properties.image !== undefined) {
    const imageElement = document.createElement('img');
    imageElement.classList.add('pop-img');
    imageElement.src = l.feature.properties.image;
    popContent.appendChild(imageElement);
  }

  popDiv.appendChild(popContent);

  // Create and append the description paragraph at the end
  const descriptionParagraph = document.createElement('p');
  descriptionParagraph.classList.add('pop-content');
  descriptionParagraph.innerHTML = `<strong>Description:</strong> ${l.feature.properties.description}`;
  popDiv.appendChild(descriptionParagraph);

  return popDiv.outerHTML; // output as html string instead of object
}

// legend style

// function legend1Style(map, colorScale, divname) {
//   const legendDiv = document.createElement('div'); // abstract html div tag
//   legendDiv.classList.add('legend'); // div class
//   legendDiv.innerHTML = '<h4 class="legendTitle">Legend</h4>'; // add html content

//   const legendContent = document.createElement('div'); // abstract html div tag
//   legendContent.classList.add(divname); // div class

//   // create a new div to hold unit legend
//   const unitColorLegendDiv = document.createElement('div');
//   unitColorLegendDiv.classList.add('unit-legend');
//   let html = `
//     <strong><p>Group Number</p></strong>
//     <div class="catWrapper">
//   `;

//   for (let i = 0; i < numvalues; i++) {
//     html += `
//     <div class="colorTextPair">
//     <div class="catColorBox" style="background-color: ${ColorScale(catColor)}"></div>
//     <p class="catText">Group ${i+1}</p>
//     </div>
//     `;
//   }

//   html += '</div>'; // Close the wrapper
//   unitColorLegendDiv.innerHTML = html;

//   legendContent.appendChild(unitColorLegendDiv);
// }

export {
  initializeMap,
};
