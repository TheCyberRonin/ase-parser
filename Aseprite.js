const zlib = require('zlib');

/**
 * Aseprite Class to consume an Aseprite file and get information from it
 */
class Aseprite {
  constructor(buffer, name) {
    this._offset = 0;
    this._buffer = buffer;
    this.frames = [];
    this.layers = [];
    this.slices = [];
    this.fileSize;
    this.numFrames;
    this.width;
    this.height;
    this.colorDepth;
    this.paletteIndex;
    this.numColors;
    this.pixelRatio;
    this.name = name;
    this.tags = [];
    this.tilesets = [];
  }

  /**
   * Reads the next byte (8-bit unsigned) value in the buffer
   *
   * @returns {number}
   */
  readNextByte() {
    const nextByte = this._buffer.readUInt8(this._offset);
    this._offset += 1;
    return nextByte;
  }

  /**
   * Reads a byte (8-bit unsigned) value in the buffer at a specific location
   *
   * @param {number} offset - Offset location in the buffer
   * @returns {number}
   */
  readByte(offset) {
    return this._buffer.readUInt8(offset);
  }

  /**
   * Reads the next word (16-bit unsigned) value in the buffer
   *
   * @returns {number}
   */
  readNextWord() {
    const word = this._buffer.readUInt16LE(this._offset);
    this._offset += 2;
    return word;
  }

  /**
   * Reads a word (16-bit unsigned) value at a specific location
   *
   * @param {number} offset - Offset location in the buffer
   * @returns {number}
   */
  readWord(offset) {
    return this._buffer.readUInt16LE(offset);
  }

  /**
   * Reads the next short (16-bit signed) value in the buffer
   *
   * @returns {number}
   */
  readNextShort() {
    const short = this._buffer.readInt16LE(this._offset);
    this._offset += 2;
    return short;
  }

  /**
   * Reads a short (16-bit signed) value at a specific location
   *
   * @param {number} offset - Offset location in the buffer
   * @returns {number}
   */
  readShort(offset) {
    return this._buffer.readInt16LE(offset);
  }

  /**
   * Reads the next DWord (32-bit unsigned) value from the buffer
   *
   * @returns {number}
   */
  readNextDWord() {
    const dWord = this._buffer.readUInt32LE(this._offset);
    this._offset += 4;
    return dWord;
  }

  /**
   * Reads a DWord (32-bit unsigned) value at a specific location
   *
   * @param {number} offset - Offset location in the buffer
   * @returns {number}
   */
  readDWord(offset) {
    return this._buffer.readUInt32LE(offset);
  }

  /**
   * Reads the next long (32-bit signed) value from the buffer
   *
   * @returns {number}
   */
  readNextLong() {
    const long = this._buffer.readInt32LE(this._offset);
    this._offset += 4;
    return long;
  }

  /**
   * Reads a long (32-bit signed) value at a specific location
   *
   * @param {number} offset - Offset location in the buffer
   * @returns {number}
   */
  readLong(offset) {
    return this._buffer.readInt32LE(offset);
  }

  /**
   * Reads the next fixed (32-bit fixed point 16.16) value from the buffer
   *
   * @returns {number}
   */
  readNextFixed() {
    const fixed = this._buffer.readFloatLE(this._offset);
    this._offset += 4;
    return fixed;
  }

  /**
   * Reads a fixed (32-bit fixed point 16.16) value at a specific location
   * @param {number} offset - Offset location in the buffer
   * @returns {number}
   */
  readFixed(offset) {
    return this._buffer.readFloatLE(offset);
  }

  /**
   * Reads the next numBytes bytes and creates a string from the buffer
   *
   * @param {number} numBytes - Number of bytes to read
   * @returns {string}
   */
  readNextBytes(numBytes) {
    let strBuff = Buffer.alloc(numBytes);
    for (let i = 0; i < numBytes; i++) {
      strBuff.writeUInt8(this.readNextByte(), i);
    }
    return strBuff.toString();
  }

  /**
   * Copy the next numBytes bytes of the buffer into a new buffer
   *
   * @param {number} numBytes - Number of bytes to read
   * @returns {Buffer}
   */
  readNextRawBytes(numBytes) {
    let buff = Buffer.alloc(numBytes);
    for (let i = 0; i < numBytes; i++) {
      buff.writeUInt8(this.readNextByte(), i);
    }
    return buff;
  }

  /**
   * Create a new buffer with numBytes size, offset by a value, from a buffer
   *
   * @param {number} numBytes - Number of bytes to read
   * @param {Buffer} b - Buffer to read from
   * @param {number} offset - Offset value to start reading from
   * @returns {Buffer}
   */
  readRawBytes(numBytes, b, offset) {
    let buff = Buffer.alloc(numBytes - offset);
    for (let i = 0; i < numBytes - offset; i++) {
      buff.writeUInt8(b.readUInt8(offset + i), i);
    }
    return buff;
  }

