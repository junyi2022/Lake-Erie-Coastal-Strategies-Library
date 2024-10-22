// handle menu bar dynamics

// get all the buttons
const existingProjectButton = document.querySelector('.existing-projects-menu');
const strategyLibraryButton = document.querySelector('.strategy-library-menu');

const menuBlock = document.querySelector('.menu-block');


// get all divs
const existingProjectDiv = document.querySelector('#previous-project-body');
const strategyLibraryDiv = document.querySelector('#strategy-library-body');

// get footer div
const footer = document.querySelector('.footer');


const menuAll = [existingProjectDiv, strategyLibraryDiv];

// let hasNotClickedSimilarAreaButton = true;

// create a function to handle menu bar situation

function handleMenuDisplay(select) {
  for (const item of menuAll) {
    if (item != select) {
      item.style.display = 'none';
    }
  }
  // different div has different display method
  select == existingProjectDiv ? select.style.display = 'flex' : select.style.display = 'block';
}

function handleFooter(select) {
  select == strategyLibraryDiv ? footer.style.display = 'none' : footer.style.display = 'block';
}

function manipulateMenu(select, width) {
  menuBlock.style.left = width;
  handleMenuDisplay(select);
  handleFooter(select);
}

function handleMenuBar() {
  existingProjectButton.addEventListener('click', () => {
    manipulateMenu(existingProjectDiv, 0);
  });

  strategyLibraryButton.addEventListener('click', () => {
    manipulateMenu(strategyLibraryDiv, '150px');
    // initialize map here when display is not none, map cannot show up correctly if it is initially hidden
    // only need to initialize the map once
    // if (hasNotClickedSimilarAreaButton) {
    //   window.map2 = initializeSimilarAreaMap(censusTracts, dataBoundary, huc10, huc12, shorelineBase, county, sendimentBudget);
    //   hasNotClickedSimilarAreaButton = false;
    // }
  });
}

export {
  handleMenuBar,
};
