import { mat4 } from "gl-matrix";
import { InteractiveCanvas } from "./utls";
import {
  BlockDefinition,
  BlockModel,
  NbtFile,
  Resources,
  Structure,
  StructureRenderer,
  TextureAtlas,
  VoxelRenderer,
  upperPowerOfTwo,
} from "deepslate";

const document = window.document;

const MCMETA = "https://raw.githubusercontent.com/misode/mcmeta/";

Promise.all([
  fetch(`${MCMETA}registries/item/data.min.json`).then((r) => r.json()),
  fetch(`${MCMETA}summary/assets/block_definition/data.min.json`).then((r) =>
    r.json()
  ),
  fetch(`${MCMETA}summary/assets/model/data.min.json`).then((r) => r.json()),
  fetch(`${MCMETA}atlas/all/data.min.json`).then((r) => r.json()),
  new Promise<HTMLImageElement>((res) => {
    const image = new Image();
    image.onload = () => res(image);
    image.crossOrigin = "Anonymous";
    image.src = `${MCMETA}atlas/all/atlas.png`;
  }),
]).then(([items, blockstates, models, uvMap, atlas]) => {
  // === Prepare assets for item and structure rendering ===

  const itemList = document.createElement("datalist");
  itemList.id = "item-list";
  items.forEach((item: string | null) => {
    const option = document.createElement("option");
    option.textContent = item;
    itemList.append(option);
  });
  document.getElementById("item-input")?.after(itemList);

  const blockDefinitions: Record<string, BlockDefinition> = {};
  Object.keys(blockstates).forEach((id) => {
    blockDefinitions["minecraft:" + id] = BlockDefinition.fromJson(
      id,
      blockstates[id]
    );
  });

  const blockModels: Record<string, BlockModel> = {};
  Object.keys(models).forEach((id) => {
    blockModels["minecraft:" + id] = BlockModel.fromJson(id, models[id]);
  });
  Object.values(blockModels).forEach((m: any) =>
    m.flatten({ getBlockModel: (id: string | number) => blockModels[id] })
  );

  const atlasCanvas = document.createElement("canvas");
  const atlasSize = upperPowerOfTwo(Math.max(atlas.width, atlas.height));
  atlasCanvas.width = atlasSize;
  atlasCanvas.height = atlasSize;
  const atlasCtx = atlasCanvas.getContext("2d")!;
  atlasCtx.drawImage(atlas, 0, 0);
  const atlasData = atlasCtx.getImageData(0, 0, atlasSize, atlasSize);
  const part = 16 / atlasData.width;
  const idMap = {};
  Object.keys(uvMap).forEach((id) => {
    const u = uvMap[id][0] / atlasSize;
    const v = uvMap[id][1] / atlasSize;
    idMap["minecraft:" + id] = [u, v, u + part, v + part];
  });
  const textureAtlas = new TextureAtlas(atlasData, idMap);

  const resources: Resources = {
    getBlockDefinition(id) {
      return blockDefinitions[id.toString()];
    },
    getBlockModel(id) {
      return blockModels[id.toString()];
    },
    getTextureUV(id) {
      return textureAtlas.getTextureUV(id);
    },
    getTextureAtlas() {
      return textureAtlas.getTextureAtlas();
    },
    getBlockFlags(id) {
      return { opaque: false };
    },
    getBlockProperties(id) {
      return null;
    },
    getDefaultBlockProperties(id) {
      return null;
    },
  };

  const structure = new Structure([4, 3, 4]);

  const size = structure.getSize();

  structure.addBlock([1, 0, 0], "minecraft:stone");
  structure.addBlock([2, 0, 0], "minecraft:grass_block", { snowy: "false" });
  structure.addBlock([1, 1, 0], "minecraft:cake", { bites: "3" });
  structure.addBlock([0, 0, 0], "minecraft:wall_torch", { facing: "west" });

  const structureCanvas = document.getElementById(
    "display"
  ) as HTMLCanvasElement;
  const structureGl = structureCanvas.getContext("webgl2")!;

  const structureRenderer = new StructureRenderer(
    structureGl,
    structure,
    resources
  );

  let i_canvas = new InteractiveCanvas(
    structureCanvas,
    (view) => {
      structureRenderer.drawStructure(view);
    },
    [size[0] / 2, size[1] / 2, size[2] / 2]
  );
});
