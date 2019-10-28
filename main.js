/******************************************************************************
 *
 * Adobe Max 2019 XD Plugin Demo: Tessellate
 * ----------------------------------------------------------------------------
 *
 * This plugin demonstrates the new Polygon API in addition to the typical
 * scenegraph API commands (adding nodes, moving them around, etc.). There are
 * TWO different versions of tesslation -- one for diamonds (which is a little
 * easier to understand from a mathematical perspective) and one for hexagons
 * (which requires a little more mathematical rigor... but if I could figure it
 * out, so can you!)
 */

//
// first, require in the shapes and fills that we're going to be using
const { Polygon, Color } = require("scenegraph");

//
// grouping shapes comes from the "commands" library instead. There's lots of
// other interesting things in here, but for now, we just want to group all
// the shapes we create together
const { group } = require("commands");

//
// These variables control the number of shapes we create and the visual effect
// created by laying them slightly on top of each other. Modify these to modify
// the look-and-feel of the resulting shape.
//
// Hint: these would be GREAT to turn into a modal dialog or a panel.
///////////////////////////////////////////////////////////////////////////////
const across = 19;                  // # of shapes across
const down = 6;                     // # of shapes down
const size = 125;                   // size of the shape in pixels
const scale = 0.90;                 // 100% = shapes tessellate perfectly.
                                    // Smaller allows overlap; larger allows gaps
const colors = [                    // the brand colors to use
    new Color("A09080"),
    new Color("8090A0"),
    new Color("9080A0")
];

//
// Let's tessellate diamonds first! Tessellating hexagons is the same, but requires
// a little bit more mathematics to figure out the correct spacing.
//
// Incoming parameter: selection -- this lets us add objects in the current edit context.
function tessellateDiamond(selection) {

    // derive height and width from our desired size. In this case, the distance
    // apart is just half the size.
    const height = size;
    const heightApart = height / 2;
    const width = size;
    const widthApart = size / 2;

    // in order to group our diamonds later, we need to keep track of them. This
    // array will do just that.
    const diamonds = [];

    // don't let these FOR loops scare you. All they do is go row by row until
    // we've created the right number of shapes in each row.
    for (let row = 0; row < down; row = row + 1) {
        for (let col = 0; col < across; col = col + 1) {

            // We can determine oddness by taking the column, dividing it by two, and
            // and getting the remainder. A remainder of 1 means that the number was
            // ... ODD! :-)
            const isColOdd = (col % 2);

            // This little thing is just a way to come up with some alternating
            // colors. You can do all sorts of things here, as lont as we condense
            // it to three values (with the modulo 3).
            const alternate = (row * across + col) % 3;

            // Given the column, figure out where this shape should be placed on
            // the horizontal axis.
            const x = (col * widthApart) * scale;
            // We want the diamonds to fit nicely together, so for the vertical
            // axis, we need to alternate the top position of each diamond.
            const y = ((row * height) + (isColOdd * heightApart)) * scale;

            // create a diamond shape
            const diamond = new Polygon();
            diamond.cornerCount = 4;               // 4 here creates a diamond shape
            diamond.width = width;
            diamond.height = height;
            diamond.stroke = null;
            diamond.fill = colors[alternate];      // fill with one of our brand colors
            diamond.opacity = 0.5;                 // transparent, so overlaps create more colors

            // add the diamond to the document in the same context as the current
            // selection
            selection.insertionParent.addChild(diamond);

            // move the new shape to the desired location
            diamond.moveInParentCoordinates(x, y);

            // keep track of this new diamond by adding it to the array of diamonds
            diamonds.push(diamond);
        }
    }

    // return the list of diamonds we've created.
    return diamonds;
}

