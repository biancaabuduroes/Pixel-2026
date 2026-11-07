/** Figma: SectionHeader (node 35:347). Section title (Text/title-xl 20/26 bold) with an optional trailing element. */
export function SectionHeader({ title, trailing, id }: { title: string; trailing?: React.ReactNode; id?: string }) {
  return (
    <div className="flex w-full items-center justify-between gap-3">
      <h2 id={id} className="title-xl text-text-primary">
        {title}
      </h2>
      {trailing}
    </div>
  );
}
