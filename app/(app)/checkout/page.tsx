export const metadata = { title: "Оформление заказа" };

export default function CheckoutPage() {
  return (
    <div className="container-tight py-8">
      <h1 className="text-2xl font-semibold">Оформление заказа</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        3-секционный checkout будет в Этапе 3.
      </p>
    </div>
  );
}
