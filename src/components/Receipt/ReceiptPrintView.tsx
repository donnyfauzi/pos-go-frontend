import type { ReceiptResponse } from '../../services/receiptService';

interface ReceiptPrintViewProps {
  data: ReceiptResponse | null;
  loading?: boolean;
}

const formatCurrency = (n: number) =>
  n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

export default function ReceiptPrintView({ data, loading }: ReceiptPrintViewProps) {
  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500 receipt-print-area">
        Memuat struk...
      </div>
    );
  }
  if (!data) {
    return (
      <div className="p-6 text-center text-gray-500 receipt-print-area">
        Data struk tidak tersedia.
      </div>
    );
  }

  const orderTypeLabel = data.order_type === 'dine_in' ? 'Makan di tempat' : 'Bawa pulang';
  const tableInfo = data.table_number != null ? `Meja ${data.table_number}` : null;
  const paymentLabel =
    data.payment_method === 'cash'
      ? 'Tunai'
      : data.payment_method === 'e_wallet'
        ? 'E-Wallet'
        : data.payment_method === 'credit_card'
          ? 'Kartu kredit'
          : data.payment_method === 'debit_card'
            ? 'Kartu debit'
            : data.payment_method;

  return (
    <div
      className="receipt-print-area bg-white p-6 max-w-[320px] mx-auto text-sm"
      style={{ fontFamily: 'monospace' }}
    >
      <div className="text-center border-b border-gray-300 pb-3 mb-3">
        <h2 className="text-lg font-bold text-gray-900">POS Go Restaurant</h2>
        <p className="text-xs text-gray-600 mt-1">Struk Pembelian</p>
      </div>
      <div className="space-y-1 text-gray-700">
        <p>No. {data.id.slice(0, 8).toUpperCase()}</p>
        <p>{formatDateTime(data.created_at)}</p>
      </div>
      <div className="border-b border-dashed border-gray-300 py-3 my-3 space-y-1">
        <p><strong>Pelanggan:</strong> {data.customer_name}</p>
        <p><strong>No. HP:</strong> {data.customer_phone}</p>
        <p><strong>Tipe:</strong> {orderTypeLabel}{tableInfo ? ` (${tableInfo})` : ''}</p>
      </div>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="py-1">Item</th>
            <th className="py-1 text-right">Qty</th>
            <th className="py-1 text-right">Harga</th>
            <th className="py-1 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((it, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-1">{it.menu_name}</td>
              <td className="py-1 text-right">{it.quantity}</td>
              <td className="py-1 text-right">{formatCurrency(it.menu_price)}</td>
              <td className="py-1 text-right">{formatCurrency(it.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-gray-300 mt-3 pt-3 space-y-1">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>Rp {formatCurrency(data.subtotal)}</span>
        </div>
        {data.discount > 0 && (
          <div className="flex justify-between text-green-700">
            <span>Diskon</span>
            <span>- Rp {formatCurrency(data.discount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>PPN 10%</span>
          <span>Rp {formatCurrency(data.tax)}</span>
        </div>
        <div className="flex justify-between font-bold text-base mt-2">
          <span>Total</span>
          <span>Rp {formatCurrency(data.total_amount)}</span>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-dashed border-gray-300 text-xs">
        <p>Pembayaran: {paymentLabel} ({data.payment_status})</p>
        {data.closed_by_user_name && data.closed_by_user_name !== '-' && (
          <p>Kasir: {data.closed_by_user_name}</p>
        )}
      </div>
      <p className="text-center text-xs text-gray-500 mt-4">Terima kasih</p>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .receipt-print-area, .receipt-print-area * { visibility: visible; }
          .receipt-print-area { position: absolute; left: 0; top: 0; width: 100%; max-width: 320px; }
        }
      `}</style>
    </div>
  );
}
