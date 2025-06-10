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
        <div className="w-full max-w-sm">
          {/* Contenedor único con efecto Liquid Glass auténtico */}
          <div
            className="backdrop-blur-sm border border-white/20 rounded-2xl shadow-2xl overflow-hidden"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(21.8px) saturate(1.5)',
              boxShadow:
                '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Header con logo y título */}
            <div className="text-center pt-12 pb-8 px-8">
              <div className="flex justify-center mb-8">
                <div className="flex items-center gap-3 px-5 py-3 rounded-full backdrop-blur-md bg-white/10 border border-white/20 shadow-lg">
                  <LogoIcon size={22} />
                  <span className="text-white font-medium text-xl">
                    Confidens
                  </span>
                </div>
              </div>
              <h1 className="text-3xl font-extralight text-white mb-3 tracking-tight">
                Welcome back
              </h1>
              <p className="text-white/70 text-base font-light">
                A whole new element of delight
              </p>
            </div>

            {/* Formulario integrado */}
            <div className="px-6 pb-8">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
