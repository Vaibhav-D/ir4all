"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TabContent {
  badge: string;
  title: string;
  description: string;
  buttonText: string;
  /** Where the button goes; renders a plain button when omitted. */
  href?: string;
  /** Custom illustration, used instead of the image when present. */
  visual?: React.ReactNode;
  imageSrc?: string;
  imageAlt?: string;
}

interface Tab {
  value: string;
  icon: React.ReactNode;
  label: string;
  content: TabContent;
}

interface Feature108Props {
  badge?: string;
  heading?: string;
  description?: string;
  tabs?: Tab[];
}

const Feature108 = ({
  badge = "shadcnblocks.com",
  heading = "A Collection of Components Built With Shadcn & Tailwind",
  description = "Join us to build flawless web solutions.",
  tabs = [],
}: Feature108Props) => {
  return (
    <section>
      <div>
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="text-sm font-medium tracking-wide text-brand">{badge}</span>
          <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            {heading}
          </h2>
          <p className="text-pretty text-lg text-muted-foreground">{description}</p>
        </div>

        <Tabs defaultValue={tabs[0]?.value} className="mt-8">
          <TabsList className="mx-auto flex h-auto w-auto flex-col items-center justify-center gap-2 bg-transparent p-0 sm:flex-row sm:gap-4">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex flex-none shrink-0 items-center gap-2 rounded-full border border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:border-border data-[state=active]:bg-muted data-[state=active]:text-foreground"
              >
                {tab.icon} {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-10 rounded-2xl border border-border bg-muted/40 p-6 lg:p-12">
            {tabs.map((tab) => (
              <TabsContent
                key={tab.value}
                value={tab.value}
                className="grid gap-10 lg:min-h-[31rem] lg:grid-cols-2"
              >
                {/* Text column fills the panel height so the button lands in the
                    same place on every tab. */}
                <div className="flex h-full flex-col gap-5">
                  <Badge variant="outline" className="w-fit bg-background">
                    {tab.content.badge}
                  </Badge>
                  <h3 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
                    {tab.content.title}
                  </h3>
                  <p className="text-pretty text-muted-foreground">
                    {tab.content.description}
                  </p>
                  <div className="mt-auto pt-2.5">
                    {tab.content.href ? (
                      <Button asChild className="w-fit gap-2 rounded-full" size="lg">
                        <a href={tab.content.href}>{tab.content.buttonText}</a>
                      </Button>
                    ) : (
                      <Button className="w-fit gap-2 rounded-full" size="lg">
                        {tab.content.buttonText}
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex h-full w-full items-center justify-center">
                  {tab.content.visual ?? (
                    <img
                      src={tab.content.imageSrc}
                      alt={tab.content.imageAlt}
                      className="rounded-xl border border-border dark:invert"
                    />
                  )}
                </div>
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </section>
  );
};

export { Feature108 };
