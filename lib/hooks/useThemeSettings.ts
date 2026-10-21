// lib/hooks/useThemeSettings.ts
import { useCallback } from "react";
import type { Theme } from "@/types/inventory";

interface UseThemeSettingsParams {
  refreshUser: () => Promise<void>;
}

/** Persists the theme preference; the provider applies it after refresh. */
export function useThemeSettings({ refreshUser }: UseThemeSettingsParams) {
  const updateTheme = useCallback(
    async (theme: Theme) => {
      try {
        await fetch("/api/users/update-theme", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme }),
        });
        await refreshUser();
      } catch {
        // The provider keeps the previous theme when the request fails.
      }
    },
    [refreshUser]
  );

  return { updateTheme };
}
