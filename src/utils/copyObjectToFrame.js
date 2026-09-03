import { util } from 'fabric';

/**
 * Clone a Fabric object from one canvas and add it to another.
 * Preserves position, scale, rotation, and recolor fills.
 */
export async function copyObjectToFrame(sourceCanvas, targetCanvas, object, offset = { x: 0, y: 0 }) {
  if (!sourceCanvas || !targetCanvas || !object) return null;

  const json = object.toJSON(['glintRole', 'glintGraphic', 'glintFills', 'glintSlot', 'glintShape']);
  const cloned = await util.enlivenObjects([json]);

  if (!cloned?.length) return null;
  const clone = cloned[0];

  clone.set({
    left: (object.left || 0) + offset.x,
    top: (object.top || 0) + offset.y,
    scaleX: object.scaleX,
    scaleY: object.scaleY,
    angle: object.angle,
    opacity: object.opacity,
    selectable: true,
    evented: true,
  });

  targetCanvas.add(clone);
  targetCanvas.setActiveObject(clone);
  targetCanvas.requestRenderAll();
  return clone;
}

/**
 * Clone all selected objects from source canvas to target canvas.
 */
export async function copySelectionToFrame(sourceCanvas, targetCanvas, objects, offset = { x: 0, y: 0 }) {
  const results = [];
  for (const obj of objects) {
    const clone = await copyObjectToFrame(sourceCanvas, targetCanvas, obj, offset);
    if (clone) results.push(clone);
  }
  return results;
}
