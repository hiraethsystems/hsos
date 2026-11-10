/**
 * The Divisions of Hiraeth Systems. Projects are filed under exactly one of these.
 * Add a new division here and it becomes valid in project frontmatter straight away.
 * The id is used in URLs and the filesystem: /srv/divisions/<id>/<project>/
 */
export const DIVISIONS = [
  { id: 'signals', name: 'Signals' },
  { id: 'legacy-acquisitions', name: 'Legacy Acquisitions' },
  { id: 'leisure-compliance', name: 'Leisure Compliance' },
  { id: 'defence-contracts', name: 'Defence Contracts' },
  { id: 'morale', name: 'Morale' },
] as const;

export type DivisionId = (typeof DIVISIONS)[number]['id'];

export const DIVISION_IDS = DIVISIONS.map((d) => d.id) as [DivisionId, ...DivisionId[]];

export function divisionName(id: DivisionId): string {
  return DIVISIONS.find((d) => d.id === id)!.name;
}

/** Project statuses, in lifecycle order. */
export const STATUSES = ['planned', 'in-development', 'prototype', 'released', 'archived'] as const;
export type Status = (typeof STATUSES)[number];

/** How each status reads on a dossier. */
export const STATUS_LABELS: Record<Status, string> = {
  planned: 'Planned',
  'in-development': 'In development',
  prototype: 'Prototype',
  released: 'Released',
  archived: 'Archived',
};
