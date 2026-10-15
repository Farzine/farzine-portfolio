export function SectionHeading({ title, id }: { title: string; id?: string }) {
  return (
    <h2 className="section-heading" id={id} tabIndex={-1}>
      {title}
    </h2>
  );
}
export function EmptySection({
  text = "Nothing published here yet.",
}: {
  text?: string;
}) {
  return <p className="empty-state">{text}</p>;
}
