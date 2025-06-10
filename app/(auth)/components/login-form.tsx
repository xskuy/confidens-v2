'use client';

import { cn } from '@/lib/utils';
import { signIn } from 'next-auth/react';

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/' });
  };

  const handleMicrosoftSignIn = () => {
    signIn('microsoft-entra-id', { callbackUrl: '/' });
  };

  return (
    <div className={cn('space-y-4', className)} {...props}>
      {/* Botones de login */}
      <div className="space-y-3">
        {/* Botón Google con efecto glass */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="group w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl backdrop-blur-sm bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
        >
          <div className="flex items-center justify-center size-5">
            <svg
              width="20"
              height="20"
              viewBox="0 0 32 32"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M23.75,16A7.7446,7.7446,0,0,1,8.7177,18.6259L4.2849,22.1721A13.244,13.244,0,0,0,29.25,16"
                fill="#00ac47"
              />
              <path
                d="M23.75,16a7.7387,7.7387,0,0,1-3.2516,6.2987l4.3824,3.5059A13.2042,13.2042,0,0,0,29.25,16"
                fill="#4285f4"
              />
              <path
                d="M8.25,16a7.698,7.698,0,0,1,.4677-2.6259L4.2849,9.8279a13.177,13.177,0,0,0,0,12.3442l4.4328-3.5462A7.698,7.698,0,0,1,8.25,16Z"
                fill="#ffba00"
              />
              <path
                d="M16,8.25a7.699,7.699,0,0,1,4.558,1.4958l4.06-3.7893A13.2152,13.2152,0,0,0,4.2849,9.8279l4.4328,3.5462A7.756,7.756,0,0,1,16,8.25Z"
                fill="#ea4335"
              />
              <path
                d="M29.25,15v1L27,19.5H16.5V14H28.25A1,1,0,0,1,29.25,15Z"
                fill="#4285f4"
              />
            </svg>
          </div>
          <span className="text-white font-medium text-base">
            Continue with Google
          </span>
        </button>

        {/* Botón Microsoft con efecto glass */}
        <button
          type="button"
          onClick={handleMicrosoftSignIn}
          className="group w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl backdrop-blur-sm bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
        >
          <div className="flex items-center justify-center size-5">
            <svg
              width="20"
              height="20"
              viewBox="0 0 16 16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path fill="#F35325" d="M1 1h6.5v6.5H1V1z" />
              <path fill="#81BC06" d="M8.5 1H15v6.5H8.5V1z" />
              <path fill="#05A6F0" d="M1 8.5h6.5V15H1V8.5z" />
              <path fill="#FFBA08" d="M8.5 8.5H15V15H8.5V8.5z" />
            </svg>
          </div>
          <span className="text-white font-medium text-base">
            Continue with Microsoft
          </span>
        </button>
      </div>

      {/* Términos y condiciones */}
      <div className="text-center pt-3">
        <p className="text-white/50 text-xs font-light leading-relaxed">
          By continuing, you agree to our{' '}
          <a
            href="/terms"
            className="text-white/70 hover:text-white underline underline-offset-4 decoration-white/30 hover:decoration-white/70 transition-colors"
          >
            Terms of Service
          </a>{' '}
          and{' '}
          <a
            href="/privacy"
            className="text-white/70 hover:text-white underline underline-offset-4 decoration-white/30 hover:decoration-white/70 transition-colors"
          >
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
