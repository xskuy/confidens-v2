import { Input } from './ui/input';
import { Label } from './ui/label';

export function AuthForm({
  action,
  children,
  defaultEmail = '',
  isRegisterForm = false,
}: {
  action: NonNullable<
    string | ((formData: FormData) => void | Promise<void>) | undefined
  >;
  children: React.ReactNode;
  defaultEmail?: string;
  isRegisterForm?: boolean;
}) {
  return (
    <form action={action} className="flex flex-col gap-4 px-4 sm:px-16">
      {isRegisterForm && (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="firstName"
              className="text-zinc-600 font-normal dark:text-zinc-400"
            >
              First Name
            </Label>
            <Input
              id="firstName"
              name="firstName"
              className="bg-muted text-md md:text-sm"
              type="text"
              placeholder="First Name"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="lastName"
              className="text-zinc-600 font-normal dark:text-zinc-400"
            >
              Last Name
            </Label>
            <Input
              id="lastName"
              name="lastName"
              className="bg-muted text-md md:text-sm"
              type="text"
              placeholder="Last Name"
              required
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label
          htmlFor="email"
          className="text-zinc-600 font-normal dark:text-zinc-400"
        >
          Email Address
        </Label>
        <Input
          id="email"
          name="email"
          className="bg-muted text-md md:text-sm"
          type="email"
          placeholder="user@acme.com"
          autoComplete="email"
          required
          autoFocus={!isRegisterForm}
          defaultValue={defaultEmail}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label
          htmlFor="password"
          className="text-zinc-600 font-normal dark:text-zinc-400"
        >
          Password
        </Label>
        <Input
          id="password"
          name="password"
          className="bg-muted text-md md:text-sm"
          type="password"
          required
          minLength={isRegisterForm ? 6 : undefined}
        />
      </div>

      {children}
    </form>
  );
}
