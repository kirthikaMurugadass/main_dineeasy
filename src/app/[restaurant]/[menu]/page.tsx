import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ restaurant: string; menu: string }>;
}

/**
 * Legacy route: /[restaurant]/[menu]
 * Redirects to the new restaurant-based route: /r/[restaurant]
 */
export default async function LegacyMenuPage({ params }: PageProps) {
  const { restaurant } = await params;
  redirect(`/r/${restaurant}`);
}
