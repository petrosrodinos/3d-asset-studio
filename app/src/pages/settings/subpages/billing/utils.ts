export function formatUsageKind(kind: string): string {
  const map: Record<string, string> = {
    image: "Image",
    trippo: "3D",
    tripo: "3D",
    chat: "Chat",
  };
  return map[kind] ?? kind;
}

export function formatUsageOperation(operation: string | null | undefined): string {
  if (operation == null || operation === "") return "—";
  const map: Record<string, string> = { pipeline: "mesh" };
  return map[operation] ?? operation;
}
