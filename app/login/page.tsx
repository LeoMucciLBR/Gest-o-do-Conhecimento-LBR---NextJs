"use client";

import { useEffect, useState, Suspense } from "react";
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
import { SecurityModal } from "@/components/auth/SecurityModal";
import { toast } from 'sonner';

const schema = z.object({
  email: z.string().min(1, "Informe seu e-mail").email("E-mail inválido"),
  password: z.string().min(8, "Mínimo de 8 caracteres"),
});
type FormData = z.infer<typeof schema>;

type SecurityBlockType = 'BLOCKED' | 'RATE_LIMIT' | 'IP_BLOCKED' | 'COUNTRY_BLOCKED' | null;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPwd, setShowPwd] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | undefined>(undefined);

  // Security Modal State
  const [securityBlock, setSecurityBlock] = useState<SecurityBlockType>(null);
  const [securityData, setSecurityData] = useState<any>({});

  // Other Modal State
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
    setAttemptsLeft(undefined);
    
    try {
      const payload = { email: data.email.trim(), password: data.password };
      const response = await apiFetch<any>("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (response.isFirstLogin) {
        setVerificationEmail(data.email);
        
        try {
          await apiFetch("/auth/send-verification-code", {
            method: "POST",
            body: JSON.stringify({ email: data.email }),
          });
        } catch (err) {
          console.warn("Auto-send verification code failed:", err);
        }
        
        setShowVerifyModal(true);
        return;
      }

      // Login bem-sucedido
      reset({ email: data.email, password: "" });
      const from = searchParams.get('from') || '/';
      router.replace(from);
      router.refresh();
    } catch (e: any) {
      const errorCode = e?.code;
      const errorMessage = e?.message || "Falha ao entrar.";
      
      // Tratar códigos de erro de segurança
      if (errorCode === 'USER_BLOCKED' || errorCode === 'IP_BLOCKED' || 
          errorCode === 'RATE_LIMIT' || errorCode === 'COUNTRY_BLOCKED') {
        
        const type = errorCode === 'USER_BLOCKED' ? 'BLOCKED' : errorCode as SecurityBlockType;
        
        setSecurityBlock(type);
        setSecurityData({
          message: errorMessage,
          cooldownUntil: e?.cooldownUntil ? new Date(e.cooldownUntil) : undefined,
          attemptsLeft: e?.attemptsLeft,
          country: e?.country,
        });
      } else {
        // Erro de credenciais ou outro erro
        setErrorMsg(errorMessage);
        if (e?.attemptsLeft !== undefined) {
          setAttemptsLeft(e.attemptsLeft);
        }
      }
    }
  }

  const handleVerified = (token: string) => {
    setVerificationToken(token);
    setShowVerifyModal(false);
    setShowChangePasswordModal(true);
  };

  const handlePasswordChanged = () => {
    setShowChangePasswordModal(false);
    const from = searchParams.get('from') || '/';
    router.replace(from);
    router.refresh();
  };

  const handleSSOLogin = async (provider: string) => {
    setErrorMsg(null);
    toast.info(`SSO "${provider}" ainda não implementado.`);
  };

  const handleCloseSecurityModal = () => {
    setSecurityBlock(null);
    setSecurityData({});
  };

  // Bloquear submit se estiver bloqueado
  const isBlocked = securityBlock !== null;

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
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                      <p className="text-sm text-red-600 dark:text-red-400 font-semibold">
                        {errorMsg}
                      </p>
                      {attemptsLeft !== undefined && attemptsLeft > 0 && (
                        <p className="text-xs text-red-500 dark:text-red-400 mt-2">
                          Tentativas restantes: <strong>{attemptsLeft}</strong>
                        </p>
                      )}
                    </div>
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
                      disabled={isBlocked}
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
                      disabled={isBlocked}
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
                    className="w-full py-3.5 bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-600 hover:to-blue-800 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                    disabled={isSubmitting || isBlocked}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Entrando...
                        </>
                      ) : isBlocked ? (
                        "Acesso Bloqueado"
                      ) : (
                        "Entrar"
                      )}
                    </span>
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
                    className="w-full py-3.5 px-6 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-200 transition-all duration-200 font-semibold shadow-sm hover:shadow-md rounded-xl flex items-center justify-center gap-3 hover:border-blue-300 dark:hover:border-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleSSOLogin("microsoft")}
                    disabled={isBlocked}
                  >
                    <CloudKeyIcon className="h-5 w-5 text-[#00A4EF]" />
                    <span className="text-gray-700 dark:text-gray-200">
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

      {/* Security Modal */}
      {securityBlock && (
        <SecurityModal
          isOpen={true}
          onClose={handleCloseSecurityModal}
          type={securityBlock}
          data={securityData}
        />
      )}

      {/* Other Modals */}
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Carregando...</div>}>
      <LoginForm />
    </Suspense>
  );
}
