export function ticketCategoryLabel(value) {
  switch (value) {
    case "GENERAL_SUPPORT":
      return "General Support";
    case "BUG_REPORT":
      return "Bug Reports";
    case "APPEAL":
      return "Appeals";
    case "PLAYER_REPORT":
      return "Player Reports";
    default:
      return value;
  }
}

export function statusClassName(status) {
  switch (status) {
    case "OPEN":
      return "badge-open";
    case "CLOSED":
      return "badge-closed";
    case "PENDING":
      return "badge-pending";
    default:
      return "badge";
  }
}
