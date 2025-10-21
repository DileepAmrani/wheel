import { useState, useMemo, useEffect } from "react";
import { load, save } from "../utils";
import Wheel from "./Wheel";
import ShareModal from "./ShareModal";
import AuthModal from "./AuthModal";
import { PRESET_ITEMS, PRESETS, type PresetKey } from "@/constants/presets";
import { type User } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { toast } from "react-hot-toast";

function Builder({
  showConfetti,
  setShowConfetti,
  user,
}: {
  showConfetti: boolean;
  setShowConfetti: (show: boolean) => void;
  user: User | null;
}) {
  const [nameType, setNameType] = useState<"boys" | "girls" | "unisex">("boys");
  const [currentItems, setCurrentItems] = useState<string>("");


  const [title, setTitle] = useState("");
  const [items, setItems] = useState(
    load("qw_items", [
      "Green",
      "Yellow",
      "Purple",
      "Blue",
      "Orange",
      "Red",
      "Pink",
      "Teal",
    ])
  );
  const [locks, setLocks] = useState(() => items.map(() => false));
  const [authOpen, setAuthOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [wheelId, setWheelId] = useState<string | null>(null);
  const [winner, setWinner] = useState("");

  useEffect(() => {
    save("qw_items", items);
  }, [items]);

  useEffect(() => {
    const h = (e: CustomEvent<{ items: string[]; title?: string }>) => {
      const nextItems = e.detail?.items;
      if (Array.isArray(nextItems)) setItems(nextItems.slice(0, 16));

      const nextTitle = e.detail?.title;
      if (typeof nextTitle === "string") setTitle(nextTitle);
    };

    // Cast the handler since addEventListener expects a general EventListener
    window.addEventListener("qw:setItems", h as EventListener);

    return () => window.removeEventListener("qw:setItems", h as EventListener);
  }, []);

  useEffect(() => {
    setLocks((prev: boolean[]) => {
      const next = [...prev];
      if (next.length < items.length) {
        while (next.length < items.length) next.push(false);
      }
      if (next.length > items.length) {
        next.length = items.length;
      }
      return next;
    });
  }, [items]);

  const addItem = () => {
    if (items.length >= 16) return;
    setItems([...items, ""]);
  };

  const remove = (i: number) => {
    setItems(items.filter((_: string, idx: number) => idx !== i));
    setLocks(locks.filter((_: boolean, idx: number) => idx !== i));
  };

  const update = (i: number, val: string) =>
    setItems(items.map((v: string, idx: number) => (idx === i ? val : v)));
  const toggleLock = (i: number) =>
    setLocks(locks.map((v: boolean, idx: number) => (idx === i ? !v : v)));

  const IDEA_POOL = useMemo(() => {
    const all = Object.values(PRESET_ITEMS).flat();
    return Array.from(new Set(all.map(String)));
  }, []);

  const reserved = () =>
    new Set(
      items
        .filter((v: string, idx: number) => locks[idx] && v)
        .map((v: string) => v.trim())
        .filter(Boolean)
    );
    
  const regenerateOthers = () => {
    const keep = reserved();
    const pick = () => {
      const avail = IDEA_POOL.filter((x) => !keep.has(x));
      if (!avail.length) return "";
      const c = avail[Math.floor(Math.random() * avail.length)];
      keep.add(c);
      return c;
    };
    setItems(
      items
        .map((v: string, i: number) => (locks[i] ? v : pick() || v || "Option"))
        .slice(0, 16)
    );
  };
  const generateIdeas = () => {
    if (items.length === 0) {
      const set = new Set();
      const mk = () => {
        const a = IDEA_POOL.filter((x) => !set.has(x));
        const c = a.length ? a[Math.floor(Math.random() * a.length)] : "Idea";
        set.add(c);
        return c;
      };
      setItems(Array.from({ length: 8 }, mk));
      return;
    }
    const keep = reserved();
    const pick = () => {
      const a = IDEA_POOL.filter((x) => !keep.has(x));
      const c = a.length ? a[Math.floor(Math.random() * a.length)] : "";
      if (c) keep.add(c);
      return c;
    };
    setItems(
      items
        .map((v: string, i: number) => (locks[i] ? v : pick() || v || "Idea"))
        .slice(0, 16)
    );
  };

  const saveWheel = async (isPublic: boolean) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (title.trim() === "") {
      toast.error("Please enter a title");
      return;
    }

    const wheel = {
      title,
      items,
      isPublic,
      owner: user.uid,
      createdAt: new Date().toISOString(),
    };

    try {
      const docRef = await addDoc(collection(db, "wheels"), wheel);
      setWheelId(docRef.id);
      toast.success(`Saved ${isPublic ? "publicly" : "privately"}`);
    } catch (error) {
      console.error("Error saving wheel: ", error);
      toast.error("Failed to save wheel.");
    }
  };

  const onSpinEnd = (w: string) => {
    setWinner(w);
  };

  
  function getRandomPresetItems(key: PresetKey, count = 16): string[] {
    const preset = PRESET_ITEMS[key];

    if (!preset || !Array.isArray(preset)) return [];

    // Flatten if nested arrays (like names: [[], []])
    const allItems = Array.isArray(preset[0])
      ? (preset as string[][]).flat()
      : (preset as string[]);

    // Shuffle and pick random items
    return allItems
      .slice() // clone to avoid mutating
      .sort(() => Math.random() - 0.5)
      .slice(0, count);
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-stretch" id="builder">
      {/* left card */}
      <div className="rounded-2xl bg-white/80 border border-slate-200 p-4 h-full min-h-[560px] flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">🎯</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Wheel title"
            className="flex-1 px-3 py-2 rounded-xl border"
          />
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => {
                setItems(PRESET_ITEMS[p.key].flat().slice(0, 16));
                setCurrentItems(p.key);
              }}
              className="px-3 py-1 rounded-full bg-white border text-sm hover:bg-slate-50"
            >
              {p.emoji} {p.label}
            </button>
          ))}

        </div>

        <div className="flex-1 overflow-y-auto pr-1 mb-3">
          <div className="grid sm:grid-cols-2 gap-3">
            {items.map((v: string, i: number) => (
              <div key={i} className="flex items-center gap-2 min-w-0">
                <button
                  onClick={() => toggleLock(i)}
                  title={locks[i] ? "Unlock" : "Lock"}
                  className={`w-6 h-6 grid place-items-center rounded-lg border shrink-0 ${
                    locks[i]
                      ? "bg-amber-200 border-amber-400"
                      : "bg-slate-100 border-slate-200"
                  }`}
                >
                  {locks[i] ? "🔒" : "🔓"}
                </button>
                <input
                  value={v}
                  onChange={(e) => update(i, e.target.value)}
                  disabled={locks[i]}
                  className={`flex-1 min-w-0 px-3 py-2 rounded-xl border ${
                    locks[i] ? "bg-slate-50 text-slate-500" : ""
                  }`}
                />
                <button
                  onClick={() => remove(i)}
                  className="px-2 py-2 rounded-lg border shrink-0"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>


          {currentItems === "names" && (
            <div className="mt-3 flex flex-wrap items-center gap-4 mb-3 p-2 bg-slate-50 rounded-lg">
              <div className="text-sm font-medium">Name Type:</div>
              <div className="flex gap-3">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="nameType"
                    checked={nameType === "boys"}
                    onChange={() => {
                      setNameType("boys");
                      setItems(getRandomPresetItems("names", 16));
                    }}
                    className="accent-indigo-600"
                  />
                  <span>Boys</span>
                </label>

                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="nameType"
                    checked={nameType === "girls"}
                    onChange={() => {
                      setNameType("girls");
                      setItems(getRandomPresetItems("names", 16));
                    }}
                    className="accent-indigo-600"
                  />
                  <span>Girls</span>
                </label>

                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="nameType"
                    checked={nameType === "unisex"}
                    onChange={() => {
                      setNameType("unisex");
                      setItems(getRandomPresetItems("names", 16));
                    }}
                    className="accent-indigo-600"
                  />
                  <span>Unisex</span>
                </label>
              </div>
            </div>
          )}

        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={addItem} className="px-3 py-2 rounded-xl border">
            Add item
          </button>
          <button
            onClick={generateIdeas}
            className="px-3 py-2 rounded-xl border"
          >
            Generate ideas for me
          </button>
          <button
            onClick={regenerateOthers}
            className="px-3 py-2 rounded-xl border"
          >
            Regenerate others
          </button>
          <button
            onClick={() => saveWheel(false)}
            className="px-3 py-2 rounded-xl border"
          >
            Save private
          </button>
          <button
            onClick={() => saveWheel(true)}
            className="px-3 py-2 rounded-xl bg-indigo-600 text-white"
          >
            Save public
          </button>
          <button
            onClick={() => {
              if (!wheelId) {
                toast.error("Please save the wheel before sharing.");
                return;
              }
              setShareOpen(true);
            }}
            className="px-3 py-2 rounded-xl border"
          >
            Share
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Tip: lock items you like, then regenerate the rest. Max 16.
        </p>
      </div>

      {/* right card */}
      <div className="rounded-2xl bg-white/80 border border-slate-200 p-4 h-full min-h-[560px] grid place-items-center">
        <Wheel
          items={items.filter(Boolean)}
          onSpin={(w) => {
            onSpinEnd(w);
          }}
          showConfetti={showConfetti}
          setShowConfetti={setShowConfetti}
        />
        {winner && (
          <div className="mt-3 text-center">
            <div className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
              Winner!
            </div>
            <div className="mt-1 font-bold">{winner}</div>
          </div>
        )}
      </div>
      {shareOpen && wheelId && (
        <ShareModal wheelId={wheelId} onClose={() => setShareOpen(false)} />
      )}

      {authOpen && (
        <AuthModal
          onClose={() => setAuthOpen(false)}
          onSuccess={() => {
            const fn = window.__afterAuth;
            window.__afterAuth = undefined;
            if (fn) fn();
          }}
        />
      )}
    </div>
  );
}

export default Builder;
