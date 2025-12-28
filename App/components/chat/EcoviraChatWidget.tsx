"use client";

import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, MessageCircle } from 'lucide-react';
import { EcoviraCard } from '../EcoviraCard';
import { cn } from '../../lib/utils';

interface EcoviraChatWidgetProps {
  context?: {
    page?: 'flights' | 'stays' | 'cars' | 'transfers';
    route?: { from?: string; to?: string };
    dates?: { depart?: string; return?: string };
    passengers?: number;
    cabin?: string;
    currency?: string;
    topFlights?: Array<{ price: string; duration: string; stops: string; from: string; to: string }>;
  };
  isOpen?: boolean;
  onClose?: () => void;
}

const QUICK_CHIPS = [
  { label: 'Best option?', query: 'Which flight is best and why?' },
  { label: 'Fees?', query: 'How much is the service fee?' },
  { label: 'Baggage?', query: 'What is the baggage allowance?' },
  { label: 'Refunds?', query: 'What is the refund policy?' },
  { label: 'Currency/Crypto?', query: 'Can I pay with cryptocurrency?' },
  { label: 'How to book?', query: 'How do I book a flight?' },
];

const FAQ_RESPONSES: Record<string, string> = {
  'best option': "The best option depends on your priorities. Check the AI Assist widget for Value Score, Best Options, and actionable tips. Generally: cheapest for budget, fastest for time-sensitive, best value for balance.",
  'fees': "We charge a 4% service fee on all bookings. This covers platform maintenance, customer support, and secure payment processing. The fee is clearly displayed in the price breakdown of each result.",
  'baggage': "Baggage allowance varies by airline and fare class. Economy typically includes 1 carry-on (7kg) and 1 checked bag (23kg). Premium classes may include more. Check airline details in the flight card.",
  'refunds': "Refund policies vary by airline and fare type. Flexible fares are usually refundable (minus fees), while basic fares may be non-refundable. Contact us within 24 hours of booking for best options.",
  'currency': "We support multiple currencies (AUD, USD, EUR, GBP, TRY, AED, SAR, QAR, KWD, INR, THB, MYR, SGD, JPY, KRW) and cryptocurrencies (USDT, USDC, BTC, ETH). Select your preferred currency in the search panel.",
  'crypto': "Yes! We accept USDT, USDC, BTC, and ETH. Select your preferred cryptocurrency in the currency selector. All crypto payments are processed securely.",
  'book': "To book: 1) Search for flights, 2) Review results and use AI Assist for insights, 3) Click 'Select Flight' on your preferred option, 4) Complete booking with secure payment. We'll send confirmation via email.",
  'payment': "We accept major credit cards, debit cards, and cryptocurrencies. All payments are processed securely through encrypted channels. Your payment information is never stored on our servers.",
  'changes': "Flight changes depend on the fare type. Flexible fares allow changes (fees may apply). Basic fares may not allow changes. Contact us or check your booking confirmation for specific policies.",
  'check-in': "Online check-in opens 24-48 hours before departure, depending on the airline. You'll receive an email with check-in instructions. Mobile boarding passes are available for most airlines.",
};

