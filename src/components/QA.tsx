function QA() {
  const qaBase = [
    {
      q: "How many items can I add?",
      a: "Up to 16. Use Add item to add; remove with ✕. Labels stay readable on the wheel.",
    },
    {
      q: "How is the winner decided?",
      a: "Each slice has equal chance and is aligned under the pointer when the wheel stops.",
    },
    {
      q: "Do I need an account to save?",
      a: "Spin freely, but to save privately or publicly, sign up or log in when prompted.",
    },
  ];
  const qaExtra = [
    {
      q: "Can I play the Quick Pick Wheel with friends?",
      a: "Yes! Share the wheel link with friends or family so everyone can spin together.",
    },
    {
      q: "How can I share my wheel on social media?",
      a: "Use the Share button to post to Facebook, Messenger, TikTok, or copy a link for Instagram stories.",
    },
    {
      q: "Can I use Quick Pick Wheel for classrooms or events?",
      a: "Absolutely! It works great for raffles, classroom picks, and team-building games.",
    },
    {
      q: "What categories of wheels can I create?",
      a: "Dinner ideas, workouts, date nights, truth or dare, spin the bottle, and more.",
    },
    {
      q: "Can I edit a saved wheel later?",
      a: "Yes. Load your saved wheel from your account, update the items, and save again.",
    },
    {
      q: "Is Quick Pick Wheel free to use?",
      a: "Yes, spinning and creating wheels is free. Sign up to save your wheels.",
    },
    {
      q: "Can I embed my wheel on my website?",
      a: "Copy your wheel link and embed it via an iframe so visitors can spin it on your site.",
    },
    {
      q: "Do spins reset each session?",
      a: "The live counter tracks spins globally; your saved wheels remain in your browser or account.",
    },
    {
      q: "What’s the benefit of signing up?",
      a: "Save private/public wheels, share them easily, and access them on any device.",
    },
    {
      q: "Can businesses use Quick Pick Wheel?",
      a: "Yes—great for giveaways, promotions, and interactive meetings.",
    },
    {
      q: "How can I make the wheel look better?",
      a: "Keep labels short, use 8–12 items for readability, and try emojis for visual punch.",
    },
    {
      q: "Does the wheel remove the winner automatically?",
      a: "Currently it keeps all items; remove winners manually for no repeats.",
    },
    {
      q: "Can I play on mobile?",
      a: "Yes, the wheel is mobile-friendly and works great on phones and tablets.",
    },
    {
      q: "Are my wheels permanent?",
      a: "Public wheels are visible to the community; private wheels are stored in your account or browser.",
    },
  ];
  const all = [...qaBase, ...qaExtra];
  return (
    <section id="faq" className="mt-12">
      <h2 className="text-xl font-semibold mb-3 text-center">❓ Quick Q&A</h2>
      <div className="grid gap-3">
        {all.map(({ q, a }) => (
          <details
            key={q}
            className="rounded-2xl bg-white/80 border border-slate-200 p-4"
          >
            <summary className="font-semibold cursor-pointer">{q}</summary>
            <p className="mt-2 text-sm text-slate-600">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export default QA;
