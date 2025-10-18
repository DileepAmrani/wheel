export {};

declare global {
  interface Window {
    __afterAuth?: () => void;
  }
}
