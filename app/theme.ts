import { createTheme } from "@mantine/core";

/**
 * Elmi Mantine theme.
 * Primary color "elmi" is a muted sage teal centred on #5b9e8a at shade 6.
 * Use color="elmi" on Mantine components instead of the built-in "teal".
 * For sidebar-specific design tokens, use CSS vars defined in globals.css.
 */
export const theme = createTheme({
  primaryColor: "elmi",
  colors: {
    elmi: [
      "#f0f9f6", // 0 — lightest tint
      "#d9f0ea", // 1
      "#b3e0d3", // 2
      "#7ec9b9", // 3
      "#5bb5a4", // 4
      "#4da898", // 5
      "#5b9e8a", // 6 — primary brand (buttons, badges, active states)
      "#4a8a77", // 7
      "#3c7565", // 8
      "#2a5548", // 9 — darkest shade
    ],
  },
});
