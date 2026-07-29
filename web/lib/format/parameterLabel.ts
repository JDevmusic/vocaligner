export function formatParameterLabel(parameter: string): string {
  const withSpaces = parameter.replace(/([a-z])([A-Z])/g, "$1 $2");
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}
