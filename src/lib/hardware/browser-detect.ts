export interface BrowserHardwareInfo {
  gpuRenderer: string | null;
  gpuVendor: string | null;
  cores: number | null;
  /** navigator.deviceMemory (approximate, capped at 8 GB in Chrome/Edge) */
  deviceMemoryGB: number | null;
  /** Probed via WebGPU buffer allocation */
  estimatedVramGB: number | null;
  /** deviceMemory or inferred from unified memory GPUs */
  estimatedRamGB: number | null;
  /** Whether detection found usable data */
  detected: boolean;
}

function getWebGLInfo(): { renderer: string | null; vendor: string | null } {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!gl) return { renderer: null, vendor: null };

    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    if (!ext) return { renderer: null, vendor: null };

    return {
      renderer: gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) as string,
      vendor: gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) as string,
    };
  } catch {
    return { renderer: null, vendor: null };
  }
}

function isAppleGpu(renderer: string | null, vendor: string | null): boolean {
  const combined = `${vendor ?? ""} ${renderer ?? ""}`.toLowerCase();
  return combined.includes("apple");
}

const CHUNK_MB = 256;
const MAX_PROBE_MB = 200 * 1024; // 200 GB hard cap

/**
 * Probe actual GPU memory by allocating WebGPU buffers in chunks
 * until allocation fails. Returns estimated total VRAM in GB.
 */
async function probeVramWebGPU(): Promise<number | null> {
  if (typeof navigator === "undefined" || !("gpu" in navigator)) return null;

  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) return null;

    const device = await adapter.requestDevice();
    const chunkBytes = CHUNK_MB * 1024 * 1024;
    const buffers: GPUBuffer[] = [];
    let allocatedMB = 0;

    try {
      while (allocatedMB < MAX_PROBE_MB) {
        const buffer = device.createBuffer({
          size: chunkBytes,
          usage: GPUBufferUsage.STORAGE,
          mappedAtCreation: false,
        });

        // Check for device loss after allocation
        if (device.lost && await Promise.race([
          device.lost.then(() => true),
          new Promise<false>((resolve) => setTimeout(() => resolve(false), 50)),
        ])) {
          buffer.destroy();
          break;
        }

        buffers.push(buffer);
        allocatedMB += CHUNK_MB;
      }
    } catch {
      // Allocation failed -- this is expected
    }

    // Clean up all allocated buffers
    for (const buf of buffers) {
      try { buf.destroy(); } catch { /* ignore */ }
    }
    device.destroy();

    if (allocatedMB === 0) return null;

    // Browsers/drivers reserve some VRAM, so actual total is
    // roughly 15-25% more than what we could allocate
    const estimatedTotalGB = Math.round((allocatedMB / 1024) * 1.2 * 10) / 10;
    return estimatedTotalGB;
  } catch {
    return null;
  }
}

/**
 * Estimate VRAM from WebGPU adapter limits when probing is unavailable.
 * maxBufferSize loosely correlates with total VRAM.
 */
async function estimateVramFromLimits(): Promise<number | null> {
  if (typeof navigator === "undefined" || !("gpu" in navigator)) return null;

  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) return null;

    const maxBuffer = adapter.limits.maxBufferSize;
    if (!maxBuffer || maxBuffer <= 0) return null;

    // maxBufferSize is typically 25-50% of total VRAM
    const estimateGB = Math.round((maxBuffer / (1024 ** 3)) * 2.5 * 10) / 10;
    return Math.max(estimateGB, 1);
  } catch {
    return null;
  }
}

export async function detectBrowserHardware(): Promise<BrowserHardwareInfo> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return {
      gpuRenderer: null, gpuVendor: null, cores: null,
      deviceMemoryGB: null, estimatedVramGB: null,
      estimatedRamGB: null, detected: false,
    };
  }

  const { renderer, vendor } = getWebGLInfo();

  const cores =
    navigator.hardwareConcurrency ? navigator.hardwareConcurrency : null;

  const deviceMemoryGB =
    "deviceMemory" in navigator
      ? (navigator as { deviceMemory?: number }).deviceMemory ?? null
      : null;

  // Try probing first, fall back to limit-based estimate
  let estimatedVramGB = await probeVramWebGPU();
  if (estimatedVramGB === null) {
    estimatedVramGB = await estimateVramFromLimits();
  }

  // Apple Silicon: unified memory, VRAM = RAM
  const apple = isAppleGpu(renderer, vendor);
  let estimatedRamGB: number | null = null;
  if (apple && estimatedVramGB) {
    estimatedRamGB = Math.round(estimatedVramGB);
    // Apply ~70% usable heuristic (same as server-side)
    estimatedVramGB = Math.round(estimatedVramGB * 0.7 * 10) / 10;
  } else if (deviceMemoryGB) {
    estimatedRamGB = deviceMemoryGB;
  }

  const detected = estimatedVramGB !== null || estimatedRamGB !== null;

  return {
    gpuRenderer: renderer,
    gpuVendor: vendor,
    cores,
    deviceMemoryGB,
    estimatedVramGB,
    estimatedRamGB,
    detected,
  };
}
