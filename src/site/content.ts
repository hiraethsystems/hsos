/**
 * Content queries for the static layer. Kept in one place so every page sorts and filters
 * the same way.
 */
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import type { DivisionId } from '../os/divisions';

export type Project = CollectionEntry<'projects'>;
export type Memo = CollectionEntry<'memos'>;

/** All projects, by `order` and then by name. */
export async function getProjects(division?: DivisionId): Promise<Project[]> {
  const all = await getCollection('projects', (p) => !division || p.data.division === division);
  return all.sort((a, b) => a.data.order - b.data.order || a.data.name.localeCompare(b.data.name, 'en-GB'));
}

/** Published memos, newest first. Drafts appear only on the local dev server. */
export async function getMemos(): Promise<Memo[]> {
  const all = await getCollection('memos', (m) => import.meta.env.DEV || !m.data.draft);
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** A page from the pages collection. Missing pages fail the build. */
export async function getPage(id: string): Promise<CollectionEntry<'pages'>> {
  const page = await getEntry('pages', id);
  if (!page) throw new Error(`Missing page src/content/pages/${id}.md`);
  return page;
}

/** "10 November 2026". Dates are calendar dates, so they are read as UTC. */
export function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);
}

/** "2026-11-10", for <time datetime>. */
export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