  /**
   * Reads the next word to get the length of the string, then reads the string
   * and returns it
   *
   * @returns {string}
   */
  readNextString() {
    const numBytes = this.readNextWord();
    return this.readNextBytes(numBytes);
  }

  /**
   * Skips a number of bytes in the buffer
   *
   * @param {number} numBytes - Number of bytes to skip
   */
  skipBytes(numBytes) {
    this._offset += numBytes;
  }

  /**
   * Reads the 128-byte header of an Aseprite file and stores the information
   *
   * @returns {number} Number of frames in the file
   */
  readHeader() {
    this.fileSize = this.readNextDWord();
    // Consume the next word (16-bit unsigned) value in the buffer
    // to skip the "Magic number" (0xA5E0)
    this.readNextWord();
    this.numFrames = this.readNextWord();
    this.width = this.readNextWord();
    this.height = this.readNextWord();
    this.colorDepth = this.readNextWord();
    /**
     * Skip 14 bytes to account for:
     *  Dword - Layer opacity flag
     *  Word - deprecated speed (ms) between frame
     *  Dword - 0 value
     *  Dword - 0 value
     */
    this.skipBytes(14);
    this.paletteIndex = this.readNextByte();
    // Skip 3 bytes for empty data
    this.skipBytes(3);
    this.numColors = this.readNextWord();
    const pixW = this.readNextByte();
    const pixH = this.readNextByte();
    this.pixelRatio = `${pixW}:${pixH}`;
    /**
     * Skip 92 bytes to account for:
     *  Short - X position of the grid
     *  Short - Y position of the grid
     *  Word - Grid width
     *  Word - Grid height, defaults to 0 if there is no grid
     *  (Defaults to 16x16 if there is no grid size)
     *  Last 84 bytes is set to 0 for future use
     */
    this.skipBytes(92);
    return this.numFrames;
  }

  /**
   * Reads a frame and stores the information
   */
  readFrame() {
    const bytesInFrame = this.readNextDWord();
    // skip bytes for the magic number (0xF1FA)
    // TODO: Add a check in to make sure the magic number is correct
    // (this should help to make sure we're doing what we're supposed to)
    this.skipBytes(2);
    // TODO Use the old chunk of data if `newChunk` is 0
    const oldChunk = this.readNextWord();
    const frameDuration = this.readNextWord();
    // Skip 2 bytes that are reserved for future use
    this.skipBytes(2);
    const newChunk = this.readNextDWord();
    let cels = [];
    for(let i = 0; i < newChunk; i ++) {
      let chunkData = this.readChunk();
      switch(chunkData.type) {
        case 0x0004:
        case 0x0011:
        case 0x2016:
        case 0x2017:
        case 0x2020:
          this.skipBytes(chunkData.chunkSize - 6);
          break;
        case 0x2022:
          this.readSliceChunk();
          break;
        case 0x2004:
          this.readLayerChunk();
          break;
        case 0x2005:
          let celData = this.readCelChunk(chunkData.chunkSize);
          cels.push(celData);
          break;
        case 0x2007:
          this.readColorProfileChunk();
          break;
        case 0x2018:
          this.readFrameTagsChunk();
          break;
        case 0x2019:
          this.palette = this.readPaletteChunk();
          break;
        case 0x2023:
          this.tilesets.push(this.readTilesetChunk());
          break;
        default: // ignore unknown chunk types
          this.skipBytes(chunkData.chunkSize - 6);
      }
    }
    this.frames.push({ bytesInFrame,
      frameDuration,
      numChunks: newChunk,
      cels});
  }

  /**
   * Reads the Color Profile Chunk and stores the information
   * Color Profile Chunk is type 0x2007
   */
  readColorProfileChunk() {
    const types = [
      'None',
      'sRGB',
      'ICC'
    ]
    const typeInd = this.readNextWord();
    const type = types[typeInd];
    const flag = this.readNextWord();
    const fGamma = this.readNextFixed();
    this.skipBytes(8);
    if (typeInd === 2) {
      //TODO: Handle ICC profile data properly instead of skipping
      const skip = this.readNextDWord();
      this.skipBytes(skip);
    }
    this.colorProfile = {
      type,
      flag,
      fGamma};
  }

