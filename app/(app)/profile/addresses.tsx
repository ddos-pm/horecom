"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { upsertAddress, deleteAddress, setDefaultAddress } from "./actions";

type Address = {
  id: string;
  label: string;
  street: string;
  house: string;
  details: string | null;
  comment: string | null;
  isDefault: boolean;
};

const EMPTY: Omit<Address, "id" | "isDefault"> = {
  label: "",
  street: "",
  house: "",
  details: "",
  comment: "",
};

export function AddressList({ initial }: { initial: Address[] }) {
  const [editing, setEditing] = useState<null | { mode: "new" } | { mode: "edit"; address: Address }>(null);

  return (
    <section className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Адреса доставки</h2>
        <Button size="sm" variant="outline" onClick={() => setEditing({ mode: "new" })}>
          <Plus className="h-4 w-4" />
          Добавить адрес
        </Button>
      </div>

      {initial.length === 0 ? (
        <p className="text-sm text-muted-foreground">Адресов пока нет. Добавьте первый.</p>
      ) : (
        <ul className="space-y-2">
          {initial.map((a) => (
            <AddressRow
              key={a.id}
              address={a}
              onEdit={() => setEditing({ mode: "edit", address: a })}
            />
          ))}
        </ul>
      )}

      {editing && (
        <AddressEditor
          initial={editing.mode === "edit" ? editing.address : null}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}

function AddressRow({ address, onEdit }: { address: Address; onEdit: () => void }) {
  const [pending, startTransition] = useTransition();

  function handleSetDefault() {
    startTransition(async () => {
      const result = await setDefaultAddress(address.id);
      if (!result.success) toast.error(result.error);
    });
  }

  function handleDelete() {
    if (!confirm("Удалить адрес?")) return;
    startTransition(async () => {
      const result = await deleteAddress(address.id);
      if (result.success) toast.success("Удалено");
      else toast.error(result.error);
    });
  }

  return (
    <li className="flex items-start gap-3 rounded-md border border-border bg-background p-3">
      <div className="flex-1">
        <div className="flex items-center gap-2 text-sm font-medium">
          {address.label}
          {address.isDefault && (
            <span className="inline-flex items-center gap-0.5 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              <Star className="h-3 w-3" />
              По умолчанию
            </span>
          )}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {address.street}, {address.house}
          {address.details ? `, ${address.details}` : ""}
        </div>
        {address.comment && (
          <div className="mt-1 text-xs text-muted-foreground">«{address.comment}»</div>
        )}
      </div>
      <div className="flex items-center gap-1">
        {!address.isDefault && (
          <Button size="sm" variant="ghost" onClick={handleSetDefault} disabled={pending} title="По умолчанию">
            <Star className="h-4 w-4" />
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onEdit} title="Редактировать">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDelete}
          disabled={pending}
          title="Удалить"
          className="hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );
}

function AddressEditor({
  initial,
  onClose,
}: {
  initial: Address | null;
  onClose: () => void;
}) {
  const [data, setData] = useState({
    label: initial?.label ?? EMPTY.label,
    street: initial?.street ?? EMPTY.street,
    house: initial?.house ?? EMPTY.house,
    details: initial?.details ?? "",
    comment: initial?.comment ?? "",
  });
  const [pending, startTransition] = useTransition();

  function update<K extends keyof typeof data>(k: K, v: string) {
    setData((p) => ({ ...p, [k]: v }));
  }

  function handleSave() {
    startTransition(async () => {
      const result = await upsertAddress({ id: initial?.id, ...data });
      if (result.success) {
        toast.success(initial ? "Адрес обновлён" : "Адрес добавлен");
        onClose();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md space-y-3 rounded-lg bg-card p-5 shadow-xl">
        <h3 className="text-lg font-semibold">
          {initial ? "Редактировать адрес" : "Новый адрес"}
        </h3>
        <Field label="Метка (например: «Кафе» / «Склад»)">
          <input
            type="text"
            value={data.label}
            onChange={(e) => update("label", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            autoFocus
          />
        </Field>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <Field label="Улица">
              <input
                type="text"
                value={data.street}
                onChange={(e) => update("street", e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </Field>
          </div>
          <Field label="Дом">
            <input
              type="text"
              value={data.house}
              onChange={(e) => update("house", e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
        </div>
        <Field label="Кв. / офис / этаж">
          <input
            type="text"
            value={data.details}
            onChange={(e) => update("details", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Комментарий курьеру">
          <textarea
            value={data.comment}
            onChange={(e) => update("comment", e.target.value)}
            rows={2}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={pending || !data.label || !data.street || !data.house}>
            {pending ? "Сохраняю…" : "Сохранить"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
