"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import BackgroundCarousel from "@/components/background/BackgroundCarousel";
import InputIcon from "@/components/ui/InputIcon";
import {
  LockIcon,
  MailIcon,
  EyeIcon,
  EyeOffIcon,
  CloudKeyIcon,
} from "@/components/ui/icons";
import Image from "next/image";
import { apiFetch } from "@/lib/api/api";
import { VerificationModal } from "@/components/auth/VerificationModal";
import { ChangePasswordModal } from "@/components/auth/ChangePasswordModal";

const schema = z.object({
  email: z.string().min(1, "Informe seu e-mail").email("E-mail inválido"),
  password: z.string().min(8, "Mínimo de 8 caracteres"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPwd, setShowPwd] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal State
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationToken, setVerificationToken] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  // Se já houver sessão válida, redireciona automaticamente
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const me = await apiFetch<{ user: { id: string } }>("/auth/session", {
          method: "GET",
        });
        if (!ignore && me?.user) {
          const from = searchParams.get('from') || '/';
          router.replace(from);
        }
      } catch {
        // sem sessão: permanece na tela
      }
    })();
    return () => {
      ignore = true;
    };
  }, [router, searchParams]);

  async function onSubmit(data: FormData) {
    setErrorMsg(null);
    try {
      const payload = { email: data.email.trim(), password: data.password };
      const response = await apiFetch<any>("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (response.isFirstLogin) {
        // Primeiro acesso detectado
        setVerificationEmail(data.email);
        
        // Tentar enviar código automaticamente, mas não bloquear se falhar (rate limit)
        // O usuário poderá clicar em "Reenviar" no modal se necessário
        try {
          await apiFetch("/auth/send-verification-code", {
            method: "POST",
            body: JSON.stringify({ email: data.email }),
          });
        } catch (err) {
          console.warn("Auto-send verification code failed:", err);
          // Não mostramos erro aqui, deixamos o modal abrir e o usuário tentar reenviar se não chegar
        }
        
        setShowVerifyModal(true);
        return;
      }

      // limpa apenas o campo senha e redireciona para a URL original
      reset({ email: data.email, password: "" });
      const from = searchParams.get('from') || '/portal';
      router.replace(from);
      router.refresh();
    } catch (e: any) {
      setErrorMsg(e?.message || "Falha ao entrar.");
    }
  }

  const handleVerified = (token: string) => {
    setVerificationToken(token);
    setShowVerifyModal(false);
    setShowChangePasswordModal(true);
  };

  const handlePasswordChanged = () => {
    setShowChangePasswordModal(false);
    // Login automático já foi feito pelo backend na troca de senha
    const from = searchParams.get('from') || '/portal';
    router.replace(from);
    router.refresh();
  };

  const handleSSOLogin = async (provider: string) => {
    setErrorMsg(null);
    alert(`SSO "${provider}" ainda não implementado.`);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <BackgroundCarousel
        images={[
          "/images/login-1.jpg",
          "/images/login-2.jpg",
          "/images/login-3.jpg",
        ]}
      />

      <main className="relative z-10 w-full max-w-[960px] mx-auto grid min-h-screen content-center justify-items-center gap-3 p-6">
        <Image
          src="/images/LogoBranca.png"
          alt="lbr engenharia e consultoria"
          width={200}
          height={96}
          className="h-20 md:h-22 lg:h-24 w-auto drop-shadow-[0_2px_6px_rgba(0,0,0,.35)] mx-auto"
          priority
        />

        <header className="text-center text-white dark:text-gray-100 mt-2">
          <h1 className="mt-2 font-extrabold text-[26px] md:text-[32px] lg:text-[36px] leading-[1.15] drop-shadow-[0_2px_6px_rgba(0,0,0,.35)]">
            Sistema de Gestão do Conhecimento
          </h1>
        </header>

        <div className="w-full sm:max-w-xl sm:mx-auto">
          <div className="w-full flex items-center justify-center p-1">
            <div className="w-full max-w-md animate-fade-in">
              <div className="bg-white dark:bg-slate-800 backdrop-blur-xl border border-gray-200 dark:border-slate-700 rounded-3xl shadow-lg p-8">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-lbr-primary dark:text-blue-400 mb-2">
                    Login
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    Entre com sua conta para continuar
                  </p>
                </div>

                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-6"
                  noValidate
                >
                  {errorMsg && (
                    <p className="text-sm text-red-600 dark:text-red-400 font-semibold">
                      {errorMsg}
                    </p>
                  )}

                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="text-lbr-primary dark:text-blue-400 font-semibold text-sm"
                    >
                      Email
                    </label>

                    <InputIcon
                      id="email"
                      type="email"
                      placeholder="seunome@lbreng.com.br"
                      aria-label="E-mail corporativo"
                      leftIcon={<MailIcon />}
                      error={errors.email?.message}
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500 dark:text-red-400">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="password"
                        className="text-lbr-primary dark:text-blue-400 font-semibold text-sm"
                      >
                        Senha
                      </label>
                      <a
                        href="#"
                        className="text-sm text-lbr-primary dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      >
                        Esqueceu a senha?
                      </a>
                    </div>

                    <InputIcon
                      id="password"
                      type={showPwd ? "text" : "password"}
                      placeholder="mínimo de 8 caracteres"
                      aria-label="Senha"
                      leftIcon={<LockIcon />}
                      rightSlot={
                        <button
                          type="button"
                          onClick={() => setShowPwd((v) => !v)}
                          aria-pressed={showPwd}
                          aria-label={
                            showPwd ? "Ocultar senha" : "Mostrar senha"
                          }
                          title={showPwd ? "Ocultar senha" : "Mostrar senha"}
                          className="p-2 rounded-md text-lbr-primary dark:text-blue-400 hover:bg-lbr-primary/10 dark:hover:bg-blue-400/10 focus:outline-none focus:ring-2 focus:ring-lbr-primary/40 dark:focus:ring-blue-400/40"
                        >
                          {showPwd ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                      }
                      error={errors.password?.message}
                      {...register("password")}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-lbr-primary dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 text-white font-semibold rounded-lg transition-all duration-300 shadow-md disabled:opacity-70"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Entrando..." : "Entrar"}
                  </button>
                </form>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white/80 dark:bg-slate-800/80 text-gray-500 dark:text-gray-400">
                      Ou entre com
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    className="mt-1 inline-flex items-center justify-center gap-2 py-2 px-6 bg-white dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-200 w-full transition ease-in duration-200 text-center text-base font-semibold shadow-md rounded-lg"
                    onClick={() => handleSSOLogin("microsoft")}
                  >
                    <CloudKeyIcon className="mr-2 h-5 w-5 text-[#00A4EF]" />
                    <span className="text-lbr-primary dark:text-blue-400">
                      Continuar com Microsoft
                    </span>
                  </button>
                </div>
              </div>

              <p className="mt-8 text-center text-xs text-white/70">
                Ao continuar, você concorda com nossos{" "}
                <a href="#" className="text-white hover:underline">
                  Termos de Serviço
                </a>{" "}
                e{" "}
                <a href="#" className="text-white hover:underline">
                  Política de Privacidade
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <VerificationModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        email={verificationEmail}
        onVerified={handleVerified}
      />

      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        email={verificationEmail}
        token={verificationToken}
        onSuccess={handlePasswordChanged}
      />
    </div>
  );
}
