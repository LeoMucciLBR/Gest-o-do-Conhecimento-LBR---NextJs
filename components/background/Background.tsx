import Image from "next/image";
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
        "fixed inset-0 -z-10 overflow-hidden select-none pointer-events-none",
        className,
      ].join(" ")}
    >
      {/* imagem cobre toda a tela */}
      <Image
        src="/images/elements3.png"
        alt=""
        fill
        priority
        quality={100}
        className="object-cover"
      />

      {/* overlay opcional para contraste do conteúdo */}
      {overlay !== "none" && (
        <div
          className={[
            "absolute inset-0",
            overlay === "dark"
              ? "bg-black/35"
              : "bg-white/20 backdrop-blur-[1px]",
          ].join(" ")}
        />
      )}
    </div>
  );
};

export default Background;
