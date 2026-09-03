// Types and initial-state values shared between actions.ts ("use server" —
// can only export async functions, not plain objects/consts) and the client
// components that call them via useActionState.

export type ProductFormState = {
  error: string | null;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialProductFormState: ProductFormState = { error: null };

export type DeleteProductState = { error: string | null };

export const initialDeleteProductState: DeleteProductState = { error: null };

export type CreatorSettingsFormState = {
  error: string | null;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialCreatorSettingsFormState: CreatorSettingsFormState = { error: null };
