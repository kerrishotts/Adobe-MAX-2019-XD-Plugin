/******************************************************************************
 *
 * Adobe Max 2019 XD Plugin Demo: Tessellate
 * ----------------------------------------------------------------------------
 *
 * This plugin demonstrates the new Polygon API in addition to the typical
 * scenegraph API commands (adding nodes, moving them around, etc.).
 */

//
// first, require in the shapes and fills that we're going to be using
const { Polygon, Color } = require("scenegraph");

//
// grouping and duplication of shapes requires us to import these
// commands from XD's libraries
const { duplicate, group } = require("commands");

//
// These variables control the number of shapes we create and the visual effect
// created by laying them slightly on top of each other. Modify these to modify
// the look-and-feel of the resulting shape.
//
// Hint: these would be GREAT to turn into a modal dialog or a panel.
///////////////////////////////////////////////////////////////////////////////
const across = 8;                   // # of shapes across
const down = 12;                    // # of shapes down
const size = 125;                   // size of the shape in pixels
const scale = 0.90;                 // 100% = shapes tessellate perfectly.
                                    // Smaller allows overlap; larger allows gaps
const colors = [                    // the brand colors to use
    new Color("A09080"),
    new Color("8090A0"),
    new Color("9080A0")
];

//
// This function takes a list of colors and will return a new color
// from the list, going through the list in order. When it reaches
// the end, it'll start back from the start of the list.
function *generateColors(colors) {
    while (true) {
        for (let color of colors) {
            yield color;
        }
    }
}

function tessellateHexagon(selection) {

    // create our first hexagon -- this serves as our "stamp"
    // and we'll clone it as needed for the rest of the hexagons
    let hexagon = new Polygon();
    hexagon.cornerCount = 4;   // setting to four first ensures
    hexagon.width = size;      // that we can get a hexagon
    hexagon.height = size;     // with equal line lengths when
    hexagon.cornerCount = 6;   // we do this!
    hexagon.stroke = null;     // no stroke
    hexagon.opacity = 0.5;     // partially transparent

    // add it to the document
    selection.insertionParent.addChild(hexagon);

    // space our hexagons appropriately so that they tesselate
    // correctly. This means twice the height and three-quarters
    // the width.
    const heightApart = hexagon.height / 2;
    const widthApart = hexagon.width * 0.75;

    // we want to store all the hexagons for later so that we
    // can select them all for the user and group them.
    const hexagons = [];

    // We can generate multiple colors for each hexagon.
    const colorGenerator = generateColors(colors);

    let x = 0;                 // horizontal position
    let y = 0;                 // vertical position
    let count = 0;             // count of hexagons
    let indent = false;        // if true, we need to indent
                               // so that we tessellate
                               // correctly.
    // repeat our hexagon the right number of times...
    while (count < across * down) {

        // pick a new color
        hexagon.fill = colorGenerator.next().value;

        // move the hexagon to the desired location
        // (we multiple by scale to get some interesting
        // translucency visuals)
        hexagon.placeInParentCoordinates(
            {x: 0, y: 0},
            {x: x * scale, y: y * scale});

        // add this hexagon to the list of hexagons to
        // group later on
        hexagons.push(hexagon);

        // select this new hexagon
        selection.items = [ hexagon ];
        duplicate();           // duplicate the hexagon

        // next time around we'll start working with the
        // cloned hexagon
        hexagon = selection.items[0];

        // homework: increment the count so we don't loop
        // infinitely (XD would hang... not good for you!)
        count = count + 1;

        // move over horizontally
        x = x + (widthApart * 2);

        // if we're at the end of a row, we need to go back
        // to the start and indent if needed.
        if (count % across === 0) {
            indent = !indent;  // toggle the indent flag
            x = indent
                ? widthApart   // if indenting, start "widthapart" from the left
                : 0;           // if not, start at the left

            // and add to our vertical position
            y = y + heightApart;
        }

        // back to the top of the while loop!
    }

    // remove last hexagon; we don't need it
    hexagon.removeFromParent();

    // and group them all
    selection.items = hexagons;
    group();
}

// this function is here just to show how easy it is
// to create a simple hexagon.
function createHexagon(selection) {
    const hexagon = new Polygon();
    hexagon.cornerCount = 4
    hexagon.width = 100;
    hexagon.height = 100;
    hexagon.cornerCount = 6;
    hexagon.stroke = null;
    hexagon.fill = new Color("blue");
    hexagon.opacity = 0.5;

    selection.insertionParent.addChild(hexagon);
}

module.exports = {
    commands: {
        createHexagon,
        tessellateHexagon
    }
};
