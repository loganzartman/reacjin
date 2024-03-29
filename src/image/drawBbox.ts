export function drawBbox(
  srcCtx: CanvasRenderingContext2D,
  dstCtx: CanvasRenderingContext2D,
  bbox: [number, number, number, number],
  srcToDst: DOMMatrixReadOnly,
) {
  const handleSize = 12;
  const T = srcToDst.multiply(srcCtx.getTransform());
  const p0 = T.transformPoint({x: bbox[0], y: bbox[1], z: 1});
  const p1 = T.transformPoint({x: bbox[2], y: bbox[1], z: 1});
  const p2 = T.transformPoint({x: bbox[2], y: bbox[3], z: 1});
  const p3 = T.transformPoint({x: bbox[0], y: bbox[3], z: 1});

  dstCtx.save();

  // draw bounding box
  dstCtx.strokeStyle = 'magenta';
  dstCtx.lineWidth = 2;
  dstCtx.beginPath();
  dstCtx.moveTo(p0.x, p0.y);
  dstCtx.lineTo(p1.x, p1.y);
  dstCtx.lineTo(p2.x, p2.y);
  dstCtx.lineTo(p3.x, p3.y);
  dstCtx.closePath();
  dstCtx.stroke();

  // draw square, outlined handles
  dstCtx.fillStyle = 'white';
  dstCtx.strokeStyle = 'magenta';
  dstCtx.lineWidth = 1;
  dstCtx.fillRect(
    p0.x - handleSize / 2,
    p0.y - handleSize / 2,
    handleSize,
    handleSize,
  );
  dstCtx.strokeRect(
    p0.x - handleSize / 2,
    p0.y - handleSize / 2,
    handleSize,
    handleSize,
  );
  dstCtx.fillRect(
    p1.x - handleSize / 2,
    p1.y - handleSize / 2,
    handleSize,
    handleSize,
  );
  dstCtx.strokeRect(
    p1.x - handleSize / 2,
    p1.y - handleSize / 2,
    handleSize,
    handleSize,
  );
  dstCtx.fillRect(
    p2.x - handleSize / 2,
    p2.y - handleSize / 2,
    handleSize,
    handleSize,
  );
  dstCtx.strokeRect(
    p2.x - handleSize / 2,
    p2.y - handleSize / 2,
    handleSize,
    handleSize,
  );
  dstCtx.fillRect(
    p3.x - handleSize / 2,
    p3.y - handleSize / 2,
    handleSize,
    handleSize,
  );
  dstCtx.strokeRect(
    p3.x - handleSize / 2,
    p3.y - handleSize / 2,
    handleSize,
    handleSize,
  );

  dstCtx.restore();
}
