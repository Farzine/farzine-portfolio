import Link from "next/link";
import { getAdminMessages } from "@/lib/dal/admin-messages";
import { MarkMessageRead } from "@/components/admin/message-read";
import { DeleteContent } from "@/components/admin/delete-project";
import { deleteMessageAction } from "@/app/admin/message-actions";
export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const input = (await searchParams).page;
  const candidate = typeof input === "string" ? Number(input) : 1;
  const page =
    Number.isSafeInteger(candidate) && candidate > 0 && candidate <= 100000
      ? candidate
      : 1;
  const messages = await getAdminMessages(page);
  return (
    <>
      <p className="eyebrow">Contact / Private inbox</p>
      <h1>Contact messages</h1>
      <p className="muted">
        Stored messages, 25 per page. No email notifications are sent. Contact
        intake is controlled in site settings.
      </p>
      {!messages.length ? <p>No stored messages yet.</p> : null}
      <div className="admin-list">
        {messages.map((message) => (
          <article className="admin-row" key={message.id}>
            <div>
              <h2>{message.name}</h2>
              <p>{message.email}</p>
              <p className="muted small">
                {message.read_at ? "Read" : "Unread"} /{" "}
                {new Date(message.created_at).toISOString()}
              </p>
              <p className="prose">{message.message}</p>
              {!message.read_at ? (
                <MarkMessageRead id={message.id} version={message.updated_at} />
              ) : null}
            </div>
            <DeleteContent
              id={message.id}
              title={message.name}
              version={message.updated_at}
              action={deleteMessageAction}
            />
          </article>
        ))}
      </div>
      <nav className="link-row" aria-label="Message pagination">
        {page > 1 ? (
          <Link
            className="button secondary"
            href={`/admin/messages?page=${page - 1}`}
          >
            Newer messages
          </Link>
        ) : null}
        {messages.length === 25 ? (
          <Link
            className="button secondary"
            href={`/admin/messages?page=${page + 1}`}
          >
            Older messages
          </Link>
        ) : null}
        <p className="muted small">Page {page}</p>
      </nav>
    </>
  );
}
