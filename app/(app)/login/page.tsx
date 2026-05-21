export const metadata = { title: "Вход" };

export default function LoginPage() {
  return (
    <div className="container-tight py-16">
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="text-2xl font-semibold">Вход в Horecom</h1>
        <p className="text-sm text-muted-foreground">
          Магия по email — будет подключено в Этапе 2 (Supabase auth).
        </p>
      </div>
    </div>
  );
}
