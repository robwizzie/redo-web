/* Redo Websites gradient
   Our own take on the technique behind Stripe's homepage gradient: a dense
   plane mesh whose vertices are lifted by 3D simplex noise, with each vertex
   colored by stacking "wave layers". Each layer's noise is clamped by
   smoothstep(floor, ceil) and blended over the base color. Because color is
   computed per vertex and interpolated, the blends stay soft and silky.

   Usage: <canvas data-gradient></canvas> inside a sized container.
   Colors come from CSS custom properties --gradient-1 … --gradient-4 on the canvas. */
(() => {
  const VERT = `
precision highp float;
attribute vec3 position;
attribute vec2 uvNorm;
uniform vec2 resolution;
uniform float u_time;
uniform vec3 u_baseColor;
uniform vec3 u_layerColor[3];
uniform vec2 u_layerFreq[3];
uniform float u_layerSpeed[3];
uniform float u_layerFlow[3];
uniform float u_layerSeed[3];
uniform float u_layerCeil[3];
varying vec3 v_color;

// 3D simplex noise: Ashima Arts / Stefan Gustavson (MIT)
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}

void main(){
  float time = u_time * 5e-6;
  vec2 noiseCoord = resolution * uvNorm * vec2(14e-5, 29e-5);

  // Vertex deform: lift the surface into slow rolling hills, fading to flat at top and bottom
  float tilt = resolution.y / 2.0 * uvNorm.y;
  float lift = snoise(vec3(noiseCoord.x * 3.0 + time * 3.0, noiseCoord.y * 4.0, time * 10.0 + 5.0)) * 320.0;
  lift *= 1.0 - pow(abs(uvNorm.y), 2.0);
  lift = max(0.0, lift);
  vec2 pos = vec2(position.x, position.y + tilt + lift);

  // Color: base, then three wave layers blended on top
  v_color = u_baseColor;
  for (int i = 0; i < 3; i++) {
    float n = snoise(vec3(
      noiseCoord.x * u_layerFreq[i].x + time * u_layerFlow[i],
      noiseCoord.y * u_layerFreq[i].y,
      time * u_layerSpeed[i] + u_layerSeed[i]
    ));
    n = smoothstep(0.1, u_layerCeil[i], n / 2.0 + 0.5);
    v_color = mix(v_color, u_layerColor[i], pow(n, 4.0));
  }
  gl_Position = vec4(pos / (resolution / 2.0), 0.0, 1.0);
}`;

  const FRAG = `
precision highp float;
varying vec3 v_color;
uniform vec2 resolution;
void main(){
  vec2 st = gl_FragCoord.xy / resolution;
  vec3 c = v_color;
  // a little shadow toward the top-left, like light falling across the surface
  c *= 1.0 - pow(1.0 - st.y, 6.0) * 0.25 - pow(1.0 - st.x, 8.0) * 0.15;
  gl_FragColor = vec4(c, 1.0);
}`;

  const hexToRgb = (hex) => {
    hex = hex.trim().replace("#", "");
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    const n = parseInt(hex, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  };

  const compile = (gl, type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };

  function mount(canvas) {
    const gl = canvas.getContext("webgl", { antialias: true, premultipliedAlpha: false });
    if (!gl) { canvas.closest("[data-gradient-wrap]")?.classList.add("no-webgl"); return; }

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const u = (name) => gl.getUniformLocation(prog, name);
    const style = getComputedStyle(canvas);
    const colors = [1, 2, 3, 4].map((i) => hexToRgb(style.getPropertyValue(`--gradient-${i}`) || "#5E94F7"));
    gl.uniform3fv(u("u_baseColor"), colors[0]);
    gl.uniform3fv(u("u_layerColor"), colors.slice(1).flat());
    // Per-layer settings: each layer a touch faster, drifting a little differently
    gl.uniform2fv(u("u_layerFreq"), [2, 3, 2.33, 3.33, 2.66, 3.66]);
    gl.uniform1fv(u("u_layerSpeed"), [11, 11.3, 11.6]);
    gl.uniform1fv(u("u_layerFlow"), [6.5, 6.8, 7.1]);
    gl.uniform1fv(u("u_layerSeed"), [5, 15, 25]);
    gl.uniform1fv(u("u_layerCeil"), [0.63, 0.7, 0.77]);

    const posBuf = gl.createBuffer();
    const uvBuf = gl.createBuffer();
    const idxBuf = gl.createBuffer();
    const aPos = gl.getAttribLocation(prog, "position");
    const aUv = gl.getAttribLocation(prog, "uvNorm");
    let indexCount = 0;

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u("resolution"), w, h);

      // Mesh density borrowed from the original: ~0.06 segments/px across, 0.16/px down
      const sx = Math.max(8, Math.ceil(w * 0.06)), sy = Math.max(8, Math.ceil(h * 0.16));
      const pos = [], uv = [], idx = [];
      for (let y = 0; y <= sy; y++) {
        for (let x = 0; x <= sx; x++) {
          const ux = x / sx, uy = y / sy;
          pos.push(-w / 2 + ux * w, h / 2 - uy * h, 0);
          uv.push(ux * 2 - 1, 1 - uy * 2);
          if (x < sx && y < sy) {
            const a = y * (sx + 1) + x, b = a + sx + 1;
            idx.push(a, b, a + 1, b, b + 1, a + 1);
          }
        }
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(aUv);
      gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);
      const ext = gl.getExtension("OES_element_index_uint");
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ext ? new Uint32Array(idx) : new Uint16Array(idx), gl.STATIC_DRAW);
      indexCount = idx.length;
      mesh.type = ext ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
    };
    const mesh = { type: gl.UNSIGNED_SHORT };

    let t = 1253106; // a start time that opens on a pleasant arrangement
    const draw = () => {
      gl.uniform1f(u("u_time"), t);
      gl.drawElements(gl.TRIANGLES, indexCount, mesh.type, 0);
    };

    build();
    draw();
    canvas.classList.add("is-ready");
    new ResizeObserver(() => { build(); draw(); }).observe(canvas);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let visible = true, last = 0;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
    const loop = (now) => {
      if (visible && !document.hidden) {
        t += Math.min(now - last, 1000 / 15);
        draw();
      }
      last = now;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame((now) => { last = now; loop(now); });
  }

  document.querySelectorAll("canvas[data-gradient]").forEach((c) => {
    try { mount(c); } catch (err) { c.closest("[data-gradient-wrap]")?.classList.add("no-webgl"); console.warn(err); }
  });
})();