export function EcoviraChatWidget({ context, isOpen: controlledIsOpen, onClose }: EcoviraChatWidgetProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  
  // Also listen for global events as fallback (for uncontrolled mode)
  useEffect(() => {
    if (controlledIsOpen === undefined) {
      const handleOpen = () => setInternalIsOpen(true);
      const handleClose = () => setInternalIsOpen(false);
      
      window.addEventListener('ecovira-chat-open', handleOpen);
      window.addEventListener('ecovira-chat-close', handleClose);
      
      return () => {
        window.removeEventListener('ecovira-chat-open', handleOpen);
        window.removeEventListener('ecovira-chat-close', handleClose);
      };
    }
  }, [controlledIsOpen]);
  
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { 
      role: 'assistant', 
      content: context 
        ? `Hello! I'm your 24/7 AI assistant. I can help with your ${context.page || 'trip'} search, answer questions about fees, baggage, refunds, currency options, and booking. How can I assist you?`
        : "Hello! I'm your 24/7 AI assistant. How can I help you today?"
    }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (query?: string) => {
    const userMessage = query || input.trim();
    if (!userMessage) return;

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    if (!query) setInput('');

    // Context-aware response generation
    const lowerInput = userMessage.toLowerCase();
    let response = "I understand you're asking about that. Let me help you with that. For more specific assistance, please contact our concierge support team.";

    // Check FAQ responses
    for (const [key, answer] of Object.entries(FAQ_RESPONSES)) {
      if (lowerInput.includes(key)) {
        response = answer;
        break;
      }
    }

    // Context-specific responses
    if (context) {
      if (lowerInput.includes('best') && context.topFlights && context.topFlights.length > 0) {
        const cheapest = context.topFlights.reduce((min, f) => 
          parseFloat(f.price || 0) < parseFloat(min.price || 0) ? f : min, context.topFlights[0]
        );
        response = `Based on your search, the cheapest option is ${cheapest.from} → ${cheapest.to} for ${cheapest.price} ${context.currency || 'USD'}. Check the AI Assist widget for Value Score and detailed insights.`;
      } else if (lowerInput.includes('score') || lowerInput.includes('value')) {
        response = "The AI Value Score (0-100) considers Price Fairness, Duration Efficiency, Stops Penalty, and Departure Convenience. Open the AI Assist widget (bottom-right) to see detailed scores for each flight.";
      } else if (lowerInput.includes('fee') && context.currency) {
        response = `Our service fee is 4% of the base fare. For example, if a flight costs 100 ${context.currency}, the base is ~96.15 ${context.currency} and the fee is ~3.85 ${context.currency}. All prices include this breakdown.`;
      } else if (lowerInput.includes('stops') || lowerInput.includes('stop')) {
        response = "Direct flights (0 stops) are fastest and most convenient but may cost more. 1-stop flights offer a balance. 2+ stops are usually cheapest but take longer. Check the AI Assist widget for Value Score that factors in stops.";
      } else if (lowerInput.includes('route') && context.route) {
        response = `You're searching ${context.route.from || '?'} → ${context.route.to || '?'}. ${context.dates?.depart ? `Departure: ${context.dates.depart}` : ''} ${context.dates?.return ? `Return: ${context.dates.return}` : ''}. ${context.passengers ? `${context.passengers} passenger(s)` : ''}.`;
      }
    }

    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    }, 500);
  };

  return (
    <>
      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed top-20 right-6 z-[10000] w-[420px] h-[600px] flex flex-col">
          <EcoviraCard variant="glass" className="flex-1 flex flex-col p-0 shadow-[0_20px_60px_rgba(0,0,0,0.55)] overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-[rgba(28,140,130,0.22)] flex items-center justify-between bg-[rgba(21,24,29,0.95)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[rgba(28,140,130,0.3)] to-[rgba(28,140,130,0.2)] flex items-center justify-center">
                  <Bot size={20} className="text-ec-teal" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-ec-text">24/7 AI Assistant</h3>
                  <p className="text-xs text-ec-muted">Always here to help</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (onClose) {
                    onClose();
                  } else {
                    setInternalIsOpen(false);
                  }
                }}
                className="w-8 h-8 flex items-center justify-center text-ec-muted hover:text-ec-text hover:bg-[rgba(28,140,130,0.15)] rounded-ec-sm transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[rgba(15,17,20,0.4)]">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex",
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-ec-md p-3 text-sm",
                      msg.role === 'user'
                        ? "bg-[rgba(28,140,130,0.25)] text-ec-text"
                        : "bg-[rgba(15,17,20,0.6)] text-ec-text border border-[rgba(28,140,130,0.15)]"
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Chips */}
            {messages.length <= 2 && (
              <div className="px-4 pb-2 border-t border-[rgba(28,140,130,0.15)] bg-[rgba(15,17,20,0.4)]">
                <div className="flex flex-wrap gap-2 pt-3">
                  {QUICK_CHIPS.map((chip, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(chip.query)}
                      className="px-3 py-1.5 text-xs bg-[rgba(28,140,130,0.15)] hover:bg-[rgba(28,140,130,0.25)] border border-[rgba(28,140,130,0.3)] rounded-full text-ec-text transition-colors"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-[rgba(28,140,130,0.22)] bg-[rgba(21,24,29,0.95)]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me anything..."
                  className="flex-1 h-11 px-4 bg-[rgba(15,17,20,0.55)] border border-[rgba(28,140,130,0.22)] rounded-ec-md text-ec-text text-sm placeholder-[rgba(237,237,237,0.45)] focus:outline-none focus:border-[rgba(28,140,130,0.55)] focus:shadow-[0_0_0_4px_rgba(28,140,130,0.18)]"
                />
                <button
                  onClick={() => handleSend()}
                  className="w-11 h-11 bg-gradient-to-br from-[rgba(28,140,130,0.8)] to-[rgba(28,140,130,0.6)] border border-[rgba(200,162,77,0.3)] rounded-ec-md text-ec-text flex items-center justify-center hover:shadow-[0_0_12px_rgba(28,140,130,0.4)] transition-all"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </EcoviraCard>
        </div>
      )}

    </>
  );
}