//
// Tessellating hexagons yields a really cool result, but takes a little bit more math
// because the distance they should be apart isn't exactly half the size. We have to
// use a little geometry to figure out the real distance, which, while not difficult, is
// not easy either.
//
// The rest of the code is identical to the above, so we've left comments out where they
// would be duplication.
//
// Incoming parameter: selection -- this lets us add objects in the current edit context.
function tessellateHexagon(selection) {

    // Ok. Time for some maths.
    //
    // The incoming size is the desired height of the shape -- for a hexagon to loop
    // equal-sized, the width has to be increased. That's not hard -- XD would
    // normally take care of that for us. Since we're building the hexagon ourselves,
    // though, we need to calculate the correct width and necessary distance for
    // tessellation.
    //
    // First, we calculate the length of a line in our perfect hexagon. This can be
    // derived by using some geometry. Remember that we can calculate any side of
    // a right-angle triangle if we know two lengths. Remember Pythagorean's theorem?
    //
    //      ##
    //      ####
    //   a  ##  ##  c         c² = a² + b²
    //      ##    ##
    //      ##########
    //          b
    //
    // But we only have one value -- that of "a" -- the height of the hexagon, which
    // is "size / 2". How do we figure out "b" (what we want -- the line length),
    // and "c"?
    //
    // It turns out, you can derive "c" because we know that the hexagon is an
    // equilateral hexagon. As such, there are 360°, and we can divide that by
    // six. (Think of a hexagon as a strangely-shaped pizza having six slices.)
    //
    // This tells us that if we drew a line from the center, 60°s off the other, we'd
    // end up at the other end of the line. Okay, we're getting there... but how
    // does this in any way give us the actual length?
    //
    // So it turns out that if you divide "a" by TANGENT(60°), you'll find "b" --
    // (The 60° here comes frome above -- 360/6).
    //
    // Now, this is easily written using some mathematical symbols:
    //
    //                                a
    //         line-length = 2 * ----------
    //                            tan(60°)
    //
    // In JavaScript, that takes a little bit more work... In the line below remember
    // that:
    //
    // * (size / 2) is "a"
    // * 60 * Math.PI / 180 is how one converts from degress to radians. JavaScript
    //   uses radians to express angles.
    //
    // At this point the line below should make sense...
    const lineLength = (size / 2) / Math.tan(60 * Math.PI / 180) * 2;
    const height = size;
    const heightApart = height / 2;
    const width = lineLength * 2;

    // For a hexagon, the width apart to ensure tessellation is not twice the line
    // length, but actually one and a half times the line length. You can see this
    // by imagining a hexagon with equal sides, sitting on one of its edges. The
    // bottom edge is eactly the length of the line we just calculated. The two
    // lines next to it, however, happen to be at an angle. It happens that to fit
    // perfectly, we only want to consider one side of the hexagon, so we multiply
    // by 1.5 instead of 2 (which would be an interesting pattern, but not quite
    // what we want).
    const widthApart = lineLength * 1.5;

    // from here on, everything is identical to the diamond tessellation, except for variable names
    const hexagons = [];

    for (let row = 0; row < down; row = row + 1) {
        for (let col = 0; col < across; col = col + 1) {
            const isColOdd = (col % 2);
            const alternate = (row * across + col) % 3;
            const x = (col * widthApart) * scale;
            const y = ((row * height) + (isColOdd * heightApart)) * scale;

            const hexagon = new Polygon();
            hexagon.cornerCount = 6;
            hexagon.width = width;
            hexagon.height = height;
            hexagon.stroke = null;
            hexagon.fill = colors[alternate];
            hexagon.opacity = 0.5;

            selection.insertionParent.addChild(hexagon);
            hexagon.moveInParentCoordinates(x, y);

            hexagons.push(hexagon);
        }
    }

    return hexagons;
}

//
// This function is a little utility function that takes the shapes created by
// one of the above tessellations and groups them together for the user.
function makeAndGroup(whichShape, selection) {
    selection.items = whichShape(selection);
    group();
}

module.exports = {
    commands: {
        tessellateDiamond: selection => makeAndGroup(tessellateDiamond, selection),
        tessellateHexagon: selection => makeAndGroup(tessellateHexagon, selection)
    }
};
