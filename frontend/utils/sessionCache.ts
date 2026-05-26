export const sessionCache: Record<string, boolean> = {};

export const hasLoadedData = (key: string): boolean => {
  return !!sessionCache[key];
};

export const markDataLoaded = (key: string) => {
  sessionCache[key] = true;
};

export const clearSessionCache = () => {
  for (const k in sessionCache) delete sessionCache[k];
};
