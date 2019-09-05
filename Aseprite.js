const zlib = require('zlib');

class Aseprite {
  constructor(buffer, name) {
    this._offset = 0;
    this._buffer = buffer;
    this.frames = [];
    this.layers = [];
    this.fileSize;
    this.numFrames;
    this.width;
    this.height;
    this.colorDepth;
    this.numColors;
    this.pixelRatio;
    this.name = name;
    this.tags = [];
  }
  readNextByte() {
    const nextByte = this._buffer.readUInt8(this._offset);
    this._offset += 1;
    return nextByte;
  }
  readByte(offset) {
    return this._buffer.readUInt8(offset);
  }
  readNextWord() {
    const word = this._buffer.readUInt16LE(this._offset);
    this._offset += 2;
    return word;
  }
  readWord(offset) {
    return this._buffer.readUInt16LE(offset);
  }
  readNextShort() {
    const short = this._buffer.readInt16LE(this._offset);
    this._offset += 2;
    return short;
  }
  readShort(offset) {
    return this._buffer.readInt16LE(offset);
  }
  readNextDWord() {
    const dWord = this._buffer.readUInt32LE(this._offset);
    this._offset += 4;
    return dWord;
  }
  readDWord(offset) {
    return this._buffer.readUInt32LE(offset);
  }
  readNextLong() {
    const long = this._buffer.readInt32LE(this._offset);
    this._offset += 4;
    return long;
  }
  readLong(offset) {
    return this._buffer.readInt32LE(offset);
  }
  readNextFixed() {
    const fixed = this._buffer.readFloatLE(this._offset);
    this._offset += 4;
    return fixed;
  }
  readFixed(offset) {
    return this._buffer.readFloatLE(offset);
  }
  readNextBytes(numBytes) {
    let strBuff = Buffer.alloc(numBytes);
    for (let i = 0; i < numBytes; i++) {
      strBuff.writeUInt8(this.readNextByte(), i);
    }
    return strBuff.toString();
  }
  readNextRawBytes(numBytes) {
    let buff = Buffer.alloc(numBytes);
    for (let i = 0; i < numBytes; i++) {
      buff.writeUInt8(this.readNextByte(), i);
    }
    return buff;
  }
  //reads numBytes bytes of buffer b offset by offset bytes
  readRawBytes(numBytes, b, offset) {
    let buff = Buffer.alloc(numBytes - offset);
    for (let i = 0; i < numBytes - offset; i++) {
      buff.writeUInt8(b.readUInt8(offset + i), i);
    }
    return buff;
  }
  readNextString() {
    const numBytes = this.readNextWord();
    return this.readNextBytes(numBytes);
  }
  skipBytes(numBytes) {
    this._offset += numBytes;
  }
  readHeader() {
    this.fileSize = this.readNextDWord();
    this.readNextWord();
    this.numFrames = this.readNextWord();
    this.width = this.readNextWord();
    this.height = this.readNextWord();
    this.colorDepth = this.readNextWord();
    this.skipBytes(18);
    this.numColors = this.readNextWord();
    const pixW = this.readNextByte();
    const pixH = this.readNextByte();
    this.pixelRatio = `${pixW}:${pixH}`;
    this.skipBytes(92);
    return this.numFrames;
  }
  readFrame() {
    const bytesInFrame = this.readNextDWord();
    this.skipBytes(2);
    const oldChunk = this.readNextWord();
    const frameDuration = this.readNextWord();
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
        case 0x2022:
          this.skipBytes(chunkData.chunkSize - 6);
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
      }
    }
    this.frames.push({ bytesInFrame,
      frameDuration,
      numChunks: newChunk,
      cels});
  }
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
    //handle ICC profile data
    this.colorProfile = {
      type,
      flag,
      fGamma};
  }
  readFrameTagsChunk() {
    const loops = [
      'Forward',
      'Reverse',
      'Ping-pong'
    ]
    const numTags = this.readNextWord();
    this.skipBytes(8);
    for(let i = 0; i < numTags; i ++) {
      let tag = {};
      tag.from = this.readNextWord();
      tag.to = this.readNextWord();
      const loopsInd = this.readNextByte();
      tag.animDirection = loops[loopsInd];
      this.skipBytes(8);
      tag.color = this.readNextRawBytes(3).readUIntLE(0,3);
      this.skipBytes(1);
      tag.name = this.readNextString();
      this.tags.push(tag);
    }
  }
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
        flag,
        red,
        green,
        blue,
        alpha,
        name: name !== undefined ? name : "none"
      });
    }
    return { paletteSize,
      firstColor,
      lastColor: secondColor,
      colors };
  }
  readLayerChunk() {
    const flags = this.readNextWord();
    const type = this.readNextWord();
    const layerChildLevel = this.readNextWord();
    this.skipBytes(4);
    const blendMode = this.readNextWord();
    const opacity = this.readNextByte();
    this.skipBytes(3);
    const name = this.readNextString();
    this.layers.push({ flags,
      type,
      layerChildLevel,
      blendMode,
      opacity,
      name});
  }
  //size of chunk in bytes for the WHOLE thing
  readCelChunk(chunkSize) {
    const layerIndex = this.readNextWord();
    const x = this.readNextShort();
    const y = this.readNextShort();
    const opacity = this.readNextByte();
    const celType = this.readNextWord();
    this.skipBytes(7);
    const w = this.readNextWord();
    const h = this.readNextWord();
    const buff = this.readNextRawBytes(chunkSize - 26); //take the first 20 bytes off for the data above and chunk info
    let rawCel;
    if(celType === 2) {
      rawCel = zlib.inflateSync(buff);
    } else if(celType === 0) {
      rawCel = buff;
    }
    return { layerIndex,
      xpos: x,
      ypos: y,
      opacity,
      celType,
      w,
      h,
      rawCelData: rawCel}
  }
  readChunk() {
    const cSize = this.readNextDWord();
    const type = this.readNextWord();
    return {chunkSize: cSize, type: type};
  }
  parse() {
    const numFrames = this.readHeader();
    for(let i = 0; i < numFrames; i ++) {
      this.readFrame();
    }
   
  }
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
      width: this.width,
      height: this.height,
      colorDepth: this.colorDepth,
      numColors: this.numColors,
      pixelRatio: this.pixelRatio,
      layers: this.layers
    };
  }
}

module.exports = Aseprite;
