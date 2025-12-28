"use client";

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import { EcoviraCard } from '../EcoviraCard';
import { cn } from '../../lib/utils';

const FAQ_RESPONSES: Record<string, string> = {
  currency: "We support multiple currencies including AUD, USD, EUR, GBP, and cryptocurrencies like USDT, USDC, BTC, and ETH. Your selected currency applies to all pricing across the platform.",
  "one-way": "One-way trips are single-leg journeys without a return flight. Round-trip includes both outbound and return flights, often offering better value.",
  "round-trip": "Round-trip flights include both your departure and return journey. This option is often more cost-effective than booking two one-way flights separately.",
  "no results": "If you're not seeing results, try: adjusting your dates, checking different airports nearby, or expanding your search criteria. Our AI concierge can help refine your search.",
  "service fee": "We charge a 4% service fee on all bookings. This covers platform maintenance, customer support, and secure payment processing. The fee is clearly displayed in the price breakdown.",
  "best option": "The 'best option' depends on your priorities: cheapest for budget, fastest for time-sensitive travel, or best value balancing price and convenience.",
};

export function AIConcierge() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: "Hello! I'm your AI Concierge. How can I help you today? I can explain currency options, trip types, help interpret results, or troubleshoot issues." }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');

    // Simple FAQ matching
    const lowerInput = userMessage.toLowerCase();
    let response = "I understand you're asking about that. Let me help you with that. For more specific assistance, please contact our concierge support team.";

    for (const [key, answer] of Object.entries(FAQ_RESPONSES)) {
      if (lowerInput.includes(key)) {
        response = answer;
        break;
      }
    }

    // Add some context-aware responses
    if (lowerInput.includes('price') || lowerInput.includes('cost')) {
      response = "Pricing includes base fare, taxes, and a 4% service fee. All prices are displayed in your selected currency. You can see the breakdown in each result card.";
    } else if (lowerInput.includes('book') || lowerInput.includes('reserve')) {
      response = "To book, click the 'Select' button on any result card. You'll be guided through the booking process with secure payment options.";
    }

    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    }, 500);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-[rgba(28,140,130,0.9)] to-[rgba(28,140,130,0.7)] border-2 border-[rgba(200,162,77,0.4)] text-ec-text shadow-[0_8px_32px_rgba(28,140,130,0.4),0_0_20px_rgba(28,140,130,0.3)] hover:shadow-[0_12px_40px_rgba(28,140,130,0.5),0_0_30px_rgba(28,140,130,0.4)] transition-all flex items-center justify-center",
          isOpen && "rotate-90"
        )}
        aria-label="Open AI Concierge"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] md:w-[420px] h-[500px] md:h-[600px] flex flex-col">
          <EcoviraCard variant="glass" className="flex-1 flex flex-col p-0 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
            {/* Header */}
            <div className="p-4 border-b border-[rgba(28,140,130,0.22)] flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[rgba(28,140,130,0.3)] to-[rgba(28,140,130,0.2)] flex items-center justify-center">
                <Bot size={20} className="text-ec-teal" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-ec-text">AI Concierge</h3>
                <p className="text-xs text-ec-muted">Here to help</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
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

            {/* Input */}
            <div className="p-4 border-t border-[rgba(28,140,130,0.22)]">
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
                  onClick={handleSend}
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

