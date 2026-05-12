export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('Storage access failed', e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('Storage set failed', e);
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('Storage remove failed', e);
    }
  }
};

export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    try {
      return sessionStorage.getItem(key);
    } catch (e) {
      console.warn('SessionStorage access failed', e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      sessionStorage.setItem(key, value);
    } catch (e) {
      console.warn('SessionStorage set failed', e);
    }
  },
  removeItem: (key: string): void => {
    try {
      sessionStorage.removeItem(key);
    } catch (e) {
      console.warn('SessionStorage remove failed', e);
    }
  }
};
