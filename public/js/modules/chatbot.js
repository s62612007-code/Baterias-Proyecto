import { PRODUCTS, BUSINESS, ACCESSORIES, SERVICES } from '../data/products.js';
import { formatPrice } from '../utils/format.js';

const SALES_PATTERNS = [
  {
    test: /precio|costo|cuesta|cuánto|cuanto|valor|oferta|cotiz/i,
    reply: (text) => {
      const query = text.replace(/precio|costo|cuesta|cuánto|cuanto|valor|oferta|cotiz/gi, '').trim();
      const matches = query.length > 2
        ? PRODUCTS.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.reference.toLowerCase().includes(query.toLowerCase()))
        : [];
      if (matches.length === 0) {
        return `Indique la referencia (ej. NS60, 42IST) o escríbanos al ${BUSINESS.phoneDisplay} para cotizar.`;
      }
      const list = matches.slice(0, 5).map((p) => {
        const offer = p.offer ? ` (Oferta, antes ${formatPrice(p.originalPrice)})` : '';
        return `• ${p.name}: ${formatPrice(p.price)}${offer}`;
      });
      return `Baterías disponibles:\n${list.join('\n')}${matches.length > 5 ? '\n…más en el catálogo.' : ''}\n\n¿Compra con domicilio? ${formatPrice(SERVICES.deliveryPricePerCircuit)}/circuito.`;
    },
  },
  {
    test: /mac|willard|coexito|varta|duncan|bosch|ac delco|rocket|optima/i,
    reply: (text) => {
      const brand = text.match(/mac|willard|coexito|varta|duncan|bosch|ac delco|rocket|optima/i)?.[0];
      if (!brand) return `Vea el catálogo por marca o cotice al ${BUSINESS.phoneDisplay}.`;
      const matches = PRODUCTS.filter((p) => (p.category || p.brand || '').toLowerCase().includes(brand.toLowerCase()));
      if (matches.length === 0) return `Sin stock listado de ${brand.toUpperCase()}. Cotice por WhatsApp.`;
      const list = matches.slice(0, 4).map((p) => `• ${p.reference}: ${formatPrice(p.price)}`);
      return `${brand.toUpperCase()} — desde:\n${list.join('\n')}\n…${matches.length} referencias en catálogo.`;
    },
  },
  {
    test: /ns40|ns60|42|47|48|27|34|4d|8d|referencia/i,
    reply: (text) => {
      const ref = text.match(/ns\d+|42\w*|47\w*|48\w*|27\w*|34\w*|4d|8d|\d+h/i)?.[0];
      if (!ref) return 'Indique la referencia exacta para cotizar.';
      const matches = PRODUCTS.filter((p) => p.reference.toLowerCase().includes(ref.toLowerCase()));
      if (matches.length === 0) return `Referencia ${ref.toUpperCase()}: consulte disponibilidad al ${BUSINESS.phoneDisplay}.`;
      const list = matches.slice(0, 5).map((p) => `• ${p.category || p.brand} ${p.reference}: ${formatPrice(p.price)}`);
      return `Opciones ${ref.toUpperCase()}:\n${list.join('\n')}`;
    },
  },
  {
    test: /domicilio|entrega|instalaci/i,
    reply: () =>
      `Al comprar batería: domicilio e instalación ${formatPrice(SERVICES.deliveryPricePerCircuit)} por circuito en Cali. Cotice al ${BUSINESS.phoneDisplay}.`,
  },
  {
    test: /usada|usado|descuento|recicl/i,
    reply: () =>
      `Descuento de ${formatPrice(SERVICES.recycleDiscount)} al entregar su batería usada al comprar una nueva.`,
  },
  {
    test: /born|soporte|accesor/i,
    reply: () =>
      `Accesorios en venta:\n• Bornes: ${formatPrice(ACCESSORIES[0].price)}\n• Soportes: ${formatPrice(ACCESSORIES[1].price)}`,
  },
  {
    test: /pago|nequi|bancolombia|efectivo|datáfono|datafono/i,
    reply: () =>
      'Aceptamos efectivo contra entrega, Nequi, Bancolombia, Davivienda y datáfono móvil.',
  },
];

const GREETINGS = /hola|buenas|buenos|saludos|hey/i;

export function initChatbot() {
  const toggle = document.querySelector('#chatbot-toggle');
  const panel = document.querySelector('#chatbot-panel');
  const messages = document.querySelector('#chatbot-messages');
  const input = document.querySelector('#chatbot-input');
  const sendBtn = document.querySelector('#chatbot-send');

  if (!toggle || !panel || !messages) return;

  function addMessage(text, type) {
    const msg = document.createElement('div');
    msg.className = `chatbot-msg chatbot-msg--${type}`;
    msg.textContent = text;
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
  }

  function getReply(text) {
    const match = SALES_PATTERNS.find((p) => p.test.test(text));
    if (match) return match.reply(text);

    if (GREETINGS.test(text)) {
      return `Asistente de ventas de ${BUSINESS.name}. Pregunte precios, marcas, referencias o cotice al ${BUSINESS.phoneDisplay}.`;
    }

    return `Para cotizar, envíe la referencia o foto de su batería al WhatsApp ${BUSINESS.phoneDisplay}.`;
  }

  function handleSend() {
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    input.value = '';

    setTimeout(() => {
      addMessage(getReply(text), 'bot');
    }, 350);
  }

  toggle.addEventListener('click', () => {
    panel.classList.toggle('is-open');
  });

  sendBtn.addEventListener('click', handleSend);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSend();
  });

  addMessage(
    `${BUSINESS.name} — venta de baterías. Consulte precios por referencia, marcas del catálogo o cotice por WhatsApp ${BUSINESS.phoneDisplay}.`,
    'bot'
  );
}

export { buildWhatsAppLink } from '../utils/format.js';
