Phaser has an issue with bleed around the edges of tiles.
To solve this we need to use a program to "extrude" the border pixels. The program we're using is: https://github.com/sporadic-labs/tile-extruder

1. Install it globally
1. Run the CLI with the extrusion of 8 pixels. This effectively adds a 8 px border around every tile.
1. When creating a TileSet in Tiled, select the extruded image and use `8px` for "margin" and `16px` for "spacing" to account for the extruded border
1. Make sure in the phaser we load the extruded image as a tilesheet not the original image (since we have to load the image separately in Phaser).
