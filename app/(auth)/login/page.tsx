import { LoginForm } from '@/app/(auth)/components/login-form';
import { LogoIcon } from '@/components/icons';

export default function LoginPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Imagen de fondo nocturna */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/images/login-background.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Overlay con configuración Liquid Glass */}
      <div className="absolute inset-0 z-1 bg-black/42" />

      {/* Contenido principal */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Contenedor con glassmorphism más sólido y cuadrado */}
          <div className="backdrop-blur-[28px] bg-black/[0.45] dark:bg-black/[0.50] border border-white/[0.15] dark:border-white/[0.12] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.45),0_1px_1px_rgba(255,255,255,0.12)_inset] hover:shadow-[0_12px_40px_rgba(0,0,0,0.52)] transition-all duration-300 ease-out overflow-hidden">
            {/* Header con logo y título */}
            <div className="text-center pt-10 pb-6 px-8">
              <div className="flex justify-center mb-6">
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-full backdrop-blur-xl bg-white/[0.08] dark:bg-white/[0.06] border border-white/[0.15] dark:border-white/[0.12] shadow-[0_4px_20px_rgba(0,0,0,0.25),0_1px_1px_rgba(255,255,255,0.12)_inset]">
                  <LogoIcon size={20} />
                  <span className="text-white/[0.95] font-medium text-lg">
                    Confidens
                  </span>
                </div>
              </div>
              <h1 className="text-3xl font-light text-white/[0.95] mb-3 tracking-tight">
                Bienvenido de vuelta
              </h1>
              <p className="text-white/[0.75] text-base font-light">
                Accede a tu experiencia personalizada
              </p>
            </div>

            {/* Formulario integrado */}
            <div className="px-8 pb-8">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
