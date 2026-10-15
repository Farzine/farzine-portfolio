export function SectionHeading({ title, id }: { title: string; id?: string }) {
  return (
    <h2 className="section-heading" id={id} tabIndex={-1}>
      {title}
    </h2>
  );
}
export function EmptySection() {
  return <p className="empty-state">Nothing published here yet.</p>;
}
