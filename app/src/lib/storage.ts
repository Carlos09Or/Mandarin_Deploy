// Asks the browser not to clear this site's data when the device runs low on space. A guest's progress lives only here,
// so it is worth asking; the browser may say no (Chrome decides from how much the site is used, Safari ignores it).

export function keepStorage() {
  try {
    void navigator.storage?.persist?.().catch(() => undefined)
  } catch {
    /* not supported: nothing to do */
  }
}

/** iPhone and iPad Safari clear a site's data after a week unused, unless the app was added to the Home Screen. */
export const needsHomeScreen = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) && !(navigator as Navigator & { standalone?: boolean }).standalone && !matchMedia('(display-mode: standalone)').matches
