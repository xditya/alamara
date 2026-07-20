/**
 * Navigation helpers. Typed-route strings (`Href`) are only regenerated when the expo dev
 * server runs, so during parallel development we route through these string-based helpers to
 * avoid stale-type friction. Prefer `go()`/`replace()` over `<Link>` in feature code.
 */

import { router, type Href } from 'expo-router';

export const go = (path: string) => router.push(path as unknown as Href);
export const replace = (path: string) => router.replace(path as unknown as Href);
export const back = () => (router.canGoBack() ? router.back() : router.replace('/' as unknown as Href));
