/**
 * Public-folder URLs. GitHub Pages serves the site under `/<repo>/`, so files
 * in `public/` need that prefix; next/link and metadata get it automatically
 * from `basePath`, plain `src` attributes and fetches do not. Empty locally.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const asset = (path: string) => `${BASE_PATH}${path}`;
