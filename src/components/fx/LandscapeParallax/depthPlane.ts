import { ScrollTrigger } from "@/components/motion/gsap.client";

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uImage;
uniform sampler2D uDepth;
uniform vec2 uCover;   // aspect-cover scale (image fills canvas, no stretch)
uniform vec2 uShift;   // parallax offset driven by scroll
void main() {
  // Cover-fit, then a small inset so displacement never samples past the edge.
  vec2 uv = (vUv - 0.5) * uCover + 0.5;
  uv = (uv - 0.5) * 0.92 + 0.5;
  float d = texture2D(uDepth, uv).r;
  uv += uShift * (d - 0.5);
  gl_FragColor = texture2D(uImage, clamp(uv, 0.0, 1.0));
}`;

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function makeTexture(gl: WebGLRenderingContext, img: HTMLImageElement): WebGLTexture | null {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return tex;
}

export function mountDepthPlane(
  canvas: HTMLCanvasElement,
  root: HTMLElement,
  intensity: number,
): () => void {
  const imageSrc = canvas.dataset.image;
  const depthSrc = canvas.dataset.depthmap;
  const fallback = root.querySelector<HTMLElement>("[data-depth-fallback]");
  if (!imageSrc || !depthSrc) return () => {};

  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, premultipliedAlpha: false });
  if (!gl) return () => {};

  let disposed = false;
  let trigger: ScrollTrigger | null = null;
  let ro: ResizeObserver | null = null;
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let imgTex: WebGLTexture | null = null;
  let depthTex: WebGLTexture | null = null;
  let imgAspect = 1;
  let shiftY = 0;

  const onContextLost = (e: Event) => {
    e.preventDefault();
    revealFallback();
  };
  canvas.addEventListener("webglcontextlost", onContextLost, false);

  function revealFallback() {
    canvas.style.display = "none";
    if (fallback) fallback.style.display = "";
  }

  function resize() {
    if (disposed || !gl || !program) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(root.clientWidth * dpr));
    const h = Math.max(1, Math.round(root.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    const viewAspect = w / h;
    const cover: [number, number] =
      viewAspect > imgAspect
        ? [1, imgAspect / viewAspect]
        : [viewAspect / imgAspect, 1];
    const loc = gl.getUniformLocation(program, "uCover");
    gl.uniform2f(loc, cover[0], cover[1]);
    draw();
  }

  function draw() {
    if (disposed || !gl || !program) return;
    gl.uniform2f(gl.getUniformLocation(program, "uShift"), 0, shiftY);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  Promise.all([loadImage(imageSrc), loadImage(depthSrc)])
    .then(([image, depth]) => {
      if (disposed || !gl) return;

      const vs = compile(gl, gl.VERTEX_SHADER, VERT);
      const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
      if (!vs || !fs) return revealFallback();

      program = gl.createProgram();
      if (!program) return revealFallback();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return revealFallback();
      gl.useProgram(program);

      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const aPos = gl.getAttribLocation(program, "aPos");
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      imgAspect = image.naturalWidth / image.naturalHeight || 1;
      imgTex = makeTexture(gl, image);
      depthTex = makeTexture(gl, depth);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, imgTex);
      gl.uniform1i(gl.getUniformLocation(program, "uImage"), 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, depthTex);
      gl.uniform1i(gl.getUniformLocation(program, "uDepth"), 1);

      canvas.style.display = "";
      if (fallback) fallback.style.display = "none";

      resize();
      ro = new ResizeObserver(resize);
      ro.observe(root);

      trigger = ScrollTrigger.create({
        trigger: root,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          shiftY = (self.progress - 0.5) * 0.08 * intensity;
          draw();
        },
      });
    })
    .catch(revealFallback);

  return () => {
    disposed = true;
    canvas.removeEventListener("webglcontextlost", onContextLost);
    trigger?.kill();
    ro?.disconnect();
    if (gl) {
      if (buffer) gl.deleteBuffer(buffer);
      if (imgTex) gl.deleteTexture(imgTex);
      if (depthTex) gl.deleteTexture(depthTex);
      if (program) gl.deleteProgram(program);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
  };
}
