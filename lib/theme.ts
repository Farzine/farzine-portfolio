export const themeStorageKey = "portfolio-theme";
// Fixed source, never CMS input. Runs before paint; storage failure keeps dark.
export const themeBootstrap = `try{if(localStorage.getItem("${themeStorageKey}")==="light")document.documentElement.dataset.theme="light"}catch{}`;
