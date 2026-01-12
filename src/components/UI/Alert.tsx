import { X, CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

interface AlertProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  message: string;
  subtitle?: string;
  onClose?: () => void;
  className?: string;
}

export default function Alert({
  type = 'info',
  message,
  subtitle,
  onClose,
  className = '',
}: AlertProps) {
  const variants = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: CheckCircle2,
      iconColor: 'text-green-600',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: XCircle,
      iconColor: 'text-red-600',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: Info,
      iconColor: 'text-blue-600',
    },
  };

  const variant = variants[type];
  const IconComponent = variant.icon;

  return (
    <div
      className={`mb-4 p-4 ${variant.bg} border ${variant.border} rounded-lg ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <IconComponent
          size={20}
          className={`flex-shrink-0 ${variant.iconColor} mt-0.5`}
        />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${variant.text}`}>{message}</p>
          {subtitle && (
            <p className={`text-xs ${variant.text} opacity-75 mt-1`}>{subtitle}</p>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className={`flex-shrink-0 ${variant.text} opacity-60 hover:opacity-100 focus:outline-none transition-opacity`}
            aria-label="Close alert"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
