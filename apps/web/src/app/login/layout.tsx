/**
 * Standalone layout for /login route.
 * Overrides the root layout so that the login page is rendered
 * WITHOUT the global site header and footer — exactly like Daraz's
 * dedicated authentication pages.
 */
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
