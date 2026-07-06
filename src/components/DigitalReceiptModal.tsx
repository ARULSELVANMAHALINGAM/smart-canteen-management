import React, { useRef, useState } from "react";
import { X, Printer, Receipt, Copy, Check, Sparkles, CheckCircle2, Download } from "lucide-react";
import { Order } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { jsPDF } from "jspdf";

interface DigitalReceiptModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  currency?: string;
}

export default function DigitalReceiptModal({
  order,
  isOpen,
  onClose,
  currency = "$"
}: DigitalReceiptModalProps) {
  const [copied, setCopied] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order) return null;

  // Calculations
  const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxRate = 0.08; // 8% Sales Tax
  const taxAmount = subtotal * taxRate;
  const serviceFee = 1.50; // standard platform fee
  
  // Format Date
  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short"
      });
    } catch (e) {
      return "N/A";
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Define a standard ASCII currency for the PDF, as special characters (like ₹) break standard PDF font layout metrics
    const pdfCurrency = currency === "₹" ? "Rs. " : currency;

    // Calculate total height needed based on items to fit standard thermal roll layout nicely
    const baseHeight = 115;
    const itemHeight = 9; // spacing per item details block
    const calculatedHeight = baseHeight + (order.items.length * itemHeight);
    const pdfHeight = Math.max(150, calculatedHeight);

    // Create a 80mm thermal receipt width PDF
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [80, pdfHeight]
    });

    doc.setProperties({
      title: `Smart Canteen Receipt - #${order.token}`,
      subject: "Receipt PDF",
      author: "Smart Canteen"
    });

    // Use built-in monospace courier font for authentic thermal receipt style
    doc.setFont("courier", "bold");
    
    // Header
    doc.setFontSize(13);
    doc.text("SMART CANTEEN", 40, 12, { align: "center" });
    
    doc.setFont("courier", "normal");
    doc.setFontSize(7.5);
    doc.text("Campus Smart Pre-order Hub", 40, 16.5, { align: "center" });
    doc.text("Autonomous Canteen Systems Inc.", 40, 20.5, { align: "center" });

    doc.text("========================================", 40, 25, { align: "center" });

    // Pickup Token section
    doc.setFont("courier", "bold");
    doc.setFontSize(9.5);
    doc.text("PICKUP TOKEN", 40, 30, { align: "center" });
    doc.setFontSize(22);
    doc.text(`#${order.token}`, 40, 39, { align: "center" });
    
    doc.setFont("courier", "normal");
    doc.setFontSize(7.5);
    doc.text("Scan Token at Window to Pick Up", 40, 44, { align: "center" });
    doc.text("----------------------------------------", 40, 48, { align: "center" });

    // Order Meta block
    let y = 53;
    doc.setFontSize(7);
    
    doc.text(`Order ID:     ${order.id}`, 8, y); y += 3.5;
    doc.text(`Date:         ${formatDate(order.createdAt)}`, 8, y); y += 3.5;
    doc.text(`Customer:     ${order.userName}`, 8, y); y += 3.5;
    doc.text(`Est. Pickup:  ${order.pickupTime || "ASAP"}`, 8, y); y += 3.5;
    
    doc.setFont("courier", "bold");
    doc.text(`Status:       ${order.status.toUpperCase()}`, 8, y); y += 3.5;

    doc.setFont("courier", "normal");
    y += 1;
    doc.text("----------------------------------------", 40, y, { align: "center" }); y += 4;

    // Ordered Items list
    doc.setFont("courier", "bold");
    doc.setFontSize(8);
    doc.text("ORDERED ITEMS", 8, y); y += 4.5;

    doc.setFontSize(7.5);
    order.items.forEach((item) => {
      const name = item.name.length > 21 ? item.name.substring(0, 21) + ".." : item.name;
      const qtyText = `${item.quantity}x`;
      const priceText = `${pdfCurrency}${(item.price * item.quantity).toFixed(2)}`;
      
      doc.setFont("courier", "bold");
      doc.text(`${qtyText} ${name}`, 8, y);
      doc.text(priceText, 72, y, { align: "right" });
      y += 3.5;

      doc.setFont("courier", "normal");
      doc.setFontSize(6.5);
      doc.text(`   (${item.quantity} x ${pdfCurrency}${item.price.toFixed(2)})`, 8, y);
      doc.setFontSize(7.5);
      y += 4.5;
    });

    y -= 1;
    doc.text("----------------------------------------", 40, y, { align: "center" }); y += 4;

    // Totals list
    doc.text("Subtotal:", 8, y);
    doc.text(`${pdfCurrency}${subtotal.toFixed(2)}`, 72, y, { align: "right" });
    y += 3.5;

    doc.text("Sales Tax (8.0%):", 8, y);
    doc.text(`${pdfCurrency}${taxAmount.toFixed(2)}`, 72, y, { align: "right" });
    y += 3.5;

    doc.text("Platform Fee:", 8, y);
    doc.text(`${pdfCurrency}${serviceFee.toFixed(2)}`, 72, y, { align: "right" });
    y += 3.5;

    doc.text("----------------------------------------", 40, y, { align: "center" }); y += 4;

    // Total Paid
    doc.setFont("courier", "bold");
    doc.setFontSize(8.5);
    doc.text("TOTAL PAID:", 8, y);
    doc.text(`${pdfCurrency}${order.totalAmount.toFixed(2)}`, 72, y, { align: "right" });
    y += 6;

    // Footer section
    doc.setFont("courier", "normal");
    doc.setFontSize(7);
    doc.text("========================================", 40, y, { align: "center" }); y += 3.5;
    doc.text("Thank you for choosing Smart Canteen!", 40, y, { align: "center" }); y += 3.5;
    doc.text("Skip the queues. Fast & Fresh Pre-orders.", 40, y, { align: "center" }); y += 3.5;
    doc.text(`© ${new Date().getFullYear()} Autonomous Canteen Systems Inc.`, 40, y, { align: "center" });

    // Download/Save triggers PDF
    doc.save(`smart-canteen-receipt-${order.id}.pdf`);
  };

  const handleCopyText = () => {
    const text = `
========================================
             SMART CANTEEN
       Campus Smart Pre-order Hub
========================================
PICKUP TOKEN: ${order.token}
Order ID:     ${order.id}
Date:         ${formatDate(order.createdAt)}
Customer:     ${order.userName}
Est. Pickup:  ${order.pickupTime || "ASAP"}
Status:       ${order.status.toUpperCase()}
----------------------------------------
ITEMS BREAKDOWN:
${order.items.map(item => `- ${item.quantity}x ${item.name} (${currency}${item.price.toFixed(2)} ea) - ${currency}${(item.price * item.quantity).toFixed(2)}`).join("\n")}
----------------------------------------
Subtotal:     ${currency}${subtotal.toFixed(2)}
Sales Tax (8.0%): ${currency}${taxAmount.toFixed(2)}
Platform Fee: ${currency}${serviceFee.toFixed(2)}
TOTAL PAID:   ${currency}${order.totalAmount.toFixed(2)}
========================================
Scan Token ${order.token} at the window!
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />
        
        {/* Modal Container */}
        <motion.div 
          initial={{ scale: 0.95, y: 15, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 15, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="relative w-full max-w-lg bg-[#080910] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] z-10"
        >
          {/* Top glow ambient */}
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-amber-500/5 blur-[40px] pointer-events-none" />
          
          {/* Header bar */}
          <div className="flex items-center justify-between p-6 border-b border-white/5 relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl flex items-center justify-center">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display font-black text-white text-base">Digital Receipt Ticket</h3>
                <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">REF: {order.id}</span>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </motion.button>
          </div>

          {/* Modal Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative z-10">
            
            {/* Dynamic CSS styles injected dynamically when receipt is open, formatting print area beautifully for thermal printer rolls */}
            <style>{`
              @media print {
                /* Hide everything except print card */
                html, body, #root, [data-framer-portal-container], .fixed, .absolute, main, nav, header {
                  background: white !important;
                  color: black !important;
                  visibility: hidden !important;
                }
                
                body * {
                  visibility: hidden !important;
                }
                
                /* Pin and maximize our beautiful receipt block */
                .receipt-print-area, .receipt-print-area * {
                  visibility: visible !important;
                }
                
                .receipt-print-area {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 80mm !important;
                  max-width: 80mm !important;
                  margin: 0 !important;
                  padding: 8px !important;
                  background: white !important;
                  color: black !important;
                  font-family: monospace !important;
                  font-size: 11px !important;
                  box-shadow: none !important;
                  border: none !important;
                  border-radius: 0 !important;
                  display: block !important;
                  z-index: 9999999 !important;
                }

                .receipt-print-area .absolute,
                .receipt-print-area .bg-gradient-to-r {
                  display: none !important;
                }

                @page {
                  size: 80mm auto;
                  margin: 0;
                }
              }
            `}</style>

            {/* Main Paper Receipt Visual Card */}
            <div 
              ref={printAreaRef}
              className="receipt-print-area bg-white text-gray-950 rounded-2xl p-6 md:p-8 font-mono text-[11px] shadow-2xl relative overflow-hidden"
            >
              {/* Top wavy perforated paper aesthetic banner */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />
              
              <div className="text-center space-y-1.5 pb-4 border-b border-gray-200">
                <span className="font-sans font-black text-lg tracking-tight uppercase block text-gray-900">
                  SMART<span className="text-amber-600">CANTEEN</span>
                </span>
                <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Campus Smart Pre-order Hub</p>
                <div className="bg-gray-50 py-4 px-2 rounded-2xl my-4 border border-gray-100">
                  <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold block">Your Pickup Token</span>
                  <span className="text-5xl font-black block tracking-tighter text-amber-600 font-mono my-1">#{order.token}</span>
                  <span className="text-[8px] text-gray-500 uppercase block font-extrabold tracking-widest">Ready for Pick up Scan</span>
                </div>
              </div>

              {/* General Info */}
              <div className="py-4 border-b border-gray-100 space-y-1.5 text-gray-600">
                <div className="flex justify-between">
                  <span>Order Reference:</span>
                  <span className="font-bold text-gray-900">{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date & Time:</span>
                  <span>{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer User:</span>
                  <span className="font-bold text-gray-900">{order.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Est. Pickup:</span>
                  <span className="font-bold text-gray-900">{order.pickupTime || "ASAP"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-800 uppercase tracking-wider">
                    {order.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              {/* Items table */}
              <div className="py-4 border-b border-gray-100 space-y-3">
                <span className="font-bold text-gray-900 block text-[10px] uppercase tracking-widest">Ordered Items</span>
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="space-y-1">
                      <div className="flex justify-between font-bold text-gray-900">
                        <span className="flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 border flex items-center justify-center p-[1px] rounded shrink-0 ${item.veg !== false ? "border-green-600 bg-green-50" : "border-amber-800 bg-amber-50"}`} title={item.veg !== false ? "Vegetarian" : "Non-Vegetarian"}>
                            <span className={`w-1 h-1 rounded-full ${item.veg !== false ? "bg-green-600" : "bg-amber-700"}`} />
                          </span>
                          <span>{item.name}</span>
                        </span>
                        <span>{currency}{(item.price * item.quantity).toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-500">
                        <span>{item.quantity} x {currency}{item.price.toFixed(0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

               {/* Price Calculations */}
              <div className="pt-4 space-y-1.5 text-gray-600">
                <div className="flex justify-between">
                  <span>Items Subtotal:</span>
                  <span>{currency}{subtotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>State Tax (8%):</span>
                  <span>{currency}{taxAmount.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Canteen Platform Fee:</span>
                  <span>{currency}{serviceFee.toFixed(0)}</span>
                </div>
                
                <div className="border-t border-dashed border-gray-300 pt-3 flex justify-between font-black text-gray-950 text-sm">
                  <span>TOTAL AMOUNT PAID:</span>
                  <span className="text-amber-700 font-bold">{currency}{order.totalAmount.toFixed(0)}</span>
                </div>
              </div>

              {/* Footer paper aesthetic */}
              <div className="mt-6 pt-5 border-t border-dashed border-gray-200 text-center space-y-1 text-[9px] text-gray-400">
                <p className="font-bold text-gray-700">Verified Pre-Order Transaction</p>
                <p>Skip the canteen registers. Fast Food Pickups.</p>
                <p className="pt-1 font-mono">------------------------------</p>
                <p className="font-semibold text-gray-400">© Smart Canteen Inc. {new Date().getFullYear()}</p>
              </div>

            </div>

            {/* Action guidance info */}
            <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-amber-400">Digital Token Preserved</h4>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  This receipt is fully synchronized and logged in your history. Present your pickup token or QR code at the service counter to clear your food!
                </p>
              </div>
            </div>

          </div>

          {/* Modal Action Buttons Footer */}
          <div className="p-6 border-t border-white/5 bg-[#06070a] flex flex-col sm:flex-row gap-3 relative z-10">
            
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePrint}
              className="flex-1 h-11 bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/15"
            >
              <Printer className="h-4 w-4" /> Print Receipt
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDownload}
              className="flex-1 h-11 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Download className="h-4 w-4" /> Download Receipt
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCopyText}
              className="px-4.5 h-11 bg-white/3 hover:bg-white/5 border border-white/5 text-gray-300 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              title="Copy receipt content to clipboard"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400 animate-bounce" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" /> Copy Info
                </>
              )}
            </motion.button>

          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
