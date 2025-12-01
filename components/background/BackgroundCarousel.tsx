"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Props = { images: string[]; intervalMs?: number; alt?: string };

export default function BackgroundCarousel({
  images,
  intervalMs = 6500,
  alt = "LBR engenharia",
}: Props) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(
      () => setIdx((i) => (i + 1) % images.length),
      intervalMs
    );
    return () => clearInterval(id);
  }, [images, intervalMs]);

  if (!images || images.length === 0) {
    // fallback simples: gradiente
    return (
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-600 via-sky-500 to-emerald-400" />
    );
  }

  return (
    <div className="absolute inset-0 -z-10">
      {images.map((src, i) => (
        <Image
          key={src + i}
          src={src}
          alt={alt}
          fill
          priority={i === 0}
          quality={100}
          className={[
            "object-cover",
            "blur-[5px] brightness-75 scale-105 transition duration-[1800ms] will-change-transform will-change-opacity",
            i === idx ? "opacity-100 scale-100" : "opacity-0",
          ].join(" ")}
        />
      ))}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(1000px 600px at -10% -10%, rgba(255,255,255,.25), transparent 60%), linear-gradient(180deg, rgba(10,20,35,.45), rgba(10,20,35,.55))",
        }}
      />
    </div>
  );
}
