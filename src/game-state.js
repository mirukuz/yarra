export const SITE_IDS = ['lake', 'forest', 'ocean'];
export const SAMPLES_PER_SITE = 4;
export const TOTAL_SAMPLES = SITE_IDS.length * SAMPLES_PER_SITE;

export function createGameState() {
  return {
    collected: {
      lake: new Set(),
      forest: new Set(),
      ocean: new Set(),
    },
    gateOpened: false,
  };
}

export function collectItem(state, siteId, itemId) {
  const set = state.collected[siteId];
  if (!set || set.has(itemId)) return false;
  set.add(itemId);
  return true;
}

export function isItemCollected(state, siteId, itemId) {
  const set = state.collected[siteId];
  return set ? set.has(itemId) : false;
}

export function siteProgress(state, siteId) {
  const set = state.collected[siteId];
  return set ? set.size : 0;
}

export function isSiteComplete(state, siteId) {
  return siteProgress(state, siteId) >= SAMPLES_PER_SITE;
}

export function totalProgress(state) {
  return SITE_IDS.reduce((sum, id) => sum + siteProgress(state, id), 0);
}

export function isDatacenterUnlocked(state) {
  return SITE_IDS.every((id) => isSiteComplete(state, id));
}
