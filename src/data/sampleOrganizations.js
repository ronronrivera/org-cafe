// Sample directory data shaped after the `organizations` + `org_categories`
// schema (see supabase/migrations). Swap this out for a Supabase query later:
//   const { data } = await supabase.from('organizations').select('*, org_categories(category_name)')

export const organizations = [
  {
    org_id: 1,
    org_name: 'BSIT Organization',
    abbreviation: 'BSIT',
    category_name: 'Academic',
    description:
      'The official organization of BSIT students at CSU. We aim to build a stronger community through collaboration, learning, and innovation.',
    fb_page_link: '#',
    join_form_link: '#',
    initials: 'BSIT',
    accent: 'emerald',
  },
  {
    org_id: 2,
    org_name: 'Computer Science Society',
    abbreviation: 'CSS',
    category_name: 'Academic',
    description:
      'For all Computer Science students at CSU. We promote growth, innovation, and collaboration in the field of technology.',
    fb_page_link: '#',
    join_form_link: '#',
    initials: 'CS',
    accent: 'blue',
  },
  {
    org_id: 3,
    org_name: 'Cultural Arts Organization',
    abbreviation: 'CAO',
    category_name: 'Cultural',
    description:
      'Express. Create. Inspire. We bring together students who love art, music, and culture.',
    fb_page_link: '#',
    join_form_link: '#',
    initials: '◉',
    accent: 'fuchsia',
  },
  {
    org_id: 4,
    org_name: 'Environmental Club',
    abbreviation: 'ENVIRO',
    category_name: 'Environmental',
    description:
      'A greener tomorrow starts with us. We promote environmental awareness and sustainable practices on campus.',
    fb_page_link: '#',
    join_form_link: '#',
    initials: '♣',
    accent: 'green',
  },
  {
    org_id: 5,
    org_name: 'Sports Club',
    abbreviation: 'SPORTS',
    category_name: 'Recreation',
    description:
      'Play. Compete. Build friendships. Join us in various sports and recreational activities.',
    fb_page_link: '#',
    join_form_link: '#',
    initials: '⚽',
    accent: 'amber',
  },
  {
    org_id: 6,
    org_name: 'IT Club',
    abbreviation: 'ITC',
    category_name: 'Technical',
    description:
      'For tech enthusiasts and aspiring developers. Learn, build, and explore the world of technology with us.',
    fb_page_link: '#',
    join_form_link: '#',
    initials: '</>',
    accent: 'indigo',
  },
]

// Tailwind classes per accent, kept as full strings so the JIT compiler keeps them.
export const accentStyles = {
  emerald: { header: 'from-emerald-800 to-emerald-600', tile: 'bg-emerald-500/40' },
  blue: { header: 'from-blue-700 to-sky-500', tile: 'bg-sky-400/40' },
  fuchsia: { header: 'from-fuchsia-800 to-fuchsia-500', tile: 'bg-fuchsia-400/40' },
  green: { header: 'from-green-800 to-green-500', tile: 'bg-green-400/40' },
  amber: { header: 'from-amber-700 to-orange-500', tile: 'bg-orange-400/40' },
  indigo: { header: 'from-indigo-700 to-indigo-500', tile: 'bg-indigo-400/40' },
}

export const categoryBadge = {
  Academic: 'bg-emerald-100 text-emerald-700',
  Cultural: 'bg-fuchsia-100 text-fuchsia-700',
  Environmental: 'bg-green-100 text-green-700',
  Recreation: 'bg-amber-100 text-amber-700',
  Technical: 'bg-indigo-100 text-indigo-700',
}
