/** True for phones and tablets (Android, iOS, iPadOS). False for PC and laptop desktops. */
export function isPcOrLaptop(userAgent = "", platform = "", maxTouchPoints = 0): boolean {
  const ua = userAgent;

  // iPadOS 13+ reports as Mac with touch
  if (
    (platform === "MacIntel" || platform === "iPad") &&
    maxTouchPoints > 1
  ) {
    return false;
  }

  const isMobileOrTablet =
    /Android|iPhone|iPod|iPad|Mobile|Tablet|webOS|BlackBerry|Opera Mini|IEMobile|Silk|Kindle|PlayBook/i.test(
      ua,
    );

  if (isMobileOrTablet) return false;

  return /Windows NT|Macintosh|Mac OS X|Linux(?!.*Android)|CrOS|Ubuntu|Fedora/i.test(
    ua,
  );
}

export function isMobileOrTabletDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return !isPcOrLaptop(
    navigator.userAgent,
    navigator.platform,
    navigator.maxTouchPoints,
  );
}

export const MOBILE_CONFIG_STORAGE_KEY = "what-model-mobile-config";

export interface MobileDeviceConfig {
  vramGB: number;
  ramGB: number;
}

export function loadMobileDeviceConfig(): MobileDeviceConfig | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(MOBILE_CONFIG_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MobileDeviceConfig;
    if (
      typeof parsed.vramGB === "number" &&
      typeof parsed.ramGB === "number"
    ) {
      return parsed;
    }
  } catch {
    // ignore corrupt storage
  }
  return null;
}

export function saveMobileDeviceConfig(config: MobileDeviceConfig): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(MOBILE_CONFIG_STORAGE_KEY, JSON.stringify(config));
}
