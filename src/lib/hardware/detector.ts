import { execFile } from "node:child_process";
import { promisify } from "node:util";
import si from "systeminformation";
import type { ComputeBackend, GpuInfo, SystemProfile } from "@/types";

const execFileAsync = promisify(execFile);

const APPLE_UNIFIED_MEMORY_RATIO = 0.7;
const DISCRETE_VRAM_USABLE_RATIO = 0.9;
const CPU_RAM_USABLE_RATIO = 0.65;

async function getNvidiaSmiGpus(): Promise<GpuInfo[]> {
  try {
    const { stdout } = await execFileAsync("nvidia-smi", [
      "--query-gpu=name,memory.total,memory.used,memory.free",
      "--format=csv,noheader,nounits",
    ]);

    return stdout
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(",").map((p) => p.trim());
        const [name, total, used, free] = parts;
        return {
          vendor: "NVIDIA",
          model: name ?? "Unknown NVIDIA GPU",
          vramMB: parseInt(total ?? "0", 10) || 0,
          vramDynamic: false,
          memoryUsedMB: used ? parseInt(used, 10) : undefined,
          memoryFreeMB: free ? parseInt(free, 10) : undefined,
        };
      });
  } catch {
    return [];
  }
}

function inferComputeBackend(
  gpus: GpuInfo[],
  platform: string,
): ComputeBackend {
  if (gpus.length === 0) return "cpu_only";

  const vendors = gpus.map((g) => g.vendor.toLowerCase());
  const models = gpus.map((g) => g.model.toLowerCase());

  if (
    vendors.some((v) => v.includes("nvidia")) ||
    models.some((m) => m.includes("geforce") || m.includes("rtx") || m.includes("gtx"))
  ) {
    return "nvidia_cuda";
  }

  if (
    platform === "darwin" &&
    (vendors.some((v) => v.includes("apple")) ||
      gpus.some((g) => g.vramDynamic))
  ) {
    return "apple_metal";
  }

  if (
    vendors.some((v) => v.includes("amd") || v.includes("advanced micro")) ||
    models.some((m) => m.includes("radeon"))
  ) {
    return "amd_rocm";
  }

  const hasDiscreteVram = gpus.some((g) => g.vramMB >= 2048 && !g.vramDynamic);
  if (hasDiscreteVram) {
    return "nvidia_cuda";
  }

  return "cpu_only";
}

function mergeGpuData(
  siGpus: GpuInfo[],
  nvidiaGpus: GpuInfo[],
): GpuInfo[] {
  if (nvidiaGpus.length > 0) {
    return nvidiaGpus.map((nv, i) => {
      const siGpu = siGpus[i];
      if (siGpu && siGpu.vramMB > 0 && nv.vramMB === 0) {
        return { ...nv, vramMB: siGpu.vramMB };
      }
      return nv;
    });
  }
  return siGpus.filter((g) => g.model && g.model !== "");
}

function computeUsableMemory(
  totalRamGB: number,
  totalVramMB: number,
  backend: ComputeBackend,
  hasDynamicVram: boolean,
): { usableVramGB: number; usableRamGB: number } {
  if (backend === "apple_metal" || hasDynamicVram) {
    const unified = totalRamGB * APPLE_UNIFIED_MEMORY_RATIO;
    return { usableVramGB: unified, usableRamGB: unified };
  }

  const vramGB = (totalVramMB / 1024) * DISCRETE_VRAM_USABLE_RATIO;
  const ramGB = totalRamGB * CPU_RAM_USABLE_RATIO;

  if (vramGB > 0) {
    return { usableVramGB: vramGB, usableRamGB: ramGB };
  }

  return { usableVramGB: 0, usableRamGB: ramGB };
}

export async function detectSystem(): Promise<SystemProfile> {
  const warnings: string[] = [];

  const [osInfo, cpu, mem, graphics, nvidiaGpus] = await Promise.all([
    si.osInfo(),
    si.cpu(),
    si.mem(),
    si.graphics(),
    getNvidiaSmiGpus(),
  ]);

  const siGpus: GpuInfo[] = (graphics.controllers ?? []).map((c) => ({
    vendor: c.vendor ?? "Unknown",
    model: c.model ?? "Unknown GPU",
    vramMB: c.vram ?? 0,
    vramDynamic: c.vramDynamic ?? false,
    memoryUsedMB: c.memoryUsed,
    memoryFreeMB: c.memoryFree,
  }));

  const gpus = mergeGpuData(siGpus, nvidiaGpus);

  if (nvidiaGpus.length > 0 && siGpus.every((g) => !g.vramMB)) {
    warnings.push("VRAM detected via nvidia-smi (systeminformation had incomplete data)");
  }

  const totalRamGB = Math.round((mem.total / 1024 ** 3) * 10) / 10;
  const freeRamGB = Math.round((mem.available / 1024 ** 3) * 10) / 10;
  const totalVramMB = gpus.reduce((sum, g) => sum + g.vramMB, 0);
  const hasDynamicVram = gpus.some((g) => g.vramDynamic);

  const computeBackend = inferComputeBackend(gpus, osInfo.platform);
  const { usableVramGB, usableRamGB } = computeUsableMemory(
    totalRamGB,
    totalVramMB,
    computeBackend,
    hasDynamicVram,
  );

  if (gpus.length === 0) {
    warnings.push("No GPU detected. Recommendations will use CPU/RAM only (slow)");
  } else if (computeBackend === "cpu_only") {
    warnings.push(
      "Integrated graphics only. Recommendations will use CPU/RAM (no CUDA/ROCm acceleration)",
    );
  }

  if (computeBackend === "apple_metal") {
    warnings.push(
      "Apple Silicon unified memory. Model budget uses ~70% of total RAM",
    );
  }

  return {
    os: {
      platform: osInfo.platform,
      arch: osInfo.arch,
      release: `${osInfo.distro ?? osInfo.platform} ${osInfo.release ?? ""}`.trim(),
      hostname: osInfo.hostname,
    },
    cpu: {
      manufacturer: cpu.manufacturer,
      brand: cpu.brand,
      cores: cpu.physicalCores,
      threads: cpu.cores,
      speedGHz: Math.round((cpu.speed ?? 0) * 10) / 10,
    },
    ram: {
      totalGB: totalRamGB,
      freeGB: freeRamGB,
      usableGB: Math.round(usableRamGB * 10) / 10,
    },
    gpus,
    computeBackend,
    totalVramGB: Math.round((totalVramMB / 1024) * 10) / 10,
    usableVramGB: Math.round(usableVramGB * 10) / 10,
    multiGpu: gpus.length > 1,
    detectionWarnings: warnings,
  };
}
