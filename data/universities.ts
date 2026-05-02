export interface University {
  name: string
  shortName: string
  domain: string
  admissionsUrl: string
  rssFeeds: string[]
  location: string
}

// MVP: Top 5 universities — expand to 50 by adding entries below
export const universities: University[] = [
  {
    name: 'Massachusetts Institute of Technology',
    shortName: 'MIT',
    domain: 'mit.edu',
    admissionsUrl: 'https://mitadmissions.org',
    rssFeeds: [
      'https://mitadmissions.org/blogs/feed/',
      'https://news.mit.edu/rss/feed',
    ],
    location: 'Cambridge, MA',
  },
  {
    name: 'Harvard University',
    shortName: 'Harvard',
    domain: 'harvard.edu',
    admissionsUrl: 'https://college.harvard.edu/admissions',
    rssFeeds: [
      'https://news.harvard.edu/gazette/feed/',
    ],
    location: 'Cambridge, MA',
  },
  {
    name: 'Stanford University',
    shortName: 'Stanford',
    domain: 'stanford.edu',
    admissionsUrl: 'https://admission.stanford.edu',
    rssFeeds: [
      'https://news.stanford.edu/feed/',
    ],
    location: 'Stanford, CA',
  },
  {
    name: 'Columbia University',
    shortName: 'Columbia',
    domain: 'columbia.edu',
    admissionsUrl: 'https://undergrad.admissions.columbia.edu',
    rssFeeds: [
      'https://news.columbia.edu/rss.xml',
    ],
    location: 'New York, NY',
  },
  {
    name: 'University of California, Los Angeles',
    shortName: 'UCLA',
    domain: 'ucla.edu',
    admissionsUrl: 'https://admission.ucla.edu',
    rssFeeds: [
      'https://newsroom.ucla.edu/rss.xml',
    ],
    location: 'Los Angeles, CA',
  },
  // --- SCALE TO 50: Add universities below ---
  // {
  //   name: 'Yale University',
  //   shortName: 'Yale',
  //   domain: 'yale.edu',
  //   admissionsUrl: 'https://admissions.yale.edu',
  //   rssFeeds: ['https://news.yale.edu/rss.xml'],
  //   location: 'New Haven, CT',
  // },
  // {
  //   name: 'Princeton University',
  //   shortName: 'Princeton',
  //   domain: 'princeton.edu',
  //   admissionsUrl: 'https://admission.princeton.edu',
  //   rssFeeds: ['https://www.princeton.edu/feed/'],
  //   location: 'Princeton, NJ',
  // },
  // ... add remaining universities here
]

// Global news sources (not university-specific)
export const globalSources = [
  {
    name: 'Inside Higher Ed',
    rss: 'https://www.insidehighered.com/rss.xml',
  },
  {
    name: 'Common App Blog',
    rss: 'https://www.commonapp.org/blog/feed',
  },
]
