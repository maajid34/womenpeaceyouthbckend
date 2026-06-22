import dotenv from "dotenv";
dotenv.config();

import { connectDatabase } from "./config/database.js";
import { User } from "./models/User.js";
import { Content } from "./models/Content.js";
import { Setting } from "./models/Setting.js";

await connectDatabase();

const cdn = (process.env.CLOUDFLARE_R2_PUBLIC_URL || "https://cdn.somaliwomenyouthpeace.org").replace(/\/$/, "");
const media = (folder, name, type = "image/jpeg") => ({
  url: `${cdn}/${folder}/${name}`,
  key: `swyp/${folder}/${name}`,
  originalName: name,
  contentType: type,
  size: 120000,
  uploadedAt: new Date()
});

const adminEmail = process.env.SEED_SUPER_ADMIN_EMAIL || "admin@somaliwomenyouthpeace.org";
const adminPassword = process.env.SEED_SUPER_ADMIN_PASSWORD;

if (!adminPassword || adminPassword.length < 12) {
  throw new Error("SEED_SUPER_ADMIN_PASSWORD must contain at least 12 characters");
}

let admin = await User.findOne({ email: adminEmail }).select("+password");
if (!admin) {
  admin = new User({ email: adminEmail });
}
admin.name = "SWYP Super Admin";
admin.password = adminPassword;
admin.role = "Super Admin";
admin.active = true;
await admin.save();

const programs = [
  ["Peacebuilding and Social Cohesion", "peacebuilding-social-cohesion", "Community dialogue, reconciliation, mediation, and trust building.", "ShieldCheck"],
  ["Women's Empowerment and Gender Equality", "womens-empowerment-gender-equality", "Leadership, advocacy, rights awareness, and economic inclusion for women.", "Users"],
  ["Youth Development and Livelihoods", "youth-development-livelihoods", "Skills, mentorship, employability, entrepreneurship, and civic leadership.", "Sprout"],
  ["Governance and Community Participation", "governance-community-participation", "Inclusive decision-making and accountable local governance.", "Landmark"],
  ["Protection and Human Rights", "protection-human-rights", "Safeguarding vulnerable groups and strengthening rights-based action.", "Scale"],
  ["Humanitarian Response and Recovery", "humanitarian-response-recovery", "Emergency assistance, recovery support, and community resilience.", "HeartHandshake"],
  ["Education and Community Awareness", "education-community-awareness", "Learning campaigns, civic education, and public awareness.", "BookOpen"],
  ["Disaster Risk Reduction and Climate Resilience", "disaster-risk-reduction-climate-resilience", "Climate adaptation, preparedness, and resilience initiatives.", "CloudSun"]
];

