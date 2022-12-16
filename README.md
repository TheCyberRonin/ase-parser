# ase-parser
Parse Aseprite files with Node.js, no external dependencies.

### Install
To install for use:
```
npm i ase-parse
```

## Instructions
You'll probably want to get the Buffer of the Aseprite file in whatever way you feel like. For the example, we'll just use `fs.readFileSync()`. But you can get it from a network request, etc.

```js
const Aseprite = require('ase-parser');
const fs = require('fs');

const buff = fs.readFileSync('./somefile.aseprite');
const aseFile = new Aseprite(buff, 'somefile.aseprite');

aseFile.parse();
console.log(aseFile.numFrames);
```

After parsing, you can get the data and do something like generate an image with the [`sharp`](https://www.npmjs.com/package/sharp) npm lib, which accepts raw pixel data and supports image composition.

Here is a more advanced example generating a `png` image of the first frame using the [`sharp`](https://www.npmjs.com/package/sharp) lib.

```js
const Aseprite = require('ase-parser');
const fs = require('fs');
const sharp = require('sharp');

async function makePNG() {
  const buff = fs.readFileSync('./my_chocobo.aseprite');
  const ase = new Aseprite(buff, 'my_chocobo.aseprite');
  
  ase.parse();
  // Create a blank png image buffer that's the same size as the Aseprite sprite (only make the promise because we'll use Promise.all a little later)
  const bgPromise = sharp({create: {
    width: ase.width,
    height: ase.height,
    channels: 4,
    background: {r: 0, g: 0, b: 0, alpha: 0}
  }}).png().toBuffer();
  
  // Get the cels for the first frame
  const cels = ase.frames[0].cels;
  
  // Create png image buffers per cel to create an image of the first frame (creating the Promises to be used)
  const otherPromises = cels.map(cel => {
    return sharp(cel.rawCelData, {raw: {width: cel.w, height: cel.h, channels: 4}}).png().toBuffer();
  });
  
  // Run the promises all at once to get the buffers for the base image and the cels to combine
  const [ bg, ...others ] = await Promise.all([bgPromise, ...otherPromises]).catch(console.log);
  
  // take the first image and add on the png buffers on top of it (the cels should be in order from bottom to top from the parse)
  const finalBuff = await sharp(bg)
    .composite(others.map((img, index) => ({
      input: img,
      top: cels[index].ypos,
      left: cels[index].xpos
    })))
    .png()
    .toBuffer();
  // saves the file as a png with the buffer from sharp.composite
  fs.writeFileSync(ase.name.replace('.aseprite', '.png'), finalBuff);
}

makePNG();

```

## Aseprite Functions

### `constructor`
Parameters:
 * `buffer`: Expects a Node.js Buffer of the `Aseprite` file.
 * `name`: Expects a string that's the name of the `Aseprite` file, including the extension.

 Returns:
 * `Aseprite`: Returns [Aseprite](#aseprite-object).

 Example:
 ```js
 const Aseprite = require('ase-parser');
 const fs = require('fs');

const buff = fs.readFileSync('./somefile.aseprite');
const aseFile = new Aseprite(buff, 'somefile.aseprite');
```

### `parse`
Description:  
Parses the Aseprite file and populates the `Aseprite` class with the information from the file.

Parameters:
 * none

 Returns:
 * none

Example:
 ```js
const Aseprite = require('ase-parser');
const fs = require('fs');

const buff = fs.readFileSync('./somefile.aseprite');
const aseFile = new Aseprite(buff, 'somefile.aseprite');

aseFile.parse();
```



## Aseprite Object
| Field        | Type                   | Description                            |
|--------------|------------------------|----------------------------------------|
| frames       | array of [frame](#frame-object) objects | frames                                 |
| layers       | array of [layer](#layer-object) objects | layers                                 |
| fileSize     | integer                | size of the file (in bytes)            |
| numFrames    | integer                | number of frames the Aseprite file has |
| width        | integer                | width (in pixels)                      |
| height       | integer                | height (in pixels)                     |
| colorDepth   | integer                | color depth (in bits per pixel)        |
| paletteIndex | integer            | position of the indexed color based on the palette |
| numColors    | integer                | number of colors                       |
| pixelRatio   | string                 | width:height                           |
| name         | string                 | name of the file                       |
| tags         | arry of [tag](#tag-object) objects    | tags                                   |
| colorProfile | [colorProfile](#color-profile-object) object    | Color profile                          |
| palette      | [palette](#palette-object) object         | Palette                                |
| tilesets     | array of [tileset](#tileset-object) objects | Tileset                                |
| slices       | array of [slice](#slice-object) objects | Info on slices |

## Frame Object
| Field         | Type                  | Description      |
|---------------|-----------------------|------------------|
| bytesInFrame  | integer               | size (in bytes)  |
| frameDuration | integer               | duration (in ms) |
| cels          | array of [cel](#cel-object) objects | cels             |

## Layer Object
| Field           | Type    | Description                   |
|-----------------|---------|-------------------------------|
| flags           | integer | flags for the layer           |
| type            | integer | type                          |
| layerChildLevel | integer | layer child level             |
| opacity         | integer | opacity (0-255)               |
| tilesetIndex?   | integer | the tileset id, if applicable |
| name            | string  | name of layer                 |


## Tag Object
| Field         | Type    | Description                            |
|---------------|---------|----------------------------------------|
| from          | integer | first frame index                    |
| to            | integer | last frame index                     |
| animDirection | string  | `Forward`, `Reverse` or `Ping-pong`    |
| color         | string  | hex color of the tag (no `#` included) |
| name          | string  | name                                   |

## Color Profile Object
| Field  | Type    | Description             |
|--------|---------|-------------------------|
| type   | string  | `None`, `sRGB` or `ICC` |
| flag   | integer | fixed gamma flag        |
| fGamma | integer | fixed gamma             |
| icc?   | buffer  | ICC profile data        |

## Palette Object
| Field       | Type                   | Description              |
|-------------|------------------------|--------------------------|
| paletteSize | integer                | number of colors         |
| firstColor  | integer                | index of the first color |
| lastColor   | integer                | index of the last color  |
| colors      | array of [color](#color-object) objects | colors                   |
| index?      | integer                | position of the indexed color based on the palette |

## Tileset Object
| Field           | Type                   | Description                |
|-----------------|------------------------|----------------------------|
| id              | integer                | tileset id number          |
| tileCount       | integer                | number of tiles            |
| tileWidth       | integer                | pixel width of each tile   |
| tileHeight      | integer                | pixel height ofeach tile   |
| name            | string                 | name                       |
| externalFile?   | [tileset external file](#tileset-external-file-object) object | external file linkage info, if applicable |
| rawTilesetData? | Buffer | raw pixel data for tiles, if applicable |

## Tileset External File Object
| Field     | Type    | Description                               |
|-----------|---------|-------------------------------------------|
| id        | integer | id of the external file                   |
| tilesetId | integer | id of the tileset in the external file    |

## Cel Object
| Field            | Type    | Description                                  |
|------------------|---------|----------------------------------------------|
| layerIndex       | integer | index of the layer associated                |
| xpos             | integer | x position of the cel compared to the sprite |
| ypos             | integer | y position of the cel compared to the sprite |
| opacity          | integer | opacity (0-255)                              |
| celType          | integer | internally used                              |
| w                | integer | width (in pixels)                            |
| h                | integer | height (in pixels)                           |
| tilemapMetadata? | [tilemap metadata](#tileset-external-file-object) object | tilemap metadata, if applicable |
| rawCelData       | Buffer  | raw cel pixel data                           |

## Tilemap Metadata Object
| Field                  | Type    | Description                                             |
|------------------------|---------|---------------------------------------------------------|
| bitsPerTile            | integer | number of bits used to represent each tile (usually 32) |
| bitmaskForTileId       | integer | which bit(s) represent the tile ID                      |
| bitmaskForXFlip        | integer | which bit(s) indicate X-axis flip                       |
| bitmaskForYFlip        | integer | which bit(s) indicate Y-axis flip                       |
| bitmaskFor90CWRotation | integer | which bit(s) indicate 90-degree clockwise rotation flip |

## Color Object
| Field | Type    | Description                                   |
|-------|---------|-----------------------------------------------|
| red   | integer | red value (0-255)                             |
| green | integer | green value (0-255)                           |
| blue  | integer | blue value (0-255)                            |
| alpha | integer | alpha value (0-255)                           |
| name  | string  | 'none' or the actual color name if it has one |

## Slice Object
| Field | Type    | Description           |
|-------|---------|-----------------------|
| flags | integer | Flags set             |
| keys  | array of [SliceKey](#slicekey-object) objects | Array of keys and their values |
| name  | string  | Name of the slice |

## SliceKey Object
| Field | Type    | Description       |
|-------|---------|-------------------|
| frameNumber | integer | Frame number that the slice is from |
| x     | integer | X position of the slice |
| y     | integer | Y position of the slice |
| width | integer | Width of the slice |
| height | integer | Height of the slice |
| patch? | [patch](#patch-object) object | Patch info on the slice |
| pivot? | [pivot](#pivot-object) object | Pivot info on the slice |

## Patch Object
| Field | Type    | Description       |
|-------|---------|-------------------|
| x     | integer | X postion of the patch |
| y     | integer | Y position of the patch |
| width | integer | Width of the patch |
| height | integer | Height of the patch |

## Pivot Object
| Field | Type    | Description     |
|-------|---------|-----------------|
| x     | integer | X position of the pivot |
| y     | integer | Y position of the pivot |

# Further Info

If you would like to read up on the Aseprite file spec: [Spec](https://github.com/aseprite/aseprite/blob/master/docs/ase-file-specs.md)