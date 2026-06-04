import { Badge } from "@/components/ui/badge";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/lib/constants";

const STYLES: Record<string, string> = {
  efectivo: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  transferencia: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  mercado_pago: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
};

export function PaymentBadge({ method }: { method: string }) {
  return (
    <Badge variant="secondary" className={STYLES[method] ?? ""}>
      {PAYMENT_METHOD_LABELS[method as PaymentMethod] ?? method}
    </Badge>
  );
}
