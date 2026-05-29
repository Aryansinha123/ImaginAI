"use client";

export default function CharacterTraits({ title, items = [], variant = "purple" }) {
  const badgeColors = {
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20 icon-color-purple-400",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 icon-color-emerald-400",
    red: "bg-red-500/10 text-red-400 border-red-500/20 icon-color-red-400",
    pink: "bg-pink-500/10 text-pink-400 border-pink-500/20 icon-color-pink-400",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20 icon-color-blue-400",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20 icon-color-amber-400",
  };

  const checkMarkColors = {
    purple: "text-purple-400",
    emerald: "text-emerald-400",
    red: "text-red-400",
    pink: "text-pink-400",
    blue: "text-blue-400",
    amber: "text-amber-400"
  };

  const currentBadge = badgeColors[variant] || badgeColors.purple;
  const checkColor = checkMarkColors[variant] || checkMarkColors.purple;

  return (
    <div className="space-y-2">
      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block font-semibold">
        {title}
      </span>
      <div className="flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((item, idx) => (
            <span
              key={idx}
              className={`flex items-center gap-1 text-[11px] px-3 py-1 rounded-xl border font-semibold ${currentBadge}`}
            >
              <span className={checkColor}>✓</span>
              {item}
            </span>
          ))
        ) : (
          <span className="text-xs text-zinc-600 font-mono italic">None defined</span>
        )}
      </div>
    </div>
  );
}
