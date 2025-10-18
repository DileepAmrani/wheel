import { PRESET_ITEMS, type PresetKey } from "@/constants/presets";
import { useState } from "react";

function BlogTeasers() {
  const [expanded, setExpanded] = useState<number | null>(null);

  const blogs = [
    {
      key: "names",
      title: "List of Names: Creative Ways to Use Name Wheels",
      content: `Name wheels are perfect for classrooms, raffles, giveaways, and team standups. Keep labels short (first names or initials) and check readability by previewing the wheel on mobile. Rotate themes: gold stars for student recognition, emojis for gamified rewards, or color-coded homerooms.\n\nFairness tip: after each spin, optionally remove the winning name to avoid repeats in the same session. For recurring use (e.g., daily helpers), save two public versions—one that removes winners automatically, and one that keeps all names for endless spins.\n\nEngagement ideas: award badges to winners, capture a quick photo of the spin result, and share to the class stream or Slack channel.`,
    },
    {
      key: "date",
      title: "Ideas for Date Night: Turn Decisions into an Adventure",
      content: `Indecision kills the vibe; a date wheel revives it. Mix quick options ("ice cream run", "board game café") with higher-effort plans ("sunset picnic", "museum + brunch"). Keep labels action-oriented and specific.\n\nPro tip: create seasonal wheels—cozy winter nights (hot cocoa + movie marathon), spring adventures (park picnic + kite flying). Save privately for you two, and save a public version for other couples to try.\n\nSafety: set budget and time-bound categories ("under 1 hour", "free date"). Share your wheel link with a partner so either of you can spin.`,
    },
    {
      key: "movie",
      title: "Movie Night: Crowd-Pleasing Picks Without the Debate",
      content: `Build buckets first: genre, mood, and platform ("comedy", "feel-good", "Disney+"). Alternate the slices weekly to keep it fresh. For families, swap in rating-based labels (G/PG/PG-13) and add a "Parent's Choice" slice as a wild card.\n\nAccessibility: keep text brief and high-contrast; preview on a TV to test readability from a couch distance. Add a "snack spin" companion wheel for popcorn flavors or themed treats.\n\nSEO tip: title your public wheel with specific keywords like "Movie Night Spinner – Comedy, Family, Netflix".`,
    },
    {
      key: "bottle",
      title: "Spin the Bottle (Wholesome Edition): Fun Prompts for All Ages",
      content: `Keep it friendly and inclusive: "tell a joke", "share a fun fact", "compliment someone", "silly dance". For younger kids, include quick crafts or charades. For work groups, pivot to "uplifting icebreakers" (gratitude shout-outs, team wins).\n\nModeration: establish ground rules first and allow "skip" or "free pass" slices. If recording, obtain consent for photos/videos.\n\nTip: save a public "Uplifting Spin the Bottle" wheel to help other facilitators discover it.`,
    },
    {
      key: "truth",
      title: "Truth or Dare: Keep It Safe, Silly, and Social",
      content: `Segment your slices: 50% light truths, 40% funny dares, 10% free passes. Avoid sensitive topics; focus on harmless fun ("most-used emoji?", "sing a line from a song").\n\nFacilitator mode: pin a "session code" in the wheel title (e.g., TeamRetro-042) so participants can reference the set later.\n\nVariation: run a "truth-only" session for remote teams as a conversation starter, then share highlights in your Slack channel.`,
    },
    {
      key: "dinner",
      title: "What’s For Dinner: End the Eternal Debate",
      content: `Map slices to cuisine first ("tacos", "stir-fry", "pasta"). Add budget tags ("$", "$$") or time boxes ("15 min", "30 min"). If you batch-cook, add "leftovers remix" as a slice.\n\nMeal planning hack: create a "weekday dinner" wheel with five go-to options and a "chef’s choice" wild card. Save publicly titled with local SEO cues ("Dinner Ideas Wheel – Quick Meals, Family Friendly").\n\nNutrition note: include a few veggie-forward options and link to your favorite recipe sites in your wheel description.`,
    },
    {
      key: "workout",
      title: "Workout Program: Stay Consistent with Variety",
      content: `Prevent boredom by rotating modalities—HIIT, yoga, core, run, cycle, mobility. Add duration tags ("15 min", "30 min"). For teams, create "office stretch break" wheels with safe movements.\n\nProgression: duplicate your wheel monthly and tweak intensity; keep "deload" or "walk" slices to encourage recovery.\n\nAccountability: save publicly and share with friends. Track completions by adding a log in your wheel notes.`,
    },
    {
      key: "team",
      title: "Team Building Games: Energize Meetings in Minutes",
      content: `Short, inclusive prompts work best: "emoji icebreaker", "two truths and a lie", "draw & guess", "mini trivia". Add "1-minute timer" or "3-minute timer" slices to keep pace.\n\nRemote tip: cast your wheel during video calls and let different teammates press the spin button. Save a public version titled "Team Building Spin – Remote Friendly" to be discoverable.\n\nOutcomes: end with a "kudos round" slice to highlight wins and boost morale.`,
    },
    {
      key: "chorus",
      title: "Chores Wheel: Practice Parts and Warm-Ups Playfully",
      content: `Label slices by section (soprano, alto, tenor, bass), techniques (breathing, dynamics), and warm-ups. Use the wheel to randomize who leads the next exercise.\n\nRehearsal flow: add "sight-reading" and "blend check" slices. Keep labels short so they stay readable on music stands.\n\nCommunity: share a public "Choir Practice Wheel" to help other directors find quick drills.`,
    },
  ];

  const useThisWheel = (key: PresetKey) => {
    const items = PRESET_ITEMS[key]?.slice(0, 16) || [];
    const ev = new CustomEvent("qw:setItems", { detail: { items } });
    window.dispatchEvent(ev);
    const el = document.getElementById("builder");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="blog" className="mt-12">
      <h2 className="text-xl font-semibold mb-3 text-center">
        📚 Blog & Guides
      </h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {blogs.map((b, i) => (
          <div
            key={b.key}
            className="rounded-2xl bg-white/80 border border-slate-200 p-4"
          >
            <h3 className="font-semibold text-lg mb-2">{b.title}</h3>
            <p className="text-sm text-slate-700 whitespace-pre-line">
              {expanded === i ? b.content : `${b.content.substring(0, 280)}...`}
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              <button
                onClick={() => setExpanded(expanded === i ? null : i)}
                className="text-indigo-600 font-medium hover:underline"
              >
                {expanded === i ? "Read less" : "Read more"}
              </button>
              <button
                onClick={() => useThisWheel(b.key as PresetKey)}
                className="px-3 py-1 rounded-full border hover:bg-slate-50"
              >
                Prefill & open wheel
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default BlogTeasers;
