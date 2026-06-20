import { describe, it, expect } from "vitest";
import {
  estimateVram,
  findBestQuantization,
  BYTES_PER_PARAM,
} from "@/lib/engine/vram";

describe("estimateVram", () => {
  it("estimates 7B at Q4_K_M within expected range", () => {
    const est = estimateVram(7, "Q4_K_M");
    expect(est.weightsGB).toBeCloseTo(7 * BYTES_PER_PARAM.Q4_K_M, 0);
    expect(est.totalGB).toBeGreaterThan(4);
    expect(est.totalGB).toBeLessThan(10);
  });

  it("estimates 70B at Q4_K_M above 40GB", () => {
    const est = estimateVram(70, "Q4_K_M");
    expect(est.totalGB).toBeGreaterThan(40);
    expect(est.totalGB).toBeLessThan(55);
  });

  it("FP16 uses more memory than Q4", () => {
    const q4 = estimateVram(8, "Q4_K_M");
    const fp16 = estimateVram(8, "FP16");
    expect(fp16.totalGB).toBeGreaterThan(q4.totalGB);
  });

  it("longer context increases total memory", () => {
    const shortCtx = estimateVram(14, "Q4_K_M", 4096);
    const longCtx = estimateVram(14, "Q4_K_M", 32768);
    expect(longCtx.kvCacheGB).toBeGreaterThan(shortCtx.kvCacheGB);
    expect(longCtx.totalGB).toBeGreaterThan(shortCtx.totalGB);
  });
});

describe("findBestQuantization", () => {
  it("finds best quant for 7B on 8GB GPU", () => {
    const q = findBestQuantization(7, 8);
    expect(["Q4_K_M", "Q5_K_M"]).toContain(q);
  });

  it("finds higher quant for larger VRAM", () => {
    const q = findBestQuantization(7, 24);
    expect(q).toBe("FP16");
  });

  it("returns null when nothing fits", () => {
    const q = findBestQuantization(70, 4);
    expect(q).toBeNull();
  });
});
