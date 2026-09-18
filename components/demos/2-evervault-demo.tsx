import { EvervaultCard, Icon } from "@/components/ui/evervault-card";

export function EvervaultCardDemo() {
  return (
    <div className="relative mx-auto flex h-[30rem] max-w-sm flex-col items-start rounded-2xl border border-border p-4">
      <Icon className="absolute -left-3 -top-3 h-6 w-6 text-muted-foreground" />
      <Icon className="absolute -bottom-3 -left-3 h-6 w-6 text-muted-foreground" />
      <Icon className="absolute -right-3 -top-3 h-6 w-6 text-muted-foreground" />
      <Icon className="absolute -bottom-3 -right-3 h-6 w-6 text-muted-foreground" />

      <EvervaultCard text="hover" />

      <h3 className="mt-4 text-sm text-muted-foreground">
        Hover over this card to reveal an awesome effect. Running out of copy
        here.
      </h3>
      <p className="mt-4 rounded-full border border-border px-3 py-0.5 text-sm text-foreground">
        Watch me hover
      </p>
    </div>
  );
}
