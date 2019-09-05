# ase-parser
Parse Aseprite files with Node.js, no external dependencies


## `Aseprite` props
| Field        | Type                   | Description                            |
|--------------|------------------------|----------------------------------------|
| frames       | array of frame objects | frames                                 |
| fileSize     | integer                | size of the file (in bytes)            |
| numFrames    | integer                | number of frames the Aseprite file has |
| width        | integer                | width (in pixels)                      |
| height       | integer                | height (in pixels)                     |
| colorDepth   | integer                | color depth (in bits per pixel)        |
| numColors    | integer                | number of colors                       |
| pixelRatio   | string                 | width:height                           |
| name         | string                 | name of the file                       |
| tags         | arry of tag objects    | tags                                   |
| colorProfile | colorProfile object    | Color profile                          |
| palette      | palette object         | Palette                                |