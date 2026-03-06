"use client";

/**
 * Bubble — Speech bubble for SLOTY plaza.
 *
 * Positioned relative to the avatar's headTop via CSS.
 * The parent container should use `position: relative` and place
 * the Bubble as a direct child above the AvatarFigure.
 *
 * Uses bottom: 100% so it always sits above whatever is below it,
 * regardless of avatar size.
 */
export default function Bubble({
  text,
  visible = true,
}: {
  text: string;
  visible?: boolean;
}) {
  if (!text) return null;
  return (
    <div
      className="pointer-events-none absolute left-1/2 transition-all duration-[800ms] ease-in-out"
      style={{
        bottom: "100%",
        marginBottom: 4,
        opacity: visible ? 1 : 0,
        transform: `translateX(-50%) translateY(${visible ? "0" : "4px"})`,
      }}
    >
      <div
        className="relative whitespace-nowrap rounded-2xl px-3 py-1.5 text-[11px] font-medium leading-snug"
        style={{
          backgroundColor: "rgba(255,255,255,0.95)",
          color: "#2A2A3A",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(0,0,0,0.04)",
          maxWidth: 150,
          overflow: "hidden",
          textOverflow: "ellipsis",
          backdropFilter: "blur(4px)",
          letterSpacing: "0.02em",
        }}
      >
        {text}
        {/* Tail — soft triangle */}
        <span
          className="absolute left-1/2 -translate-x-1/2 -bottom-[6px]"
          style={{
            width: 0,
            height: 0,
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: "7px solid rgba(255,255,255,0.95)",
            filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.04))",
          }}
        />
      </div>
    </div>
  );
}
