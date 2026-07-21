/**
 * Navigation helpers. Typed-route strings (`Href`) are only regenerated when the expo dev
 * server runs, so during parallel development we route through these string-based helpers to
 * avoid stale-type friction. Prefer `go()`/`replace()` over `<Link>` in feature code.
 */

import { router, type Href } from 'expo-router';

export const go = (path: string) => router.push(path as unknown as Href);
export const replace = (path: string) => router.replace(path as unknown as Href);
export const back = () => (router.canGoBack() ? router.back() : router.replace('/' as unknown as Href));

/** Navigate with route params (e.g. handing a picked file to the review screen). */
export const goWith = (pathname: string, params: Record<string, string>) =>
  router.push({ pathname, params } as unknown as Href);
export const replaceWith = (pathname: string, params: Record<string, string>) =>
  router.replace({ pathname, params } as unknown as Href);