  /**
   * Reads the Tags Chunk and stores the information
   * Tags Cunk is type 0x2018
   */
  readFrameTagsChunk() {
    const loops = [
      'Forward',
      'Reverse',
      'Ping-pong',
      'Ping-pong Reverse'
    ]
    const numTags = this.readNextWord();
    this.skipBytes(8);
    for(let i = 0; i < numTags; i ++) {
      let tag = {};
      tag.from = this.readNextWord();
      tag.to = this.readNextWord();
      const loopsInd = this.readNextByte();
      tag.animDirection = loops[loopsInd];
      tag.repeat = this.readNextWord();
      this.skipBytes(6);
      tag.color = this.readNextRawBytes(3).toString('hex');
      this.skipBytes(1);
      tag.name = this.readNextString();
      this.tags.push(tag);
    }
  }

  /**
   * Reads the Palette Chunk and stores the information
   * Palette Chunk is type 0x2019
   *
   * @returns {Palette}
   */
  readPaletteChunk() {
    const paletteSize = this.readNextDWord();
    const firstColor = this.readNextDWord();
    const secondColor = this.readNextDWord();
    this.skipBytes(8);
    let colors = [];
    for (let i = 0; i < paletteSize; i++) {
      let flag = this.readNextWord();
      let red = this.readNextByte();
      let green = this.readNextByte();
      let blue = this.readNextByte();
      let alpha = this.readNextByte();
      let name;
      if (flag === 1) {
        name = this.readNextString();
      }
      colors.push({
        red,
        green,
        blue,
        alpha,
        name: name !== undefined ? name : "none"
      });
    }
    let palette = {
      paletteSize,
      firstColor,
      lastColor: secondColor,
      colors
    }
    this.colorDepth === 8 ? palette.index = this.paletteIndex : '';
    return palette;
  }

  /**
   * Reads the Tileset Chunk and stores the information
   * Tileset Chunk is type 0x2023
   */
  readTilesetChunk() {
    const id = this.readNextDWord();
    const flags = this.readNextDWord();
    const tileCount = this.readNextDWord();
    const tileWidth = this.readNextWord();
    const tileHeight = this.readNextWord();
    this.skipBytes(16);
    const name = this.readNextString();
    const tileset = {
      id,
      tileCount,
      tileWidth,
      tileHeight,
      name };
    if ((flags & 1) !== 0) {
      tileset.externalFile = {}
      tileset.externalFile.id = this.readNextDWord();
      tileset.externalFile.tilesetId = this.readNextDWord();
    }
    if ((flags & 2) !== 0) {
      const dataLength = this.readNextDWord();
      const buff = this.readNextRawBytes(dataLength);
      tileset.rawTilesetData = zlib.inflateSync(buff);
    }
    return tileset;
  }

  /**
   * Reads the Slice Chunk and stores the information
   * Slice Chunk is type 0x2022
   */
  readSliceChunk() {
    const numSliceKeys = this.readNextDWord();
    const flags = this.readNextDWord();
    this.skipBytes(4);
    const name = this.readNextString();
    const keys = [];
    for(let i = 0; i < numSliceKeys; i ++) {
      const frameNumber = this.readNextDWord();
      const x = this.readNextLong();
      const y = this.readNextLong();
      const width = this.readNextDWord();
      const height = this.readNextDWord();
      const key = { frameNumber, x, y, width, height };
      if((flags & 1) !== 0) {
        key.patch = this.readSlicePatchChunk();
      }
      if((flags & 2) !== 0) {
        key.pivot = this.readSlicePivotChunk();
      }
      keys.push(key);
    }
    this.slices.push({ flags, name, keys });
  }

  /**
   * Reads the Patch portion of a Slice Chunk
   *
   * @returns {Object} patch - Patch information that was in the chunk
   * @returns {number} patch.x - Patch X location
   * @returns {number} patch.y - Patch Y location
   * @returns {number} patch.width - Patch width
   * @returns {number} patch.height - Patch height
   */
  readSlicePatchChunk() {
    const x = this.readNextLong();
    const y = this.readNextLong();
    const width = this.readNextDWord();
    const height = this.readNextDWord();
    return { x, y, width, height };
  }

  /**
   * Reads the Pivot portion of a Slice Chunk
   *
   * @returns {Object} pivot - Pivot information that was in the chunk
   * @returns {number} pivot.x - Pivot X location
   * @returns {number} pivot.y - Pivot Y location
   */
  readSlicePivotChunk() {
    const x = this.readNextLong();
    const y = this.readNextLong();
    return { x, y };
  }

  /**
   * Reads the Layer Chunk and stores the information
   * Layer Chunk is type 0x2004
   */
  readLayerChunk() {
    const layer = {}
    layer.flags = this.readNextWord();
    layer.type = this.readNextWord();
    layer.layerChildLevel = this.readNextWord();
    this.skipBytes(4);
    layer.blendMode = this.readNextWord();
    layer.opacity = this.readNextByte();
    this.skipBytes(3);
    layer.name = this.readNextString();
    if (layer.type == 2) {
      layer.tilesetIndex =this.readNextDWord()
    }
    this.layers.push(layer);
  }

