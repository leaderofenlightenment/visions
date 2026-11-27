import type { AgentId, ModuleId } from './codex'

export type CourseMaterial = { id: string; title: string; parent: string | null; group: 'Lessons' | 'Systems' | 'Bonuses'; lens: AgentId; domains: ModuleId[]; toolkit: boolean }
export const courseMaterials: CourseMaterial[] = [
  {
    "id": "189776d8f627818aa5a5e8fcc038dc16",
    "title": "1. Start Here // Goal-Setting",
    "parent": null,
    "group": "Lessons",
    "lens": "vision",
    "domains": [
      "lifestyle",
      "business",
      "relationships"
    ],
    "toolkit": false
  },
  {
    "id": "189776d8f62781569ca9fb976ca106d5",
    "title": "2. Stewarding Creative Energy",
    "parent": null,
    "group": "Lessons",
    "lens": "system",
    "domains": [
      "lifestyle",
      "business",
      "relationships"
    ],
    "toolkit": false
  },
  {
    "id": "189776d8f62781b48013cd66e5e79529",
    "title": "3. Your Life’s Purpose",
    "parent": null,
    "group": "Lessons",
    "lens": "vision",
    "domains": [
      "lifestyle",
      "business",
      "relationships"
    ],
    "toolkit": false
  },
  {
    "id": "189776d8f62781d7962df8631b189391",
    "title": "4. Your Character Archetype",
    "parent": null,
    "group": "Lessons",
    "lens": "story",
    "domains": [
      "lifestyle",
      "business",
      "relationships"
    ],
    "toolkit": false
  },
  {
    "id": "189776d8f62781e0aef4c31f429f6591",
    "title": "5. Systematic Problem Solving",
    "parent": null,
    "group": "Lessons",
    "lens": "outcome",
    "domains": [
      "lifestyle",
      "business",
      "relationships"
    ],
    "toolkit": false
  },
  {
    "id": "189776d8f6278123bb27fb1e27a0943a",
    "title": "6. Positioning Your Value",
    "parent": null,
    "group": "Lessons",
    "lens": "integration",
    "domains": [
      "lifestyle",
      "business",
      "relationships"
    ],
    "toolkit": false
  },
  {
    "id": "189776d8f62781c1a9bafb9169768349",
    "title": "7. Mastering Human Psychology",
    "parent": null,
    "group": "Lessons",
    "lens": "insight",
    "domains": [
      "lifestyle",
      "business",
      "relationships"
    ],
    "toolkit": false
  },
  {
    "id": "189776d8f62781029cc1f01704ef4e9e",
    "title": "8. Expanding Digital Presence",
    "parent": null,
    "group": "Lessons",
    "lens": "story",
    "domains": [
      "lifestyle",
      "business",
      "relationships"
    ],
    "toolkit": false
  },
  {
    "id": "3b9776d8f62780bab045df09cf4c5e65",
    "title": "9. Connecting Everything Together",
    "parent": null,
    "group": "Lessons",
    "lens": "integration",
    "domains": [
      "lifestyle",
      "business",
      "relationships"
    ],
    "toolkit": false
  },
  {
    "id": "189776d8f6278108ac1cfffcbc4605e8",
    "title": "Sacramental Lifestyle Worksheet",
    "parent": null,
    "group": "Systems",
    "lens": "system",
    "domains": [
      "lifestyle"
    ],
    "toolkit": false
  },
  {
    "id": "189776d8f62781f3b03ee937efb03f5e",
    "title": "Career Creation Clarity",
    "parent": null,
    "group": "Systems",
    "lens": "outcome",
    "domains": [
      "business"
    ],
    "toolkit": false
  },
  {
    "id": "189776d8f6278172bf8eccabbd60279b",
    "title": "Interpersonal Dynamic Articulation",
    "parent": null,
    "group": "Systems",
    "lens": "insight",
    "domains": [
      "relationships"
    ],
    "toolkit": false
  },
  {
    "id": "3bd776d8f62780a982c7db4762dda603",
    "title": "Modern Monastic",
    "parent": null,
    "group": "Bonuses",
    "lens": "system",
    "domains": [
      "lifestyle"
    ],
    "toolkit": false
  },
  {
    "id": "3bd776d8f6278060ae08ee81e9984996",
    "title": "The Vortex Funnel",
    "parent": null,
    "group": "Bonuses",
    "lens": "integration",
    "domains": [
      "business"
    ],
    "toolkit": false
  },
  {
    "id": "3bd776d8f627808696f1da10ea2f0037",
    "title": "Threefold Partner Identification",
    "parent": null,
    "group": "Bonuses",
    "lens": "insight",
    "domains": [
      "relationships"
    ],
    "toolkit": false
  },
  {
    "id": "189776d8f62781d98745d93187bca0c7",
    "title": "Digital Marketing Toolkit",
    "parent": "189776d8f62781f3b03ee937efb03f5e",
    "group": "Systems",
    "lens": "outcome",
    "domains": [
      "business"
    ],
    "toolkit": true
  },
  {
    "id": "181776d8f62780d39355eaf88309c3a4",
    "title": "Vision Sculpting",
    "parent": "189776d8f6278108ac1cfffcbc4605e8",
    "group": "Systems",
    "lens": "system",
    "domains": [
      "lifestyle"
    ],
    "toolkit": false
  },
  {
    "id": "181776d8f6278022a7e1cf28e89329cf",
    "title": "Self-Conceptualization",
    "parent": "189776d8f6278108ac1cfffcbc4605e8",
    "group": "Systems",
    "lens": "system",
    "domains": [
      "lifestyle"
    ],
    "toolkit": false
  },
  {
    "id": "181776d8f62780bc8972e152cefc4295",
    "title": "Focus Mastery Systems",
    "parent": "189776d8f6278108ac1cfffcbc4605e8",
    "group": "Systems",
    "lens": "system",
    "domains": [
      "lifestyle"
    ],
    "toolkit": false
  },
  {
    "id": "65f530fca2914f938321f5d63855842e",
    "title": "Creation Station",
    "parent": "189776d8f62781f3b03ee937efb03f5e",
    "group": "Systems",
    "lens": "outcome",
    "domains": [
      "business"
    ],
    "toolkit": false
  },
  {
    "id": "d57d788f2b484ed09fec5d3ee128fc24",
    "title": "The Consciousness Lab",
    "parent": "189776d8f62781f3b03ee937efb03f5e",
    "group": "Systems",
    "lens": "outcome",
    "domains": [
      "business"
    ],
    "toolkit": false
  },
  {
    "id": "181776d8f62780ff860ecdf42e155c6c",
    "title": "Connection Building",
    "parent": "189776d8f62781f3b03ee937efb03f5e",
    "group": "Systems",
    "lens": "outcome",
    "domains": [
      "business"
    ],
    "toolkit": false
  },
  {
    "id": "186776d8f627807995f9f78a3d621376",
    "title": "Long-form Marketing Strategy",
    "parent": "189776d8f62781d98745d93187bca0c7",
    "group": "Systems",
    "lens": "outcome",
    "domains": [
      "business"
    ],
    "toolkit": true
  },
  {
    "id": "186776d8f62780a2a4d3c06f521cf547",
    "title": "Thread Emulation Template",
    "parent": "189776d8f62781d98745d93187bca0c7",
    "group": "Systems",
    "lens": "outcome",
    "domains": [
      "business"
    ],
    "toolkit": true
  },
  {
    "id": "186776d8f6278068b066d11fa49cf2c4",
    "title": "Landing Page Structure & Draft",
    "parent": "189776d8f62781d98745d93187bca0c7",
    "group": "Systems",
    "lens": "outcome",
    "domains": [
      "business"
    ],
    "toolkit": true
  },
  {
    "id": "186776d8f62780e78662c902f56d9284",
    "title": "launch strategy protocols",
    "parent": "189776d8f62781d98745d93187bca0c7",
    "group": "Systems",
    "lens": "outcome",
    "domains": [
      "business"
    ],
    "toolkit": true
  },
  {
    "id": "181776d8f6278054b07cd91d415851f4",
    "title": "Emotional Mastery",
    "parent": "189776d8f6278172bf8eccabbd60279b",
    "group": "Systems",
    "lens": "insight",
    "domains": [
      "relationships"
    ],
    "toolkit": false
  },
  {
    "id": "181776d8f627809492eed64901025fe7",
    "title": "Exploration Station",
    "parent": "189776d8f6278172bf8eccabbd60279b",
    "group": "Systems",
    "lens": "insight",
    "domains": [
      "relationships"
    ],
    "toolkit": false
  },
  {
    "id": "181776d8f62780cb8006dce93d052b87",
    "title": "Sacramental Relationship Mastery",
    "parent": "189776d8f6278172bf8eccabbd60279b",
    "group": "Systems",
    "lens": "insight",
    "domains": [
      "relationships"
    ],
    "toolkit": false
  },
  {
    "id": "c3bdaeb6bfda4a5da05c0c72cd1cce80",
    "title": "Imaginations",
    "parent": "65f530fca2914f938321f5d63855842e",
    "group": "Systems",
    "lens": "outcome",
    "domains": [
      "business"
    ],
    "toolkit": false
  },
  {
    "id": "8abd3af45a4147c28fb9874b07a4f853",
    "title": "Validated Ideas",
    "parent": "65f530fca2914f938321f5d63855842e",
    "group": "Systems",
    "lens": "outcome",
    "domains": [
      "business"
    ],
    "toolkit": false
  },
  {
    "id": "5e593f2877a145ef99e12cd9397cb351",
    "title": "Creative Stories",
    "parent": "65f530fca2914f938321f5d63855842e",
    "group": "Systems",
    "lens": "outcome",
    "domains": [
      "business"
    ],
    "toolkit": false
  },
  {
    "id": "17e776d8f6278082b64fc96d0baba76d",
    "title": "Idea Generation Example",
    "parent": "65f530fca2914f938321f5d63855842e",
    "group": "Systems",
    "lens": "outcome",
    "domains": [
      "business"
    ],
    "toolkit": false
  },
  {
    "id": "183776d8f6278034b452cd3e05352953",
    "title": "goal-setting template",
    "parent": "181776d8f62780d39355eaf88309c3a4",
    "group": "Systems",
    "lens": "system",
    "domains": [
      "lifestyle"
    ],
    "toolkit": false
  },
  {
    "id": "191776d8f6278024bcfff32e184dd737",
    "title": "Thread Swipe File",
    "parent": "186776d8f62780a2a4d3c06f521cf547",
    "group": "Systems",
    "lens": "outcome",
    "domains": [
      "business"
    ],
    "toolkit": false
  },
  {
    "id": "182776d8f627804fbbdae47e1c0e3fac",
    "title": "start here // rename this",
    "parent": "5e593f2877a145ef99e12cd9397cb351",
    "group": "Systems",
    "lens": "outcome",
    "domains": [
      "business"
    ],
    "toolkit": false
  },
  {
    "id": "3b9776d8f6278025a073ebd4b0d9430a",
    "title": "Newsletters",
    "parent": "8abd3af45a4147c28fb9874b07a4f853",
    "group": "Systems",
    "lens": "outcome",
    "domains": [
      "business"
    ],
    "toolkit": false
  },
  {
    "id": "3b9776d8f6278047bfc6c4f6c00208a2",
    "title": "Epiphanies",
    "parent": "8abd3af45a4147c28fb9874b07a4f853",
    "group": "Systems",
    "lens": "outcome",
    "domains": [
      "business"
    ],
    "toolkit": false
  },
  {
    "id": "3b9776d8f62780e8a888e23161588d55",
    "title": "Modules",
    "parent": "8abd3af45a4147c28fb9874b07a4f853",
    "group": "Systems",
    "lens": "outcome",
    "domains": [
      "business"
    ],
    "toolkit": false
  },
  {
    "id": "3b9776d8f627807085c9d0d8f9aa2a11",
    "title": "Threads",
    "parent": "8abd3af45a4147c28fb9874b07a4f853",
    "group": "Systems",
    "lens": "outcome",
    "domains": [
      "business"
    ],
    "toolkit": false
  }
]
courseMaterials.push(...[{"id":"3da776d8f6278034999cf38f53804bde","title":"Project Management","parent":"65f530fca2914f938321f5d63855842e","group":"Systems","lens":"outcome","domains":["business"],"toolkit":false},{"id":"181776d8f6278060a70edbca7e5453bf","title":"Knowledge Clustering System","parent":"65f530fca2914f938321f5d63855842e","group":"Systems","lens":"outcome","domains":["business"],"toolkit":false},{"id":"182776d8f62780578af3e87d3dcf279d","title":"Routines","parent":"181776d8f62780bc8972e152cefc4295","group":"Systems","lens":"system","domains":["lifestyle"],"toolkit":false},{"id":"190776d8f627800d80d8f63eab649c17","title":"Daily Drive","parent":"181776d8f62780bc8972e152cefc4295","group":"Systems","lens":"system","domains":["lifestyle"],"toolkit":false},{"id":"3da776d8f627804b9c20f3250ee1b413","title":"Budgeting","parent":"181776d8f62780bc8972e152cefc4295","group":"Systems","lens":"system","domains":["lifestyle"],"toolkit":false},{"id":"3dc776d8f62780a0a86dea274fd0f8d5","title":"Habits","parent":"181776d8f62780bc8972e152cefc4295","group":"Systems","lens":"system","domains":["lifestyle"],"toolkit":false},{"id":"30b776d8f62781948f86d1763034df6b","title":"Weekly Flow Testing","parent":"181776d8f62780bc8972e152cefc4295","group":"Systems","lens":"system","domains":["lifestyle"],"toolkit":false},{"id":"319776d8f62780e38fc4e16df07b43d4","title":"Weekly Flow Testing (1)","parent":"181776d8f62780bc8972e152cefc4295","group":"Systems","lens":"system","domains":["lifestyle"],"toolkit":false},{"id":"182776d8f627814f964cfdb1fe27bb9c","title":"Offer Creation Framework","parent":"186776d8f62780e78662c902f56d9284","group":"Systems","lens":"outcome","domains":["business"],"toolkit":true},{"id":"182776d8f627812f8d0ec01fcbf4b571","title":"Launch Stages","parent":"186776d8f62780e78662c902f56d9284","group":"Systems","lens":"outcome","domains":["business"],"toolkit":true},{"id":"182776d8f627810d9e8af5b72eb352b5","title":"Network Boost","parent":"186776d8f62780e78662c902f56d9284","group":"Systems","lens":"outcome","domains":["business"],"toolkit":true},{"id":"181776d8f62780e58a63c9b9ddd4e939","title":"Connections","parent":"181776d8f62780ff860ecdf42e155c6c","group":"Systems","lens":"integration","domains":["business"],"toolkit":false}] as CourseMaterial[])
export function courseMaterial(id: unknown) { return courseMaterials.find(item => item.id === id) }

export const workspaceCourse = {
  lifestyle: {
    main: '189776d8f6278108ac1cfffcbc4605e8', bonus: '3bd776d8f62780a982c7db4762dda603',
    lessons: ['189776d8f627818aa5a5e8fcc038dc16', '189776d8f62781569ca9fb976ca106d5', '189776d8f62781b48013cd66e5e79529'],
  },
  business: {
    main: '189776d8f62781f3b03ee937efb03f5e', bonus: '3bd776d8f6278060ae08ee81e9984996',
    lessons: ['189776d8f62781e0aef4c31f429f6591', '189776d8f6278123bb27fb1e27a0943a', '189776d8f62781029cc1f01704ef4e9e'],
  },
  relationships: {
    main: '189776d8f6278172bf8eccabbd60279b', bonus: '3bd776d8f627808696f1da10ea2f0037',
    lessons: ['189776d8f62781d7962df8631b189391', '189776d8f62781c1a9bafb9169768349', '3b9776d8f62780bab045df09cf4c5e65'],
  },
} as const

export const marketingToolkit = '189776d8f62781d98745d93187bca0c7'
