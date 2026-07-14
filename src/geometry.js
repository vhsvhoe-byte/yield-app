export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const clamp01 = (value) => clamp(value, 0, 1);

const solveLinearSystem = (matrix, vector) => {
  const n = matrix.length;
  const a = matrix.map((row, index) => [...row, vector[index]]);
  for (let i = 0; i < n; i += 1) {
    let maxRow = i;
    for (let k = i + 1; k < n; k += 1) {
      if (Math.abs(a[k][i]) > Math.abs(a[maxRow][i])) maxRow = k;
    }
    if (Math.abs(a[maxRow][i]) < 1e-10) return null;
    [a[i], a[maxRow]] = [a[maxRow], a[i]];
    const pivot = a[i][i];
    for (let j = i; j <= n; j += 1) a[i][j] /= pivot;
    for (let k = 0; k < n; k += 1) {
      if (k === i) continue;
      const factor = a[k][i];
      for (let j = i; j <= n; j += 1) a[k][j] -= factor * a[i][j];
    }
  }
  return a.map((row) => row[n]);
};

export const computeHomography = (src, dst) => {
  const matrix = [];
  const vector = [];
  for (let i = 0; i < 4; i += 1) {
    const { x, y } = src[i];
    const { x: u, y: v } = dst[i];
    matrix.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    vector.push(u);
    matrix.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    vector.push(v);
  }
  const result = solveLinearSystem(matrix, vector);
  if (!result) return null;
  return [
    [result[0], result[1], result[2]],
    [result[3], result[4], result[5]],
    [result[6], result[7], 1],
  ];
};

export const invert3x3 = (m) => {
  const [a, b, c] = m[0];
  const [d, e, f] = m[1];
  const [g, h, i] = m[2];
  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  if (Math.abs(det) < 1e-10) return null;
  return [
    [(e * i - f * h) / det, (c * h - b * i) / det, (b * f - c * e) / det],
    [(f * g - d * i) / det, (a * i - c * g) / det, (c * d - a * f) / det],
    [(d * h - e * g) / det, (b * g - a * h) / det, (a * e - b * d) / det],
  ];
};

export const applyHomography = (m, x, y) => {
  const w = m[2][0] * x + m[2][1] * y + m[2][2];
  if (Math.abs(w) < 1e-10) return null;
  return {
    x: (m[0][0] * x + m[0][1] * y + m[0][2]) / w,
    y: (m[1][0] * x + m[1][1] * y + m[1][2]) / w,
  };
};

const loadImageElement = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image failed to load"));
    img.src = src;
  });

/**
 * Limits an image to maxSide pixels on its longest edge. Large photos slow
 * down rectification and can exceed the localStorage quota, so uploads pass
 * through here first.
 */
export const downscaleImage = async (src, maxSide = 2400) => {
  const img = await loadImageElement(src);
  const { naturalWidth: w, naturalHeight: h } = img;
  if (Math.max(w, h) <= maxSide) return { src, width: w, height: h };
  const scale = maxSide / Math.max(w, h);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return { src, width: w, height: h };
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return { src: canvas.toDataURL("image/jpeg", 0.9), width: canvas.width, height: canvas.height };
};

export const rotateImage90Clockwise = async (src) => {
  const img = await loadImageElement(src);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalHeight;
  canvas.height = img.naturalWidth;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.translate(canvas.width, 0);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(img, 0, 0);
  return { src: canvas.toDataURL("image/jpeg", 0.92), width: canvas.width, height: canvas.height };
};

export const rectifyImageFromCorners = async (src, points, targetAspectRatio) => {
  const img = await loadImageElement(src);
  const topWidth = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
  const bottomWidth = Math.hypot(points[2].x - points[3].x, points[2].y - points[3].y);
  const leftHeight = Math.hypot(points[3].x - points[0].x, points[3].y - points[0].y);
  const rightHeight = Math.hypot(points[2].x - points[1].x, points[2].y - points[1].y);
  const measuredWidth = Math.max(topWidth, bottomWidth);
  const measuredHeight = Math.max(leftHeight, rightHeight);
  const measuredArea = Math.max(1, measuredWidth * measuredHeight);
  const aspect =
    Number.isFinite(targetAspectRatio) && targetAspectRatio > 0
      ? targetAspectRatio
      : measuredWidth / Math.max(1, measuredHeight);
  const targetWidth = Math.max(1, Math.round(Math.sqrt(measuredArea * aspect)));
  const targetHeight = Math.max(1, Math.round(targetWidth / aspect));
  const dst = [
    { x: 0, y: 0 },
    { x: targetWidth - 1, y: 0 },
    { x: targetWidth - 1, y: targetHeight - 1 },
    { x: 0, y: targetHeight - 1 },
  ];
  const homography = computeHomography(points, dst);
  const inverse = homography ? invert3x3(homography) : null;
  if (!inverse) return null;

  const srcCanvas = document.createElement("canvas");
  srcCanvas.width = img.naturalWidth;
  srcCanvas.height = img.naturalHeight;
  const srcCtx = srcCanvas.getContext("2d");
  const outCanvas = document.createElement("canvas");
  outCanvas.width = targetWidth;
  outCanvas.height = targetHeight;
  const outCtx = outCanvas.getContext("2d");
  if (!srcCtx || !outCtx) throw new Error("Canvas unavailable");
  srcCtx.drawImage(img, 0, 0);
  const srcData = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
  const outData = outCtx.createImageData(targetWidth, targetHeight);
  for (let y = 0; y < targetHeight; y += 1) {
    for (let x = 0; x < targetWidth; x += 1) {
      const mapped = applyHomography(inverse, x, y);
      if (!mapped) continue;
      const sx = Math.round(mapped.x);
      const sy = Math.round(mapped.y);
      if (sx < 0 || sy < 0 || sx >= srcCanvas.width || sy >= srcCanvas.height) continue;
      const srcIndex = (sy * srcCanvas.width + sx) * 4;
      const dstIndex = (y * targetWidth + x) * 4;
      outData.data[dstIndex] = srcData.data[srcIndex];
      outData.data[dstIndex + 1] = srcData.data[srcIndex + 1];
      outData.data[dstIndex + 2] = srcData.data[srcIndex + 2];
      outData.data[dstIndex + 3] = srcData.data[srcIndex + 3];
    }
  }
  outCtx.putImageData(outData, 0, 0);
  return { src: outCanvas.toDataURL("image/jpeg", 0.92), width: targetWidth, height: targetHeight };
};

export const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("File could not be read"));
    reader.readAsDataURL(file);
  });
