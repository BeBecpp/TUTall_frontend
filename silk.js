import { Renderer, Camera, Program, Mesh, Geometry } from './node_modules/ogl/dist/ogl.mjs';

const canvasHost = document.getElementById('silk-canvas');
if (!canvasHost) {
  console.warn('Silk background container not found.');
} else {
  const renderer = new Renderer({ alpha: true, dpr: Math.min(2, window.devicePixelRatio) });
  const gl = renderer.gl;
  const canvas = renderer.gl.canvas;
  canvas.className = 'silk-canvas-webgl';
  canvasHost.appendChild(canvas);

  const camera = new Camera(gl, { fov: 45 });
  camera.position.z = 1;

  const geometry = new Geometry(gl, {
    position: { size: 2, data: new Float32Array([-1, -1, 3, -1, -1, 3]) }
  });

  const vertex = `#version 300 es
  in vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
  `;

  const fragment = `#version 300 es
  precision highp float;
  uniform vec2 resolution;
  uniform float time;
  uniform vec3 silkColor;
  uniform float noiseIntensity;
  uniform float scale;
  out vec4 fragColor;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec2 centered = uv * 2.0 - 1.0;
    centered.x *= resolution.x / resolution.y;
    vec2 p = centered * scale;

    float movement = time * 0.08;
    float n = 0.0;
    n += noise(p * 1.2 + vec2(movement, movement * 0.4)) * 0.7;
    n += noise(p * 2.8 - vec2(movement * 1.3, movement * 0.6)) * 0.4;
    n += noise(p * 5.6 + vec2(-movement * 0.9, movement * 1.8)) * 0.2;
    n *= noiseIntensity;

    float radius = length(centered) * 1.25;
    float glow = exp(-radius * radius * 0.85);
    vec3 base = silkColor * 0.38 + vec3(0.08, 0.07, 0.10);
    vec3 color = base + silkColor * n * 0.25 + vec3(0.14, 0.12, 0.16) * glow;
    color = mix(color, vec3(0.04, 0.04, 0.05), pow(radius, 2.0) * 0.5);

    fragColor = vec4(color, 1.0);
  }
  `;

  const program = new Program(gl, {
    vertex,
    fragment,
    uniforms: {
      resolution: { value: [window.innerWidth, window.innerHeight] },
      time: { value: 0 },
      silkColor: { value: [0.482, 0.453, 0.506] },
      noiseIntensity: { value: 1.5 },
      scale: { value: 1.0 }
    }
  });

  const mesh = new Mesh(gl, { geometry, program });

  function resize() {
    const width = canvasHost.clientWidth;
    const height = canvasHost.clientHeight;
    renderer.setSize(width, height);
    program.uniforms.resolution.value = [width, height];
    camera.perspective({ aspect: width / height });
  }

  window.addEventListener('resize', resize);
  resize();

  let time = 0;
  function animate() {
    time += 0.016;
    program.uniforms.time.value = time;
    renderer.render({ camera, scene: mesh });
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}
