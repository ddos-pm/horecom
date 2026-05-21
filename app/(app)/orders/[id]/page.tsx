export const metadata = { title: "Заказ" };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="container-tight py-8">
      <h1 className="text-2xl font-semibold">Заказ #{id}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Детализация заказа со статус-таймлайном будет в Этапе 3.
      </p>
    </div>
  );
}
