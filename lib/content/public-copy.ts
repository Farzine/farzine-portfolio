export const defaultPublicCopy = {
  technology: "Tech Stack",
  website: "Website URL",
  source: "Github URL",
  sourceLink: "Project Link",
  download: "Download",
  apk: "APK File",
  projectDetails: "Project details",
  openProject: "Open project page",
  closeProject: "Close project details",
  backProjects: "← Back to projects",
  filter: "Filter projects",
  shown: "projects shown",
  empty: "Nothing published here yet.",
  mainNav: "Main",
  mobileNav: "Mobile",
  openNav: "Open navigation",
  closeNav: "Close navigation",
  socialNav: "Social links",
  lightTheme: "Light theme",
  darkTheme: "Dark theme",
};
export type PublicCopy = typeof defaultPublicCopy;
export type PublicCopyKey = keyof PublicCopy;
export function isPublicCopyKey(value: string): value is PublicCopyKey {
  return Object.hasOwn(defaultPublicCopy, value);
}
