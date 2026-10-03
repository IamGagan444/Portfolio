/**
 * Portfolio content extracted from the original hard-coded `src/data/resume.tsx`.
 * Used once by `npm run seed` to populate an empty database; afterwards the
 * admin dashboard is the source of truth.
 */

const EMAIL = "gaganjobs09@gmail.com";

export const profile = {
  name: "Gagan Pallai",
  headline:
    "Gagan Pallai is a MERN stack developer from Odisha, Ganjam, currently learning Generative AI and building high-performance web applications.",
  bio: "I am a dedicated MERN stack developer from Odisha, Ganjam, with a robust foundation in MongoDB, Express.js, React.js, and Node.js. With 15 months of hands-on experience at Nearo Pvt Limited, I have independently developed the entire frontend of the Nearo seller site using React.js, Redux Toolkit, Material UI, and Tailwind CSS. My role involved creating dynamic and responsive web applications, integrating APIs seamlessly, and ensuring efficient state management. I am passionate about building scalable and efficient solutions, exploring Generative AI, and continuously learning new technologies. My goal is to contribute to innovative projects that make a meaningful impact, while achieving professional growth and personal fulfillment.",
  roles: ["MERN stack developer", "Frontend engineer", "Generative AI explorer"],
  profileImage: { url: "/me2.jpeg", publicId: "", alt: "Gagan Pallai" },
  // Background-removed cut-outs: the ASCII renderer uses transparency as the silhouette mask.
  heroImages: ["/ascii/me.png", "/ascii/me2.png", "/ascii/me3.png", "/ascii/me1.png"].map((url) => ({
    url,
    publicId: "",
    alt: "Gagan Pallai",
  })),
  location: "Odisha, Ganjam",
  locationUrl: "https://www.google.com/maps/place/Ganjam,+Odisha",
  latitude: 19.3866,
  longitude: 84.9802,
  timezone: "Asia/Kolkata",
  email: EMAIL,
  phone: "+91 7846961770",
  availability: "",
  socialLinks: [
    { platform: "github", label: "GitHub", url: "https://github.com/IamGagan444", showInNav: true },
    {
      platform: "linkedin",
      label: "LinkedIn",
      url: "https://www.linkedin.com/in/gagan-pallai-33144b255",
      showInNav: true,
    },
    { platform: "x", label: "X", url: "https://x.com/iam_gagan_2003", showInNav: true },
    { platform: "email", label: "Send Email", url: `mailto:${EMAIL}`, showInNav: false },
  ],
};

const FRONTEND = [
  "HTML",
  "CSS",
  "Javascript",
  "Tailwind",
  "React.js",
  "Next.js",
  "Material UI",
  "Magic UI",
  "Shadcn UI",
  "Typescript",
];
const BACKEND = ["Node.js", "Express.js", "Jwt", "Auth.js", "Socket IO"];
const DATABASE = ["MongoDB"];

// Original display order is preserved through `order`.
const ORIGINAL_ORDER = [
  "HTML",
  "CSS",
  "Javascript",
  "Tailwind",
  "React.js",
  "Next.js",
  "Material UI",
  "Magic UI",
  "Shadcn UI",
  "Typescript",
  "Node.js",
  "Express.js",
  "MongoDB",
  "Jwt",
  "Auth.js",
  "Socket IO",
];

export const skills = ORIGINAL_ORDER.map((name, order) => ({
  name,
  category: FRONTEND.includes(name)
    ? "Frontend"
    : BACKEND.includes(name)
      ? "Backend"
      : DATABASE.includes(name)
        ? "Database"
        : "Other",
  proficiency: 0,
  icon: "",
  order,
}));

export const experience = [
  {
    company: "Nearo pvt ltd",
    companyUrl: "https://seller.nearo.in/",
    logo: { url: "/atomic.png", publicId: "", alt: "Nearo" },
    position: "Lead Frontend Developer",
    location: "Remote",
    employmentType: "Full-time",
    startDate: new Date("2023-01"),
    endDate: new Date("2024-04"),
    currentlyWorking: false,
    description:
      "Developed a high-performing e-commerce website using React.js, Tailwind CSS, and Redux, tailored to meet the client's unique business needs. Empowered sellers with features for easy product addition, including variants, enhancing user experience and product management. Designed a comprehensive dashboard for efficient management of orders, inventory, profiles, and settings. Constructed a revenue tracking page for insights into earnings and performance, and implemented advanced filtering and search functionalities for improved product discoverability and user satisfaction.",
    technologies: [],
    order: 0,
  },
];

