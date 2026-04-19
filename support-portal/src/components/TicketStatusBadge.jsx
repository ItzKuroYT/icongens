import { statusClassName } from "@/lib/format";

export default function TicketStatusBadge({ status }) {
  return <span className={statusClassName(status)}>{status}</span>;
}
