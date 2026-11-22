import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import {
  POSE_MODEL_BYTES, POSE_MODEL_PATH, POSE_MODEL_SOURCE_URL, POSE_MODEL_VERSION,
  POSE_RUNTIME_VERSION, POSE_WASM_BASE_PATH, POSE_WASM_FILES,
} from '../src/motion/modelAssets.js';

// SHA-256 of Google's version-1 float16 Lite model, independently downloaded
// from POSE_MODEL_SOURCE_URL on 2026-11-22. No model binaries belong in Git.
export const POSE_MODEL_SHA256 = '59929e1d1ee95287735ddd833b19cf4ac46d29bc7afddbbf6753c459690d574a';
const DEFAULT_ROOT = fileURLToPath(new URL('..', import.meta.url));
const DOWNLOAD_TIMEOUT_MS = 60000;
const IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable';

export function verifyMotionModel(bytes) {
  if (bytes.byteLength !== POSE_MODEL_BYTES) {
    throw new Error(`Motion model size mismatch: expected ${POSE_MODEL_BYTES} bytes, received ${bytes.byteLength}.`);
  }
  const digest = createHash('sha256').update(bytes).digest('hex');
  if (digest !== POSE_MODEL_SHA256) {
    throw new Error(`Motion model SHA-256 mismatch: expected ${POSE_MODEL_SHA256}, received ${digest}.`);
  }
  return bytes;
}

async function downloadModel(fetchAsset, downloadTimeoutMs) {
  try {
    const response = await fetchAsset(POSE_MODEL_SOURCE_URL, {
      signal: AbortSignal.timeout(downloadTimeoutMs), redirect: 'error',
    });
    if (response.status !== 200 || !response.body) {
      throw new Error(`The official model server returned HTTP ${response.status}.`);
    }
    const declaredSize = response.headers.get('content-length');
    if (declaredSize !== null && Number(declaredSize) !== POSE_MODEL_BYTES) {
      await response.body.cancel();
      throw new Error(`The official model server declared an unexpected size: ${declaredSize}.`);
    }
    const chunks = [];
    let received = 0;
    // Bound memory even if a broken server ignores its Content-Length header.
    for await (const chunk of response.body) {
      received += chunk.byteLength;
      if (received > POSE_MODEL_BYTES) throw new Error('The model download exceeded its expected size.');
      chunks.push(chunk);
    }
    return verifyMotionModel(Buffer.concat(chunks, received));
  } catch (failure) {
    throw new Error(`The squat pilot model could not be downloaded and verified: ${failure.message}`, { cause: failure });
  }
}

/** Called only for an explicitly enabled pilot. A valid cache needs no network. */
export async function prepareMotionAssets({ root = DEFAULT_ROOT,
  cacheDirectory = resolve(root, '.cache/motion-assets'), fetchAsset = fetch,
  downloadTimeoutMs = DOWNLOAD_TIMEOUT_MS } = {}) {
  const require = createRequire(resolve(root, 'package.json'));
  const runtimeDirectory = dirname(require.resolve('@mediapipe/tasks-vision'));
  const runtimePackage = JSON.parse(await readFile(resolve(runtimeDirectory, 'package.json'), 'utf8'));
  if (runtimePackage.version !== POSE_RUNTIME_VERSION) {
    throw new Error(`The squat pilot requires @mediapipe/tasks-vision ${POSE_RUNTIME_VERSION}; found ${runtimePackage.version}.`);
  }
  const runtimeAssets = await Promise.all(POSE_WASM_FILES.map(async name => ({
    path: `${POSE_WASM_BASE_PATH}/${name}`,
    contentType: name.endsWith('.wasm') ? 'application/wasm' : 'application/javascript; charset=utf-8',
    bytes: await readFile(resolve(runtimeDirectory, 'wasm', name)),
  })));
  if (runtimeAssets.some(asset => !asset.bytes.byteLength)) throw new Error('A required motion runtime asset is empty.');

  const cachedModel = resolve(cacheDirectory, `${POSE_MODEL_VERSION}.task`);
  let model;
  try {
    model = await readFile(cachedModel);
  } catch (failure) {
    if (failure.code !== 'ENOENT') throw failure;
  }
  if (model) {
    try { verifyMotionModel(model); }
    catch (failure) {
      throw new Error(`${failure.message} Remove the invalid cached model at ${cachedModel} and retry.`, { cause: failure });
    }
  } else {
    model = await downloadModel(fetchAsset, downloadTimeoutMs);
    await mkdir(cacheDirectory, { recursive: true });
    const temporary = `${cachedModel}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, model, { flag: 'wx' });
      await rename(temporary, cachedModel);
    } finally {
      await rm(temporary, { force: true });
    }
  }
  return [...runtimeAssets, { path: POSE_MODEL_PATH, contentType: 'application/octet-stream', bytes: model }];
}

/**
 * Self-host the three allowlisted artifacts without adding them to public/ or
 * the ordinary application bundle. Vite calls this plugin only when enabled.
 */
export function motionAssetsPlugin() {
  let root;
  let command;
  let prepared;
  const prepare = () => prepared ??= prepareMotionAssets({ root });
  return {
    name: 'gym-motion-assets',
    configResolved(config) { root = config.root; command = config.command; },
    async buildStart() { if (command === 'build') await prepare(); },
    async generateBundle() {
      const assets = await prepare();
      for (const asset of assets) {
        this.emitFile({ type: 'asset', fileName: asset.path.slice(1), source: asset.bytes });
      }
    },
    async configureServer(server) {
      const assets = new Map((await prepare()).map(asset => [asset.path, asset]));
      server.middlewares.use((request, response, next) => {
        const pathname = request.url?.split('?', 1)[0] ?? '';
        if (!pathname.startsWith('/motion-assets/')) return next();
        const asset = assets.get(pathname);
        if (!asset) {
          response.statusCode = 404;
          response.setHeader('Content-Type', 'text/plain; charset=utf-8');
          response.end('Motion asset not found.');
          return;
        }
        if (!['GET', 'HEAD'].includes(request.method)) {
          response.statusCode = 405;
          response.setHeader('Allow', 'GET, HEAD');
          response.end();
          return;
        }
        response.setHeader('Content-Type', asset.contentType);
        response.setHeader('Content-Length', asset.bytes.byteLength);
        response.setHeader('Cache-Control', IMMUTABLE_CACHE_CONTROL);
        response.setHeader('X-Content-Type-Options', 'nosniff');
        response.end(request.method === 'HEAD' ? undefined : asset.bytes);
      });
    },
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.env.VITE_ENABLE_SQUAT_PILOT !== 'true') {
    console.log('The squat pilot is disabled. No motion assets were read or downloaded.');
  } else {
    const assets = await prepareMotionAssets();
    console.log(`Verified ${assets.length} versioned motion assets (${assets.reduce((total, asset) => total + asset.bytes.byteLength, 0)} bytes).`);
  }
}
