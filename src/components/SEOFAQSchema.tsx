function SEOFAQSchema() {
  const mainEntity = [
    {
      q: "How many items can I add?",
      a: "You can add up to 16 items to the wheel. Use Add item to insert more and ✕ to remove.",
    },
    {
      q: "How is the winner decided?",
      a: "Each spin randomly selects a slice with equal probability, then aligns that slice under the top pointer.",
    },
    {
      q: "Do I need an account to save?",
      a: "No account is required to spin. To save wheels privately or publicly, you'll be prompted to sign up or log in.",
    },
    {
      q: "Can I play the Quick Pick Wheel with friends?",
      a: "Yes—share your wheel link so everyone can spin together.",
    },
    {
      q: "How can I share my wheel on social media?",
      a: "Use the Share button for Facebook, Messenger, TikTok, or copy a link for Instagram.",
    },
    {
      q: "Can I use Quick Pick Wheel for classrooms or events?",
      a: "Yes—great for raffles, classroom picks, and team-building.",
    },
    {
      q: "What categories of wheels can I create?",
      a: "Dinner ideas, workouts, date nights, truth or dare, spin the bottle, and more.",
    },
    {
      q: "Can I edit a saved wheel later?",
      a: "Load your saved wheel from your account, update items, and save again.",
    },
    {
      q: "Is Quick Pick Wheel free to use?",
      a: "Yes, spinning and creating wheels is free.",
    },
    {
      q: "Can I embed my wheel on my website?",
      a: "Copy your share link and embed it with an iframe.",
    },
    {
      q: "Do spins reset each session?",
      a: "The live counter tracks global spins in real time.",
    },
    {
      q: "What’s the benefit of signing up?",
      a: "Save private/public wheels and access them anywhere.",
    },
    {
      q: "Can businesses use Quick Pick Wheel?",
      a: "Yes—for giveaways, promotions, and interactive meetings.",
    },
    {
      q: "How can I make the wheel look better?",
      a: "Use short labels, 8–12 items, and emojis for readability.",
    },
    {
      q: "Does the wheel remove the winner automatically?",
      a: "Currently winners remain; remove manually if needed.",
    },
    {
      q: "Can I play on mobile?",
      a: "Yes, the experience is mobile-friendly.",
    },
    {
      q: "Are my wheels permanent?",
      a: "Public wheels are community-visible; private wheels live in your account/browser.",
    },
  ].map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  }));
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: mainEntity,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default SEOFAQSchema;
