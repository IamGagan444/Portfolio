import { Icons } from "@/components/icons";
import { HomeIcon, NotebookIcon } from "lucide-react";

export const DATA = {
  name: "Gagan pallai",
  initials: "GP",
  url: "https://dillion.io",
  location: "San Francisco, CA",
  locationLink: "https://www.google.com/maps/place/sanfrancisco",
  description:
    "Software Engineer and Entrepreneur. I love building things and helping people. Very active on Twitter.",
  summary:
    "I am a dedicated MERN stack developer with a robust foundation in MongoDB, Express.js, React.js, and Node.js. With 15 months of hands-on experience at Nearo Pvt Limited, I have independently developed the entire frontend of the Nearo seller site using React.js, Redux Toolkit, Material UI, and Tailwind CSS. My role involved creating dynamic and responsive web applications, integrating APIs seamlessly, and ensuring efficient state management. I am passionate about building scalable and efficient solutions, continuously learning new technologies, and thriving in collaborative environments. My goal is to contribute to innovative projects that make a meaningful impact, while achieving professional growth and personal fulfillment.",
  avatarUrl: "/me2.jpeg",
  skills: [
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
  ],
  navbar: [
    { href: "/", icon: HomeIcon, label: "Home" },
    { href: "/blog", icon: NotebookIcon, label: "Blog" },
  ],
  contact: {
    email: "gaganjobs09@gmail.com",
    tel: "+91 7846961770",
    social: {
      GitHub: {
        name: "GitHub",
        url: "https://github.com/IamGagan444",
        icon: Icons.github,

        navbar: true,
      },
      LinkedIn: {
        name: "LinkedIn",
        url: "https://www.linkedin.com/in/gagan-pallai-33144b255?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
        icon: Icons.linkedin,

        navbar: true,
      },
      X: {
        name: "X",
        url: "https://x.com/iam_gagan_2003",
        icon: Icons.x,

        navbar: true,
      },

      email: {
        name: "Send Email",
        url: "#",
        icon: Icons.email,

        navbar: false,
      },
    },
  },

  work: [
    {
      company: "Nearo pvt ltd",
      href: "https://seller.nearo.in/",
      badges: [],
      location: "Remote",
      title: "Lead Frontend Developer",
      logoUrl: "/atomic.png",
      start: "Jan 2023",
      end: "April 2024",
      description:
        "Developed a high-performing e-commerce website using React.js, Tailwind CSS, and Redux, tailored to meet the client's unique business needs. Empowered sellers with features for easy product addition, including variants, enhancing user experience and product management. Designed a comprehensive dashboard for efficient management of orders, inventory, profiles, and settings. Constructed a revenue tracking page for insights into earnings and performance, and implemented advanced filtering and search functionalities for improved product discoverability and user satisfaction.",
    },
  ],
  education: [
    {
      school: "National institute of science and technology",
      href: "https://www.nist.gov/",
      degree: "B-tech",
      logoUrl: "/buildspace.jpg",
      start: "2020",
      end: "2024",
    },
  ],
  projects: [
    {
      title: "Nearo Seller",
      href: "https://seller.nearo.in/",
      dates: "Jan 2024=3 - aug 2024",
      active: true,
      description:
        "Developed and deployed* the entire frontend of the Nearo seller site using React.js, Redux CSS.● Collaborated closely* with backend developers to integrate APIs, ensuring seamless data flow and enhanced user experienc. ",
      technologies: [
        "Next.js",
        "Typescript",
        "PostgreSQL",
        "Prisma",
        "TailwindCSS",
        "Stripe",
        "Shadcn UI",
        "Magic UI",
      ],
      links: [
        {
          type: "Website",
          href: "https://chatcollect.com",
          icon: <Icons.globe className="size-3" />,
        },
      ],
      image: "",
      video: "/Nearo.seller.mp4",
    },
    {
      title: "Magic UI",
      href: "https://magicui.design",
      dates: "June 2023 - Present",
      active: true,
      description:
        "Designed, developed and sold animated UI components for developers.",
      technologies: [
        "Next.js",
        "Typescript",
        "PostgreSQL",
        "Prisma",
        "TailwindCSS",
        "Stripe",
        "Shadcn UI",
        "Magic UI",
      ],
      links: [
        {
          type: "Website",
          href: "https://magicui.design",
          icon: <Icons.globe className="size-3" />,
        },
        {
          type: "Source",
          href: "https://github.com/magicuidesign/magicui",
          icon: <Icons.github className="size-3" />,
        },
      ],
      image: "",
      video: "https://cdn.magicui.design/bento-grid.mp4",
    },
    {
      title: "llm.report",
      href: "https://llm.report",
      dates: "April 2023 - September 2023",
      active: true,
      description:
        "Developed an open-source logging and analytics platform for OpenAI: Log your ChatGPT API requests, analyze costs, and improve your prompts.",
      technologies: [
        "Next.js",
        "Typescript",
        "PostgreSQL",
        "Prisma",
        "TailwindCSS",
        "Shadcn UI",
        "Magic UI",
        "Stripe",
        "Cloudflare Workers",
      ],
      links: [
        {
          type: "Website",
          href: "https://llm.report",
          icon: <Icons.globe className="size-3" />,
        },
        {
          type: "Source",
          href: "https://github.com/dillionverma/llm.report",
          icon: <Icons.github className="size-3" />,
        },
      ],
      image: "",
      video: "https://cdn.llm.report/openai-demo.mp4",
    },
    {
      title: "Automatic Chat",
      href: "https://automatic.chat",
      dates: "April 2023 - March 2024",
      active: true,
      description:
        "Developed an AI Customer Support Chatbot which automatically responds to customer support tickets using the latest GPT models.",
      technologies: [
        "Next.js",
        "Typescript",
        "PostgreSQL",
        "Prisma",
        "TailwindCSS",
        "Shadcn UI",
        "Magic UI",
        "Stripe",
        "Cloudflare Workers",
      ],
      links: [
        {
          type: "Website",
          href: "https://automatic.chat",
          icon: <Icons.globe className="size-3" />,
        },
      ],
      image: "",
      video:
        "https://pub-83c5db439b40468498f97946200806f7.r2.dev/automatic-chat.mp4",
    },
  ],
  hackathons: [
    {
      title: "Smart india hackathon",
      dates: "August 23rd - 25th, 2023",
      location: "Rajastan, India",
      description:
        "Developed a mobile application which delivered bedtime stories to children using augmented reality.",
      image:
        "https://pub-83c5db439b40468498f97946200806f7.r2.dev/hackline/hack-western.png",
      mlh: "https://s3.amazonaws.com/logged-assets/trust-badge/2019/mlh-trust-badge-2019-white.svg",
      links: [],
    },
  ],
} as const;
