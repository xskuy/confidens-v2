import { LoginForm } from '@/app/(auth)/components/login-form';
import { LogoIcon } from '@/components/icons';

export default function LoginPage() {
  return (
    <div className="bg-black flex h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 relative overflow-hidden">
      {/* Efecto de iluminación avanzado */}
      <div
        className="absolute -inset-y-1/4 -right-24 flex w-screen flex-col xl:-right-6 xl:w-[1200px]"
        style={{
          maskImage:
            'linear-gradient(to right, rgba(255, 255, 255, 0), rgb(255, 255, 255))',
          opacity: 1,
          transform: 'none',
        }}
      >
        <div className="flex flex-col size-full blur">
          <div
            className="grow"
            style={{
              background:
                'conic-gradient(from 180deg at 99% 40% in lab, rgb(255, 255, 255) 18deg, rgb(255, 208, 134) 36deg, rgba(17, 17, 17, 0) 90deg, rgba(17, 17, 17, 0) 342deg, rgb(255, 255, 255) 360deg)',
            }}
          />
          <div
            className="grow"
            style={{
              background:
                'conic-gradient(from 0deg at 99% 60% in lab, rgb(255, 255, 255) 0deg, rgba(17, 17, 17, 0) 18deg, rgba(17, 17, 17, 0) 270deg, rgb(255, 208, 134) 324deg, rgb(255, 255, 255) 342deg)',
            }}
          />
        </div>
        <canvas
          className="absolute inset-0 size-full"
          width="1200"
          height="934"
        />
      </div>

      <div className="flex w-full max-w-sm flex-col gap-6 relative z-10">
        <a
          href="/"
          className="flex items-center gap-2 self-center font-medium text-white"
        >
          <div className="text-white flex size-6 items-center justify-center rounded-md">
            <LogoIcon size={16} />
          </div>
          Confidens
        </a>
        <LoginForm />
      </div>
    </div>
  );
}
