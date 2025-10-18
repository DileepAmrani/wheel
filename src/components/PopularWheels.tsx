import { PRESET_ITEMS, PRESETS } from "@/constants/presets";

function PopularWheels() {
  return (
    <section id="popular" className="mt-12">
      <h2 className="text-xl font-semibold mb-3 text-center">
        ✨ Or Try Our Popular Wheels Below
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => {
              const ev = new CustomEvent("qw:setItems", {
                detail: { items: PRESET_ITEMS[p.key].slice(0, 16) },
              });
              window.dispatchEvent(ev);
              const el = document.getElementById("builder");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="text-left rounded-2xl bg-white/80 border border-slate-200 p-4 hover:shadow transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl grid place-items-center bg-slate-900/5">
                {p.emoji}
              </div>
              <div>
                <div className="font-semibold">{p.label}</div>
                <div className="text-xs text-slate-500">
                  16 options available
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
export default PopularWheels;