export type FormState = {
  error?: string;
  errors?: Record<string, string[]>;
  success?: string;
  id?: string;
  version?: string;
  values?: Record<string, string | number | boolean>;
};
