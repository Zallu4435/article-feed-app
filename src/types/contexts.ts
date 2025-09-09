export interface KeyboardContextType {
  openSearch: () => void;
  closeSearch: () => void;
  isSearchOpen: boolean;
  online: boolean;
}

export type Theme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}
