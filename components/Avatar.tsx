const GRADIENTS = [
  ["#7c5cff", "#3ee6c1"],
  ["#ff7a59", "#ffc24b"],
  ["#3e9bff", "#7c5cff"],
  ["#ff5c9a", "#7c5cff"],
  ["#2fd4a0", "#3e9bff"],
  ["#ffb84b", "#ff5c7a"],
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Initial on a stable gradient. Characters get a recognizable look without stock photos. */
export function Avatar({ name, size = 40, seed }: { name: string; size?: number; seed?: string }) {
  const [a, b] = GRADIENTS[hash(seed ?? name) % GRADIENTS.length];
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: `linear-gradient(135deg, ${a}, ${b})`,
      }}
    >
      {name.charAt(0)}
    </span>
  );
}
