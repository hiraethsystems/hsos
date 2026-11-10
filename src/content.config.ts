/**
 * Content collections (SPEC 13). Every entry here becomes a real static page, and the desktop
 * shell opens the same content in windows.
 */
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { DIVISION_IDS, STATUSES } from './os/divisions';

/**
 * Use the file name as the entry id, and refuse to build if the frontmatter `slug` disagrees,
 * so a file can never quietly publish under a different URL from its name.
 */
const idFromFileName = ({ entry, data }: { entry: string; data: Record<string, unknown> }): string => {
  const fileName = entry.replace(/\.md$/, '');
  if (data.slug !== undefined && data.slug !== fileName) {
    throw new Error(`Content file "${entry}" has slug "${String(data.slug)}". The slug must match the file name.`);
  }
  return fileName;
};

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects', generateId: idFromFileName }),
  schema: z.object({
    name: z.string(),
    slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'lower case letters, digits and single hyphens only'),
    division: z.enum(DIVISION_IDS),
    platform: z.string(),
    status: z.enum(STATUSES),
    /** One or two plain sentences, no satire. */
    summary: z.string(),
    /** Path under public/, for example /shots/vitasdr.png */
    screenshot: z.string().startsWith('/').optional(),
    /** Sprite id, once sprites exist. */
    icon: z.string().optional(),
    links: z
      .object({
        repo: z.url().optional(),
        release: z.url().optional(),
        download: z.url().optional(),
        website: z.url().optional(),
      })
      .default({}),
    /** Sort order in lists, lowest first. */
    order: z.number().int().default(100),
    /** Placeholder entries are marked so they are easy to find and replace. */
    placeholder: z.boolean().default(false),
  }),
});

const memos = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/memos', generateId: idFromFileName }),
  schema: z.object({
    title: z.string(),
    slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).optional(),
    date: z.coerce.date(),
    /** The sending Division, written as a name, for example "Signals" or "Office of the Board". */
    from: z.string(),
    to: z.string().default('All Employees'),
    summary: z.string(),
    draft: z.boolean().default(false),
  }),
});

/** Standalone documents such as WELCOME.dd and the about page. */
const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pages', generateId: idFromFileName }),
  schema: z.object({
    title: z.string(),
    /** Path shown in the window title bar, for example /home/employee/WELCOME.dd */
    path: z.string().startsWith('/'),
    summary: z.string().optional(),
  }),
});

export const collections = { projects, memos, pages };
