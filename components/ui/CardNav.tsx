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
        "group relative overflow-hidden rounded-2xl",
        "w-[300px] h-[500px] shadow-[0_0_20px_8px_rgba(0,0,0,.08)]",
        "transition will-change-transform hover:scale-[1.07]",
        "focus:outline-none focus:ring-4 focus:ring-lbr-primary/30 dark:focus:ring-blue-500/30",
        "cursor-pointer",
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
          className="object-cover z-0"
          sizes="300px"
        />
      ) : (
        <div className="absolute inset-0 bg-lbr-primary z-0" />
      )}

      {/* Título padrão: canto inferior-esquerdo sobre a foto */}
      <div className="absolute inset-x-0 bottom-0 p-4 z-10 pointer-events-none">
        <div className="bg-gradient-to-t from-black/60 via-black/20 to-transparent absolute inset-x-0 bottom-0 h-28" />
        <p className="relative text-white text-[26px] font-extrabold leading-tight">
          {title}
        </p>
      </div>

      {/* Painel azul que APARECE no hover/focus (sobe) e mostra a lista */}
      <div
        className={[
          "absolute inset-0 z-20 rounded-2xl bg-lbr-primary dark:bg-blue-900 text-white",
          "translate-y-full group-hover:translate-y-0 group-focus-within:translate-y-0",
          "transition-transform duration-700 ease-out",
          "flex flex-col justify-end p-6 gap-3",
        ].join(" ")}
      >
        {/* Cabeçalho no painel */}
        <div className="mb-2">
          <p className="text-[26px] font-extrabold leading-tight">{title}</p>
          <p className="text-xs/5 opacity-80">
            Acesse diretamente um conteúdo:
          </p>
        </div>

        {/* Lista de atalhos */}
        <ul className="grid gap-2">
          {items.map((it) => (
            <li key={it.to}>
              <Link
                href={it.to}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 px-3 py-2 rounded-lg
                           bg-white/95 hover:bg-white text-lbr-primary font-semibold text-sm
                           shadow-sm transition scale hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-lbr-primary"
                aria-label={it.label}
              >
                {it.icon && <span className="shrink-0">{it.icon}</span>}
                <span className="truncate">{it.label}</span>
                <svg
                  className="w-4 h-4 ml-auto"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
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