export const education = [
  {
    institution: "National institute of science and technology",
    institutionUrl: "https://www.nist.gov/",
    logo: { url: "/buildspace.jpg", publicId: "", alt: "NIST" },
    degree: "B-tech",
    field: "",
    startDate: new Date("2020-01"),
    endDate: new Date("2024-01"),
    description: "",
    grade: "",
    order: 0,
  },
];

const STACK = ["Next.js", "Typescript", "PostgreSQL", "Prisma", "TailwindCSS", "Stripe", "Shadcn UI", "Magic UI"];
const STACK_CF = [
  "Next.js",
  "Typescript",
  "PostgreSQL",
  "Prisma",
  "TailwindCSS",
  "Shadcn UI",
  "Magic UI",
  "Stripe",
  "Cloudflare Workers",
];

export const projects = [
  {
    title: "Nearo Seller",
    slug: "nearo-seller",
    shortDescription:
      "Developed and deployed* the entire frontend of the Nearo seller site using React.js, Redux CSS.● Collaborated closely* with backend developers to integrate APIs, ensuring seamless data flow and enhanced user experienc. ",
    description: "",
    thumbnail: null,
    images: [],
    video: "/Nearo.seller.mp4",
    technologies: STACK,
    category: "Web App",
    liveUrl: "https://seller.nearo.in/",
    githubUrl: "",
    featured: true,
    status: "published",
    startDate: new Date("2023-01"),
    endDate: new Date("2024-08"),
    order: 0,
  },
  {
    title: "Magic UI",
    slug: "magic-ui",
    shortDescription: "Designed, developed and sold animated UI components for developers.",
    description: "",
    thumbnail: null,
    images: [],
    video: "https://cdn.magicui.design/bento-grid.mp4",
    technologies: STACK,
    category: "UI Library",
    liveUrl: "https://magicui.design",
    githubUrl: "https://github.com/magicuidesign/magicui",
    featured: true,
    status: "published",
    startDate: new Date("2023-06"),
    endDate: null,
    order: 1,
  },
  {
    title: "llm.report",
    slug: "llm-report",
    shortDescription:
      "Developed an open-source logging and analytics platform for OpenAI: Log your ChatGPT API requests, analyze costs, and improve your prompts.",
    description: "",
    thumbnail: null,
    images: [],
    video: "https://cdn.llm.report/openai-demo.mp4",
    technologies: STACK_CF,
    category: "SaaS",
    liveUrl: "https://llm.report",
    githubUrl: "https://github.com/dillionverma/llm.report",
    featured: true,
    status: "published",
    startDate: new Date("2023-04"),
    endDate: new Date("2023-09"),
    order: 2,
  },
  {
    title: "Automatic Chat",
    slug: "automatic-chat",
    shortDescription:
      "Developed an AI Customer Support Chatbot which automatically responds to customer support tickets using the latest GPT models.",
    description: "",
    thumbnail: null,
    images: [],
    video: "https://pub-83c5db439b40468498f97946200806f7.r2.dev/automatic-chat.mp4",
    technologies: STACK_CF,
    category: "AI",
    liveUrl: "https://automatic.chat",
    githubUrl: "",
    featured: true,
    status: "published",
    startDate: new Date("2023-04"),
    endDate: new Date("2024-03"),
    order: 3,
  },
];

export const hackathons = [
  {
    title: "Smart india hackathon",
    location: "Rajastan, India",
    startDate: new Date("2023-08-23"),
    endDate: new Date("2023-08-25"),
    description:
      "Developed a mobile application which delivered bedtime stories to children using augmented reality.",
    image: {
      url: "https://pub-83c5db439b40468498f97946200806f7.r2.dev/hackline/hack-western.png",
      publicId: "",
      alt: "Smart india hackathon",
    },
    links: [],
    order: 0,
  },
];

export const certifications: never[] = [];
