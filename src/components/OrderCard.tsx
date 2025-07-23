import React from 'react';
import { Order } from '../types';
import {
  MapPin,
  Phone,
  Calendar,
  Clock,
  Package,
  FileText,
  Trash2,
  DollarSign,
  CreditCard
} from 'lucide-react';

interface OrderCardProps {
  order: Order;
  showActions?: boolean;
  onActionClick?: () => void;
  onDeleteClick?: () => void;
  actionLabel?: string;
}

const parseDate = (raw: string | number | Date) => {
  const asDate = new Date(raw);
  if (!isNaN(asDate.getTime())) return asDate;
  const numeric = Number(raw);
  if (!Number.isNaN(numeric)) {
    const dateFromNumeric = new Date(
      numeric.toString().length === 10 ? numeric * 1000 : numeric,
    );
    if (!isNaN(dateFromNumeric.getTime())) return dateFromNumeric;
  }
  return null;
};

const formatDate = (value: string | number | Date) => {
  const date = parseDate(value);
  return date
    ? date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '--/--/----';
};

const formatTime = (value: string | number | Date) => {
  const date = parseDate(value);
  return date
    ? date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : '--:--';
};

const calculateTotal = (order: Order) => {
  if (typeof order.totalAmount === 'number' && !Number.isNaN(order.totalAmount)) {
    return order.totalAmount;
  }
  if (order.products && order.products.length) {
    return order.products.reduce(
      (acc, p) => acc + (p.quantity || 0) * (p.price || 0),
      0,
    );
  }
  return 0;
};

const getStatusColor = (status: Order['status']) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'assigned':
      return 'bg-blue-100 text-blue-800';
    case 'in_progress':
      return 'bg-purple-100 text-purple-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusText = (status: Order['status']) => {
  switch (status) {
    case 'pending':
      return 'Pendente';
    case 'assigned':
      return 'Atribuído';
    case 'in_progress':
      return 'Em andamento';
    case 'completed':
      return 'Concluído';
    default:
      return status;
  }
};

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  showActions = false,
  onActionClick,
  onDeleteClick,
  actionLabel = 'Ver detalhes',
}) => {
  const totalAmount = calculateTotal(order);
  const totalTripCosts = order.tripCosts?.reduce((sum, cost) => sum + cost.amount, 0) || 0;
  const cashPayment = order.payments?.find(p => p.type === 'cash')?.amount || 0;
  const pixPayment = order.payments?.find(p => p.type === 'pix')?.amount || 0;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {order.customerName || 'Cliente não informado'}
            </h3>
            {order.products?.length > 0 && (
              <p className="text-gray-700 mt-1">
                {order.products[0].quantity}x {order.products[0].name || 'Produto'}
              </p>
            )}
            <div className="mt-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                  order.status,
                )}`}
              >
                {getStatusText(order.status)}
              </span>
            </div>
          </div>
          <div className="text-right min-w-[90px] ml-4">
            <div className="text-gray-900 font-medium whitespace-nowrap">
              R$ {totalAmount.toFixed(2)}
            </div>
            {totalTripCosts > 0 && (
              <>
                <div className="text-red-600 text-sm whitespace-nowrap">
                  - R$ {totalTripCosts.toFixed(2)}
                </div>
                <div className="text-green-600 font-medium whitespace-nowrap mt-1">
                  = R$ {(order.netAmount || 0).toFixed(2)}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {order.customerName && (
            <div className="flex items-start">
              <FileText size={18} className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Cliente: {order.customerName}</span>
            </div>
          )}

          {order.customerAddress && (
            <div className="flex items-start">
              <MapPin size={18} className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Endereço: {order.customerAddress}</span>
            </div>
          )}

          {order.customerPhone && (
            <div className="flex items-center">
              <Phone size={18} className="text-blue-500 mr-2 flex-shrink-0" />
              <span className="text-gray-700">{order.customerPhone}</span>
            </div>
          )}

          {order.createdAt && (
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1">
              <div className="flex items-center">
                <Calendar size={18} className="text-blue-500 mr-2 flex-shrink-0" />
                <span className="text-gray-700">{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex items-center">
                <Clock size={18} className="text-blue-500 mr-2 flex-shrink-0" />
                <span className="text-gray-700">{formatTime(order.createdAt)}</span>
              </div>
            </div>
          )}

          {order.products && order.products.length > 0 && (
            <div className="flex items-start">
              <Package size={18} className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <span className="text-gray-900 font-medium">Produtos:</span>
                <ul className="mt-1 space-y-1">
                  {order.products.map((product, index) => (
                    <li key={index} className="text-gray-700">
                      {product.quantity}x {product.name || 'Produto'} – R$ {product.price.toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {(cashPayment > 0 || pixPayment > 0) && (
            <div className="flex items-start">
              <DollarSign size={18} className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <span className="text-gray-900 font-medium">Pagamentos:</span>
                <div className="mt-1 space-y-1">
                  {cashPayment > 0 && (
                    <div className="flex items-center text-gray-700">
                      <DollarSign size={14} className="mr-1" />
                      Dinheiro: R$ {cashPayment.toFixed(2)}
                    </div>
                  )}
                  {pixPayment > 0 && (
                    <div className="flex items-center text-gray-700">
                      <CreditCard size={14} className="mr-1" />
                      PIX: R$ {pixPayment.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {order.notes && (
            <div className="flex items-start">
              <FileText size={18} className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">{order.notes}</span>
            </div>
          )}
        </div>
      </div>

      {showActions && (
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
          <div className="flex gap-2">
            <button
              onClick={onActionClick}
              className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200 flex justify-center items-center"
            >
              {actionLabel}
            </button>
            {onDeleteClick && order.status === 'pending' && (
              <button
                onClick={onDeleteClick}
                className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-200 flex justify-center items-center"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderCard;