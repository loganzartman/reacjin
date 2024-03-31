const selectedStroke = 'rgba(255, 0, 0, 1)';
const unselectedStroke = 'rgba(255, 0, 0, 0.5)';

function drawHandle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  handleSize: number,
) {
  ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
  ctx.strokeRect(
    x - handleSize / 2,
    y - handleSize / 2,
    handleSize,
    handleSize,
  );
}

export function drawBbox({
  srcCtx,
  dstCtx,
  bbox,
  srcToDst,
  selected,
}: {
  srcCtx: CanvasRenderingContext2D;
  dstCtx: CanvasRenderingContext2D;
  bbox: [number, number, number, number];
  srcToDst: DOMMatrixReadOnly;
  selected: boolean;
}) {
  const handleSize = 8;
  const T = srcToDst.multiply(srcCtx.getTransform());
  const p0 = T.transformPoint({x: bbox[0], y: bbox[1], z: 1});
  const p1 = T.transformPoint({x: bbox[2], y: bbox[1], z: 1});
  const p2 = T.transformPoint({x: bbox[2], y: bbox[3], z: 1});
  const p3 = T.transformPoint({x: bbox[0], y: bbox[3], z: 1});

  dstCtx.save();

  // draw bounding box
  dstCtx.lineWidth = 2;
  dstCtx.strokeStyle = selected ? selectedStroke : unselectedStroke;
  dstCtx.setLineDash(selected ? [] : [4, 4]);
  dstCtx.beginPath();
  dstCtx.moveTo(p0.x, p0.y);
  dstCtx.lineTo(p1.x, p1.y);
  dstCtx.lineTo(p2.x, p2.y);
  dstCtx.lineTo(p3.x, p3.y);
  dstCtx.closePath();
  dstCtx.stroke();

  if (selected) {
    // draw square, outlined handles
    dstCtx.fillStyle = 'white';
    dstCtx.strokeStyle = selectedStroke;
    dstCtx.setLineDash([]);
    dstCtx.lineWidth = 1;
    drawHandle(dstCtx, p0.x, p0.y, handleSize);
    drawHandle(dstCtx, p1.x, p1.y, handleSize);
    drawHandle(dstCtx, p2.x, p2.y, handleSize);
    drawHandle(dstCtx, p3.x, p3.y, handleSize);
  }

  dstCtx.restore();
}
