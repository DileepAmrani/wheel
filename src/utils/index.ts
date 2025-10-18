/******************** Utilities ********************/
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const load = (k: string, f: any) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : f;
  } catch {
    return f;
  }
};
const save = (k: string, v: any) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};

export { uid, load, save };
