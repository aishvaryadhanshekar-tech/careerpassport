export function jobsNavActive(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname.startsWith("/create-job") ||
    pathname.startsWith("/role-profile") ||
    pathname.startsWith("/step-2") ||
    pathname.startsWith("/step-3")
  );
}