for (const [title, slug, shortDescription, icon, index] of programs.map((program, index) => [...program, index])) {
  await Content.findOneAndUpdate(
    { type: "programs", slug },
    {
      type: "programs",
      title,
      slug,
      icon,
      shortDescription,
      fullDescription: `${title} supports Somali communities through inclusive planning, capacity building, advocacy, and locally led action.`,
      status: "Active",
      imageUrl: `${cdn}/programs/${slug}.jpg`,
      media: [media("programs", `${slug}.jpg`)],
      displayOrder: index + 1
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

const sampleContent = [
  {
    type: "projects",
    title: "Community Peace Dialogue",
    slug: "community-peace-dialogue",
    location: "Kismayo, Jubaland",
    donor: "Community Partners",
    budget: 45000,
    status: "Ongoing",
    category: "Peacebuilding",
    shortDescription: "Structured dialogue sessions for women, youth, elders, and local leaders.",
    fullDescription: "The project strengthens local peace structures and supports community-owned reconciliation across Kismayo.",
    objectives: ["Improve trust between community groups", "Increase women and youth participation in peacebuilding"],
    activities: ["Dialogue forums", "Mediator training", "Community action planning"],
    achievements: ["120 participants reached", "8 dialogue sessions completed"],
    imageUrl: `${cdn}/projects/community-peace-dialogue.jpg`,
    media: [media("projects", "community-peace-dialogue.jpg")]
  },
  {
    type: "projects",
    title: "Youth Livelihood Skills Initiative",
    slug: "youth-livelihood-skills-initiative",
    location: "Jubaland State",
    donor: "Livelihood Partners",
    budget: 62000,
    status: "Planning",
    category: "Youth Development",
    shortDescription: "Practical skills and mentoring for vulnerable young people.",
    fullDescription: "This initiative connects youth to market-oriented skills, coaching, and small enterprise support.",
    imageUrl: `${cdn}/projects/youth-livelihood-skills.jpg`,
    media: [media("projects", "youth-livelihood-skills.jpg")]
  },
  {
    type: "news",
    title: "SWYP Launches Women Leadership Forums",
    slug: "swyp-launches-women-leadership-forums",
    category: "Women Empowerment",
    author: "SWYP Communications",
    shortDescription: "New forums will help women leaders participate in local peace and governance processes.",
    content: "SWYP has launched a series of women leadership forums in Kismayo to support inclusive peacebuilding.",
    status: "Published",
    publishDate: new Date(),
    imageUrl: `${cdn}/news/women-leadership-forums.jpg`,
    media: [media("news", "women-leadership-forums.jpg")]
  },
  {
    type: "team",
    title: "Executive Director",
    slug: "executive-director",
    department: "Leadership",
    description: "Provides strategic leadership and partnership coordination for SWYP.",
    displayOrder: 1,
    imageUrl: `${cdn}/team/executive-director.jpg`,
    media: [media("team", "executive-director.jpg")]
  },
  {
    type: "documents",
    title: "SWYP Organization Profile",
    slug: "swyp-organization-profile",
    category: "Organization Profile",
    description: "Official organization profile for partners and stakeholders.",
    fileUrl: `${cdn}/documents/swyp-organization-profile.pdf`,
    fileKey: "swyp/documents/swyp-organization-profile.pdf",
    fileType: "application/pdf",
    fileSize: 350000,
    originalName: "swyp-organization-profile.pdf",
    publishDate: new Date(),
    media: [media("documents", "swyp-organization-profile.pdf", "application/pdf")]
  }
];

for (const item of sampleContent) {
  await Content.findOneAndUpdate(
    { type: item.type, slug: item.slug || item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") },
    item,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

await Setting.findOneAndUpdate(
  { key: "organization" },
  {
    value: {
      name: "Somali Women and Youth for Peace",
      shortName: "SWYP",
      tagline: "Empowering Women, Inspiring Youth, Building Peace",
      location: "Kismayo, Jubaland State, Somalia",
      phone: "+252 610664756",
      email: "info@somaliwomenyouthpeace.org",
      website: "somaliwomenyouthpeace.org",
      heroImage: `${cdn}/organization/hero.jpg`,
      heroTitle: "Strong voices.\nShared futures.\nLasting peace.",
      heroDescription: "We equip women and young people to lead solutions that strengthen communities across Somalia.",
      aboutHeroTitle: "Peace, inclusion, and resilience led by communities",
      aboutSectionTitle: "A national organization rooted in peace, inclusion, and resilience",
      footerDescription: "A Somali organization advancing peace, inclusive development, and resilient communities by investing in women and young people.",
      overview: "Somali Women and Youth for Peace (SWYP) is a national non-governmental and non-profit organization headquartered in Kismayo, Somalia. The organization promotes sustainable peace, inclusive development, social cohesion, human rights, and community resilience across Somalia.",
      vision: "A peaceful, inclusive, and resilient Somalia where women and youth are fully empowered and actively lead the transformation of their communities through meaningful participation in peacebuilding, governance, and sustainable development.",
      mission: "To strengthen sustainable peace and long-term stability across Somalia by empowering women and youth with the knowledge, skills, and opportunities needed to become effective agents of positive change through capacity building, community engagement, advocacy, and livelihood support initiatives.",
      values: [
        { title: "Integrity", text: "We act with honesty, transparency, and professionalism." },
        { title: "Accountability", text: "We take responsibility for our actions, resources, and results." },
        { title: "Inclusivity", text: "We ensure equal participation and opportunities for everyone." },
        { title: "Equity and Justice", text: "We promote fairness, equal rights, and social justice." },
        { title: "Community Ownership", text: "We empower communities to lead and sustain their own development." },
        { title: "Innovation", text: "We embrace creative and effective solutions to challenges." },
        { title: "Partnership", text: "We collaborate with stakeholders to achieve greater impact." },
        { title: "Sustainability", text: "We promote lasting solutions that benefit future generations." }
      ],
      focusAreas: [
        { title: "Women-led change", text: "Creating space for women to lead local decisions, livelihoods, and peace efforts." },
        { title: "Youth opportunity", text: "Equipping young people with practical skills, confidence, and a voice in their future." },
        { title: "Stronger communities", text: "Supporting locally owned solutions that build trust, safety, and lasting resilience." }
      ]
    }
  },
  { upsert: true }
);

console.log(`Seed complete. Default admin: ${adminEmail} / ${adminPassword}`);
process.exit(0);
