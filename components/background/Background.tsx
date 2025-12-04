import React from "react";

type Props = {
  /** "none" | "dark" | "light" — controla a sobreposição para legibilidade */
  overlay?: "none" | "dark" | "light";
  className?: string;
};

export const Background: React.FC<Props> = ({
  overlay = "dark",
  className = "",
}) => {
  return (
    <div
      aria-hidden="true"
      className={[
        "fixed inset-0 -z-10 overflow-hidden select-none pointer-events-none bg-[#0f172a]",
        className,
      ].join(" ")}
    >
      {/* Noise Texture Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* overlay opcional para contraste do conteúdo */}
      {overlay !== "none" && (
        <div
          className={[
            "absolute inset-0 z-10",
            overlay === "dark"
              ? "bg-black/20"
              : "bg-white/20 backdrop-blur-[1px]",
          ].join(" ")}
        />
      )}
    </div>
  );
};

export default Background;
