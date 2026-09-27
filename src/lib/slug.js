// Turn an organization name into a URL slug: lowercase, spaces (and any other
// non-alphanumeric runs) become dashes, trimmed. e.g.
//   "Computer Science Society" -> "computer-science-society"
export const slugify = (name = '') =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
