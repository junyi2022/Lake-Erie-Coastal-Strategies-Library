import { initializeMap } from './map.js';
import { handleMenuBar } from './control.js';

async function readJSON(path) {
  const data = await fetch(path);
  return await data.json();
}

// read files
// reference layers

const dataBoundary = await readJSON('data/data-boundary.json');

const censusTracts = await readJSON('data/census-tract.json');

const county = await readJSON('data/county.json');

const huc10 = await readJSON('data/HUC10.geojson');

const huc12 = await readJSON('data/HUC12.json');

const shorelineBase = await readJSON('data/shoreline-base-to-bridge.geojson');

// working layers

const previousProjects = await readJSON('data/previous-projects.geojson');

// reference layers

window.censusTracts = censusTracts;
window.dataBoundary = dataBoundary;
window.county = county;
window.huc10 = huc10;
window.huc12 = huc12;
window.shorelineBase = shorelineBase;

// working layers
window.previousProjects = previousProjects;

// map for unit generator
// Other maps shouldn't be called here since they are not shown up at the beginning and have display = none
window.map = initializeMap(censusTracts, dataBoundary, huc10, huc12, county, shorelineBase, previousProjects);

// menu bar
handleMenuBar();
