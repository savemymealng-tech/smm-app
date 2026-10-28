import type { User } from '@/types';

export type ProfileForm = {
  first_name: string;
  last_name: string;
  username: string;
  phone: string;
  city: string;
};
export function profileForm(user?: User): ProfileForm {
  return {
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    username: user?.username || '',
    phone: user?.phone || '',
    city: user?.city || '',
  };
}
export function normalizeProfile(form: ProfileForm): ProfileForm {
  return {
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    username: form.username.trim(),
    phone: form.phone.replace(/[\s()-]/g, ''),
    city: form.city.trim(),
  };
}
export function profileErrors(
  form: ProfileForm,
): Partial<Record<keyof ProfileForm, string>> {
  const value = normalizeProfile(form);
  const errors: Partial<Record<keyof ProfileForm, string>> = {};
  if (!value.first_name) errors.first_name = 'Enter your first name.';
  if (!value.username) errors.username = 'Enter your username.';
  if (value.phone && !/^(\+234|0)\d{10}$/.test(value.phone))
    errors.phone = 'Use 08012345678 or +2348012345678.';
  for (const key of Object.keys(value) as (keyof ProfileForm)[]) {
    if (value[key].length > 255) errors[key] = 'Use 255 characters or fewer.';
  }
  return errors;
}
export function profileChanges(
  form: ProfileForm,
  original: ProfileForm,
): Partial<ProfileForm> {
  const next = normalizeProfile(form),
    before = normalizeProfile(original);
  return Object.fromEntries(
    (Object.keys(next) as (keyof ProfileForm)[])
      .filter((key) => next[key] !== before[key])
      .map((key) => [key, next[key]]),
  );
}
