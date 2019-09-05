declare class Aseprite {
  frames: Array<Aseprite.Frame>;
  layers: Array<Aseprite.Layer>;
  tags: Array<Aseprite.Tag>;
  palette: Aseprite.Palette;
  fileSize: number;
  width: number;
  height: number;
  numFrames: number;
  constructor(buffer: Buffer, name: string): void;
  readByte(offset: number): number;
  readWord(offset: number): number;
  readShort(offset: number): number;
  readDWord(offset: number): number;
  readLong(offset: number): number;
  readFixed(offset: number): number;
  readRawBytes(numBytes: number, b: Buffer, offset: number): Buffer;
  parse(): void;
  toJSON(): object;
}
export = Aseprite;

declare namespace Aseprite {
  export interface Palette {
    paletteSize: number;
    firstColor: number;
    lastColor: number;
    colors: Array<Color>;
  }
  export interface Color {
    red: number;
    green: number;
    blue: number;
    alpha: number;
    name: string;
  }
  export interface Cel {
    layerIndex: number;
    xpos: number;
    ypos: number;
    opacity: number;
    celType: number;
    w: number;
    h: number;
    rawCelData: Buffer;
  }
  export interface Tag {
    name: string;
    from: number;
    to: number;
    animDirection: number;
    color: number;
  }
  export interface Layer {
    flags: number;
    type: number;
    layerChildLevel: number;
    blendMode: number;
    opacity: number;
    name: string;
  }
  export interface Frame {
    bytesInFrame: number;
    frameDuration: number;
    numChunks: number;
    cels: Array<Cel>;
  }
}