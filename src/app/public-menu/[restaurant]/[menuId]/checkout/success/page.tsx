import { createClient } from "@/lib/supabase/server";
import { OrderSuccessReceipt } from "@/components/menu/order-success-receipt";

interface PageProps {
  params: Promise<{ restaurant: string; menuId: string }>;
  searchParams?: Promise<{ orderId?: string }>;
}

export default async function OrderSuccessPage({ params, searchParams }: PageProps) {
  const { restaurant, menuId } = await params;
  const sp = searchParams ? await searchParams : undefined;
  const orderId = sp?.orderId ?? null;

  let restaurantName = restaurant;
  let restaurantLogoUrl: string | null = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("restaurants")
      .select("name, logo_url")
      .eq("slug", restaurant)
      .single();

    if (data?.name) restaurantName = data.name;
    restaurantLogoUrl = data?.logo_url ?? null;
  } catch {
    // ignore fetch failures; UI will fall back to slug
  }

  return (
    <OrderSuccessReceipt
      restaurantSlug={restaurant}
      menuId={menuId}
      orderId={orderId}
      restaurantName={restaurantName}
      restaurantLogoUrl={restaurantLogoUrl}
    />
  );
}

