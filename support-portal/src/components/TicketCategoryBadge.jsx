import { ticketCategoryLabel } from "@/lib/format";

export default function TicketCategoryBadge({ category }) {
  return (
    <span className="badge bg-emerald-200/10 text-emerald-100">
      {ticketCategoryLabel(category)}
    </span>
  );
}
