/**
 * Small helpers for reading single-file collections and resolving stickers.
 * Components call these instead of touching collections directly.
 */
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

async function single<C extends 'site' | 'home' | 'pricing' | 'stickers' | 'faq' | 'process'>(name: C, id: string) {
  const entry = await getEntry(name, id);
  if (!entry) throw new Error(`Missing content file: content/${id}.yml`);
  return entry.data as CollectionEntry<C>['data'];
}

export const getSite = () => single('site', 'site');
export const getHome = () => single('home', 'home');
export const getPricing = () => single('pricing', 'pricing');
export const getFaq = () => single('faq', 'faq');
export const getProcess = () => single('process', 'process');

export type Sticker = CollectionEntry<'stickers'>['data']['stickers'][number];

let stickerMap: Map<string, Sticker> | undefined;
/** Resolve sticker ids to sticker definitions. Unknown ids fail the build loudly. */
export async function getStickers(ids: readonly string[] = []): Promise<Sticker[]> {
  if (!stickerMap) {
    const { stickers } = await single('stickers', 'stickers');
    stickerMap = new Map(stickers.map((s) => [s.id, s]));
  }
  return ids.map((id) => {
    const s = stickerMap!.get(id);
    if (!s) throw new Error(`Sticker "${id}" is used but not defined in content/stickers.yml`);
    return s;
  });
}

export async function getServices() {
  return (await getCollection('services')).sort((a, b) => a.data.order - b.data.order);
}
export async function getReviews() {
  return (await getCollection('reviews')).sort((a, b) => a.data.order - b.data.order);
}
export async function getTeam() {
  return (await getCollection('team')).sort((a, b) => a.data.order - b.data.order);
}
export async function getGallery() {
  return (await getCollection('gallery')).sort((a, b) => a.data.order - b.data.order);
}
export async function getPage(id: string) {
  const page = await getEntry('pages', id);
  if (!page) throw new Error(`Missing content file: content/pages/${id}.md`);
  return page;
}
