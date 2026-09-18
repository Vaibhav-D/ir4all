import { Layout, Pointer, Zap } from "lucide-react";

import { Feature108 } from "@/components/blocks/shadcnblocks-com-feature108";

const demoData = {
  badge: "shadcnblocks.com",
  heading: "A Collection of Components Built With Shadcn & Tailwind",
  description: "Join us to build flawless web solutions.",
  tabs: [
    {
      value: "tab-1",
      icon: <Zap className="h-auto w-4 shrink-0" />,
      label: "Boost Revenue",
      content: {
        badge: "Modern Tactics",
        title: "Make your site a true standout.",
        description:
          "Discover new web trends that help you craft sleek, highly functional sites that drive traffic and convert leads into customers.",
        buttonText: "See Plans",
        imageSrc:
          "https://cdn.21st.dev/assets/mirror/e2/e276687cf540bc1b76306090f5cb5c8da7e75540aa3699c82434199e4c022aac.svg",
        imageAlt: "placeholder",
      },
    },
    {
      value: "tab-2",
      icon: <Pointer className="h-auto w-4 shrink-0" />,
      label: "Higher Engagement",
      content: {
        badge: "Expert Features",
        title: "Boost your site with top-tier design.",
        description:
          "Use stellar design to easily engage users and strengthen their loyalty. Create a seamless experience that keeps them coming back for more.",
        buttonText: "See Tools",
        imageSrc:
          "https://cdn.21st.dev/assets/mirror/92/929dbce1e0592e7bf103c43fb59c7705aa4bd9a3f856f06b6ebae302c84cea2e.svg",
        imageAlt: "placeholder",
      },
    },
    {
      value: "tab-3",
      icon: <Layout className="h-auto w-4 shrink-0" />,
      label: "Stunning Layouts",
      content: {
        badge: "Elite Solutions",
        title: "Build an advanced web experience.",
        description:
          "Lift your brand with modern tech that grabs attention and drives action. Create a digital experience that stands out from the crowd.",
        buttonText: "See Options",
        imageSrc:
          "https://cdn.21st.dev/assets/mirror/a5/a5e2593d6262250b9894916a2af42951494a004c12408d3883da62b2149c4e1d.svg",
        imageAlt: "placeholder",
      },
    },
  ],
};

function Feature108Demo() {
  return <Feature108 {...demoData} />;
}

export { Feature108Demo };
