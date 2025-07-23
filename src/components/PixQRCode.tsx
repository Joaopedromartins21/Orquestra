import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

/* === Funções utilitárias ================================================== */
const tlv = (id: string, value: string) =>
  id + value.length.toString().padStart(2, '0') + value;

/* CRC-16/CCITT-FALSE (0x1021, init 0xFFFF) */
const crc16 = (data: string): string => {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000)
        ? ((crc << 1) ^ 0x1021) & 0xffff
        : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
};

/* Gera BR Code estático com valor definido */
const buildPixWithValue = (pixKey: string, name: string, city: string, amount: number): string => {
  const merchantInfo =
    tlv('00', 'BR.GOV.BCB.PIX') +           // GUI obrigatório
    tlv('01', pixKey);                      // chave PIX

  const amountStr = amount.toFixed(2);

  const payload =
    tlv('00', '01') +                       // Payload Format Indicator
    tlv('26', merchantInfo) +               // Merchant Account Information
    tlv('52', '0000') +                     // MCC genérico
    tlv('53', '986') +                      // Moeda BRL
    tlv('54', amountStr) +                  // Valor da transação
    tlv('58', 'BR') +                       // País
    tlv('59', name.substring(0, 25)) +      // Nome (máx 25)
    tlv('60', city.substring(0, 15)) +      // Cidade (máx 15)
    tlv('62', tlv('05', '***')) +           // Reference label "***"
    '6304';                                 // Reserva CRC

  return payload + crc16(payload);
};

/* === Componente React ===================================================== */
interface PixQRCodeProps {
  payment: {
    amount: number;
  };
  onComplete?: () => void;
}

const PixQRCode: React.FC<PixQRCodeProps> = ({ payment, onComplete }) => {
  const pixCode = buildPixWithValue(
    '28329618000119',      // CNPJ – chave PIX
    'SISTEMA DE ENTREGAS', // Nome (use apenas A-Z, 0-9 e espaço)
    'SAO PAULO',           // Cidade em CAIXA-ALTA
    payment.amount         // Valor do pagamento
  );

  const copyCode = () => {
    navigator.clipboard.writeText(pixCode);
    alert('Código PIX copiado!');
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-center mb-4">Pagamento Pix</h2>

      <div className="text-center mb-4">
        <p className="text-lg font-medium text-gray-900">
          Valor: R$ {payment.amount.toFixed(2)}
        </p>
      </div>

      <div className="flex justify-center mb-4">
        <QRCodeSVG value={pixCode} size={220} level="H" includeMargin />
      </div>

      <button
        onClick={copyCode}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded mb-4"
      >
        Copiar código Pix
      </button>

      {onComplete && (
        <button
          onClick={onComplete}
          className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded"
        >
          Confirmar Pagamento
        </button>
      )}

      <p className="text-sm text-gray-500 text-center mt-4">
        Escaneie o QR code ou copie o código Pix para pagar.
      </p>
    </div>
  );
};

export default PixQRCode;