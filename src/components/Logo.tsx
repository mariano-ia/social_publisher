/**
 * Social Publisher wordmark + mark. Uses Antonio (display) for the wordmark
 * to match the Yacaré typography language. Purple gradient mark on the left.
 */
export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims = size === "sm" ? { mark: 24, text: 14 } : size === "lg" ? { mark: 40, text: 22 } : { mark: 32, text: 18 };
  return (
    <div className="flex items-center gap-2.5">
      <svg
        width={dims.mark}
        height={dims.mark}
        viewBox="0 0 64 64"
        fill="none"
        className="flex-shrink-0"
      >
        <defs>
          <linearGradient id="sp-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8A5EFF" />
            <stop offset="100%" stopColor="#6D28D9" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="14" fill="url(#sp-grad)" />
        <path
          d="M18 40 L28 20 L36 36 L46 20"
          stroke="#fff"
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="48" cy="18" r="4" fill="#fff" />
      </svg>
      <span
        className="font-display uppercase tracking-tight leading-none"
        style={{ fontSize: dims.text, fontWeight: 700, letterSpacing: "-0.02em" }}
      >
        social<span className="text-[var(--accent)]">.</span>publisher
      </span>
    </div>
  );
}