  /**
   * Reads a Cel Chunk in its entirety and returns the information
   * Cel Chunk is type 0x2005
   *
   * @param {number} chunkSize - Size of the Cel Chunk to read
   * @returns {Object} Cel information
   */
  readCelChunk(chunkSize) {
    const layerIndex = this.readNextWord();
    const x = this.readNextShort();
    const y = this.readNextShort();
    const opacity = this.readNextByte();
    const celType = this.readNextWord();
    this.skipBytes(7);
    if (celType === 1) {
      return {
        layerIndex,
        xpos: x,
        ypos: y,
        opacity,
        celType,
        w: 0,
        h: 0,
        rawCelData: undefined,
        link: this.readNextWord()
      };
    }
    const w = this.readNextWord();
    const h = this.readNextWord();
    const chunkBase = { layerIndex, xpos: x, ypos: y, opacity, celType, w, h };
    if (celType === 0 || celType === 2) {
      const buff = this.readNextRawBytes(chunkSize - 26); // take the first 20 bytes off for the data above and chunk info
      return {
        ...chunkBase,
        rawCelData: celType === 2 ? zlib.inflateSync(buff) : buff
      }
    }
    if (celType === 3) {
      return { ...chunkBase, ...this.readTilemapCelChunk(chunkSize) }
    }
  }
  readTilemapCelChunk(chunkSize) {
    const bitsPerTile = this.readNextWord();
    const bitmaskForTileId = this.readNextDWord();
    const bitmaskForXFlip = this.readNextDWord();
    const bitmaskForYFlip = this.readNextDWord();
    const bitmaskFor90CWRotation = this.readNextDWord();
    this.skipBytes(10);
    const buff = this.readNextRawBytes(chunkSize - 54);
    const rawCelData = zlib.inflateSync(buff);
    const tilemapMetadata = {
      bitsPerTile,
      bitmaskForTileId,
      bitmaskForXFlip,
      bitmaskForYFlip,
      bitmaskFor90CWRotation };
    return { tilemapMetadata, rawCelData };
  }

  /**
   * Reads the next Chunk Info block to get how large and what type the next Chunk is
   *
   * @returns {Object} chunkInfo
   * @returns {number} chunkInfo.chunkSize - The size of the Chunk read
   * @returns {number} chunkInfo.type - The type of the Chunk
   */
  readChunk() {
    const cSize = this.readNextDWord();
    const type = this.readNextWord();
    return {chunkSize: cSize, type: type};
  }

  /**
   * Processes the Aseprite file and stores the information
   */
  parse() {
    const numFrames = this.readHeader();
    for(let i = 0; i < numFrames; i ++) {
      this.readFrame();
    }
    for(let i = 0; i < numFrames; i ++) {
      for (let j = 0; j < this.frames[i].cels.length; j++) {
        const cel = this.frames[i].cels[j];
        if (cel.celType === 1) {
          for (let k = 0; k < this.frames[cel.link].cels.length; k++) {
            const srcCel = this.frames[cel.link].cels[k];
            if (srcCel.layerIndex === cel.layerIndex) {
              cel.w = srcCel.w;
              cel.h = srcCel.h;
              cel.rawCelData = srcCel.rawCelData;
            }
            if (cel.rawCelData) {
              break;
            }
          }
        }
      }
    }
  }

  /**
   * Converts an amount of Bytes to a human readable format
   *
   * @param {number} bytes - Bytes to format
   * @param {number} decimals - Number of decimals to format the number to
   * @returns {string} - Amount of Bytes formatted in a more human readable format
   */
  formatBytes(bytes,decimals) {
    if (bytes === 0) {
      return '0 Byte';
    }
    const k = 1024;
    const dm = decimals + 1 || 3;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  /**
   * Attempts to return the data in a string format
   *
   * @returns {string}
   */
  toJSON() {
    return {
      fileSize: this.fileSize,
      numFrames: this.numFrames,
      frames: this.frames.map(frame => {
        return {
          size: frame.bytesInFrame,
          duration: frame.frameDuration,
          chunks: frame.numChunks,
          cels: frame.cels.map(cel => {
            return {
              layerIndex: cel.layerIndex,
              xpos: cel.xpos,
              ypos: cel.ypos,
              opacity: cel.opacity,
              celType: cel.celType,
              w: cel.w,
              h: cel.h,
              rawCelData: 'buffer'
            }
          }) }
      }),
      palette: this.palette,
      tilesets: this.tilesets,
      width: this.width,
      height: this.height,
      colorDepth: this.colorDepth,
      numColors: this.numColors,
      pixelRatio: this.pixelRatio,
      layers: this.layers,
      slices: this.slices
    };
  }
}

module.exports = Aseprite;
