'use server';

import { z } from 'zod';
import { AuthError } from 'next-auth';

import { createUser, getUser } from '../../lib/db/queries';

import { signIn } from './auth';

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export interface LoginActionState {
  status:
    | 'idle'
    | 'in_progress'
    | 'success'
    | 'failed'
    | 'invalid_data'
    | 'credentials_error';
}

export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    console.log('[Action] Attempting signIn with credentials...');
    await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    console.log('[Action] signIn attempt finished, returning success.');
    return { status: 'success' };
  } catch (error) {
    console.error('[Action] Login error:', error);
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          console.log('[Action] CredentialsSignin error caught.');
          return { status: 'credentials_error' };
        default:
          console.log(`[Action] AuthError caught: ${error.type}`);
          return { status: 'failed' };
      }
    }
    return { status: 'failed' };
  }
};

const registerFormSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters long.' }),
  firstName: z.string().min(1, { message: 'First name is required.' }),
  lastName: z.string().min(1, { message: 'Last name is required.' }),
});

export interface RegisterActionState {
  status:
    | 'idle'
    | 'in_progress'
    | 'success'
    | 'failed'
    | 'user_exists'
    | 'invalid_data';
  errors?: Partial<Record<keyof z.infer<typeof registerFormSchema>, string>>;
}

export const register = async (
  prevState: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> => {
  const validatedFields = registerFormSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
  });

  if (!validatedFields.success) {
    const fieldErrors: RegisterActionState['errors'] = {};
    for (const issue of validatedFields.error.issues) {
      if (issue.path.length > 0) {
        fieldErrors[issue.path[0] as keyof z.infer<typeof registerFormSchema>] =
          issue.message;
      }
    }
    return {
      status: 'invalid_data',
      errors: fieldErrors,
    };
  }

  const { email, password, firstName, lastName } = validatedFields.data;

  try {
    const existingUsers = await getUser(email);
    if (existingUsers.length > 0) {
      return {
        status: 'user_exists',
        errors: { email: 'Account already exists with this email.' },
      };
    }

    await createUser({
      email,
      password,
      firstName,
      lastName,
    });

    await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    return { status: 'success' };
  } catch (error) {
    console.error('[Action] Registration failed:', error);
    if (error instanceof AuthError) {
      return {
        status: 'failed',
        errors: { email: 'Sign in failed after registration.' },
      };
    }

    return {
      status: 'failed',
      errors: { email: 'An unexpected error occurred.' },
    };
  }
};
