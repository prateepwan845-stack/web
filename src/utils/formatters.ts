import { JobStatus, PaymentMethod } from '../types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('th-TH').format(num);
}

export function formatThaiDate(dateString?: string, includeTime: boolean = false): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const thaiMonths = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];

    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const year = date.getFullYear() + 543; // Buddhist Era

    if (includeTime) {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day} ${month} ${year} ${hours}:${minutes} น.`;
    }

    return `${day} ${month} ${year}`;
  } catch {
    return dateString;
  }
}

export function getStatusBadgeClass(status: JobStatus): string {
  switch (status) {
    case 'รอตรวจสอบ':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'รอประเมินราคา':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'รออนุมัติ':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'กำลังซ่อม':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'รออะไหล่':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'ซ่อมเสร็จ':
      return 'bg-teal-100 text-teal-800 border-teal-300';
    case 'รอลูกค้ารับรถ':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    case 'ส่งมอบแล้ว':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'ยกเลิก':
      return 'bg-rose-100 text-rose-800 border-rose-300';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-300';
  }
}

export function getPaymentMethodBadgeClass(method: PaymentMethod): string {
  switch (method) {
    case 'QR Payment':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'โอนเงิน':
      return 'bg-sky-100 text-sky-800 border-sky-200';
    case 'บัตรเครดิต':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'เงินสด':
    default:
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  }
}

/**
 * Generate a standard Thai PromptPay QR Code image URL via promptpay.io or promptpay SVG
 */
export function getPromptPayQrUrl(target: string, amount?: number): string {
  const cleanTarget = target.replace(/[^0-9]/g, '');
  if (!cleanTarget) return '';
  if (amount && amount > 0) {
    return `https://promptpay.io/${cleanTarget}/${amount.toFixed(2)}.png`;
  }
  return `https://promptpay.io/${cleanTarget}.png`;
}
