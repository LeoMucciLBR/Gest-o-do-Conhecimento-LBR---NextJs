"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ReactNode } from "react";

type Item = { label: string; to: string; icon?: ReactNode };

type Props = {
  title: string;
  to: string;
  image?: string;
  items?: Item[];
  className?: string;
};

export default function CardNav({
  title,
  to,
  image,
  items = [],
  className = "",
}: Props) {
  const router = useRouter();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(to)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(to);
        }
      }}
      aria-label={title}
      className={[
        "group relative overflow-hidden rounded-3xl",
        "w-[300px] h-[500px] shadow-2xl shadow-black/20",
        "transition-all duration-500 ease-out will-change-transform hover:scale-[1.03]",
        "focus:outline-none focus:ring-4 focus:ring-blue-500/40",
        "cursor-pointer border border-white/10",
        className,
      ].join(" ")}
    >
      {/* Fundo sempre visível (imagem) */}
      {image ? (
        <Image
          src={image}
          alt=""
          fill
          quality={100}
          priority
          className="object-cover z-0 transition-transform duration-700 ease-out group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, 500px"
        />
      ) : (
        <div className="absolute inset-0 bg-slate-900 z-0" />
      )}

      {/* Overlay gradiente base para legibilidade do título */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-60 z-10" />

      {/* Título padrão: canto inferior-esquerdo */}
      <div className="absolute inset-x-0 bottom-0 p-8 z-20 pointer-events-none transition-all duration-500 group-hover:-translate-y-2">
        <p className="text-white text-3xl font-bold tracking-tight drop-shadow-md">
          {title}
        </p>
        <div className="h-1 w-12 bg-blue-500 mt-3 rounded-full transition-all duration-500 group-hover:w-20 group-hover:bg-blue-400" />
      </div>

      {/* Painel Glassmorphism que APARECE no hover/focus */}
      <div
        className={[
          "absolute inset-0 z-30",
          "bg-black/60 backdrop-blur-md", // Efeito Glass
          "opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0",
          "transition-all duration-500 ease-out",
          "flex flex-col justify-center p-8",
        ].join(" ")}
      >
        {/* Cabeçalho no painel */}
        <div className="mb-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-75">
          <p className="text-3xl font-bold text-white mb-2">{title}</p>
          <p className="text-gray-300 text-sm font-medium">
            Selecione uma opção para continuar:
          </p>
        </div>

        {/* Lista de atalhos */}
        <ul className="space-y-3">
          {items.map((it, idx) => (
            <li 
              key={it.to}
              className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500"
              style={{ transitionDelay: `${100 + idx * 50}ms` }}
            >
              <Link
                href={it.to}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl
                           bg-[#2f4982] text-white
                           hover:bg-gradient-to-r hover:from-[#2f4982] hover:to-[#4a6fa5]
                           border border-white/10 hover:border-white/30
                           font-semibold text-sm shadow-lg shadow-black/20
                           transition-all duration-300 group/link"
                aria-label={it.label}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  {it.icon && <span className="shrink-0">{it.icon}</span>}
                  <span className="truncate">{it.label}</span>
                </div>
                <svg
                  className="w-4 h-4 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all duration-300"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
