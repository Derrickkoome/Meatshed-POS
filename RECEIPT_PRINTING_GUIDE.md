# Receipt Printing Guide - MeatShed POS

## Overview
The MeatShed POS now includes a comprehensive receipt printing system optimized for the **X-POS XP-80 thermal printer** (80mm width). This system handles both in-store cash transactions and online delivery orders.

---

## Features

### 1. **In-Store POS Transactions**
When a customer makes a purchase in-store:

#### Cash Payments
1. Add products to cart
2. Select customer (optional, required for credit)
3. Apply discounts if needed
4. Add delivery cost if applicable
5. Click "Complete Sale"
6. **Payment Modal appears**:
   - Enter the amount the customer paid
   - Quick amount buttons (500, 1000, 2000, 5000)
   - "Exact Amount" button for exact change
   - System automatically calculates change
   - Shows change amount in green
7. Click "Confirm & Print Receipt"
8. Receipt preview appears
9. Click "Print" to send to thermal printer
10. Hand receipt and change to customer

#### Other Payment Methods (Card, M-Pesa, Credit)
- For non-cash payments, a simplified confirmation modal appears
- No change calculation needed
- Confirm and print receipt directly

### 2. **Online Delivery Orders**
When creating an online order for delivery:

1. Fill in customer information (name, phone, address)
2. Add products to the order
3. Set delivery date
4. Add delivery cost if applicable
5. Click "Save Order"
6. **Receipt automatically prints** for attachment to products
7. Receipt includes:
   - Customer delivery information
   - Order items
   - M-Pesa payment instructions (Paybill: 247247, Account: 0722902045)
   - Special delivery instructions

---

## Printer Setup

### Connecting X-POS XP-80 Thermal Printer

#### Windows Setup
1. Connect printer via USB
2. Install X-POS XP-80 drivers (from manufacturer's website)
3. Set as default printer or select during print dialog
4. Paper size: 80mm (automatic)

#### Linux Setup
```bash
# Install CUPS if not already installed
sudo apt-get install cups

# Add printer
sudo lpadmin -p XPOS-XP80 -E -v usb://path/to/printer

# Set paper size
lpoptions -p XPOS-XP80 -o media=Custom.80x200mm
```

#### macOS Setup
1. System Preferences → Printers & Scanners
2. Click "+" to add printer
3. Select X-POS XP-80
4. Set paper size to 80mm wide

---

## Receipt Content

### POS Receipt (In-Store)
```
═══════════════════════════════════
         The MeatShed
    Where Meat Meets Mastery
        Nairobi, Kenya
    Tel: +254 707 899 178
═══════════════════════════════════

Order ID: ABC123
Date: Nov 23, 2025, 2:30 PM
Cashier: user@example.com
Payment: Cash
Amount Paid: KSh 1,500.00
Change: KSh 200.00

───────────────────────────────────
Item         Qty   Price     Total
───────────────────────────────────
Beef Steak   1.5   800.00   1,200.00
Chicken      1.0    80.00      80.00
───────────────────────────────────

Subtotal:              KSh 1,103.45
Tax (16%):               KSh 176.55
───────────────────────────────────
TOTAL:                 KSh 1,280.00
───────────────────────────────────

   Thank you for your purchase!
   Fresh quality meats delivered daily
═══════════════════════════════════
```

### Online Order Receipt
```
═══════════════════════════════════
         The MeatShed
    Where Meat Meets Mastery
        Nairobi, Kenya
    Tel: +254 707 899 178
═══════════════════════════════════

    🚚 ONLINE DELIVERY ORDER

Order ID: #xyz789
Order Date: Nov 23, 2025, 3:00 PM
Delivery Date: Nov 24, 2025

───────────────────────────────────
👤 Customer Information
───────────────────────────────────
Name: John Doe
Phone: 0712345678
Address: 123 Main St, Nairobi

───────────────────────────────────
Order Items
───────────────────────────────────
Item         Qty   Price     Total
───────────────────────────────────
Goat Ribs    2.0   600.00   1,200.00
Sausages     1.0   150.00     150.00
───────────────────────────────────
TOTAL AMOUNT:          KSh 1,350.00
───────────────────────────────────

💳 Payment Instructions (M-Pesa)
───────────────────────────────────
Paybill Number: 247247
Account Number: 0722902045

How to Pay:
1. Go to M-Pesa menu on your phone
2. Select Lipa na M-Pesa → Paybill
3. Enter Paybill Number: 247247
4. Enter Account Number: 0722902045
5. Enter Amount: KSh 1,350.00
6. Enter your M-Pesa PIN and confirm

Status: PENDING PAYMENT
⏰ Order will be processed once payment
   is confirmed

───────────────────────────────────
   Thank you for your order!
   Fresh quality meats delivered
        to your doorstep
   For inquiries: +254 707 899 178
   Keep this receipt for your records
═══════════════════════════════════
```

---

## Workflow Examples

### Example 1: Walk-in Customer Paying Cash
1. Customer selects: 1kg Beef @ KSh 800, 0.5kg Chicken @ KSh 400
2. Total: KSh 1,200.00
3. Customer gives: KSh 1,500.00
4. Cashier enters 1500 in payment modal
5. System shows: Change = KSh 300.00
6. Click confirm
7. Receipt prints automatically
8. Hand receipt and KSh 300 change to customer

### Example 2: Online Delivery Order
1. Customer calls/WhatsApp order
2. Create new order in Online Orders page
3. Fill customer details (Jane Doe, 0798765432, Westlands)
4. Add items (2kg Goat @ KSh 1,200)
5. Set delivery date (Tomorrow)
6. Add delivery cost (KSh 100)
7. Click "Save Order"
8. Receipt auto-prints with M-Pesa instructions
9. Attach receipt to package
10. Hand to rider for delivery

---

## Troubleshooting

### Receipt Not Printing
1. **Check printer connection**: USB cable properly connected
2. **Check printer status**: Power on, paper loaded
3. **Check browser print settings**: Ensure printer is selected
4. **Try manual print**: Click print button again
5. **Check paper**: Ensure 80mm thermal paper is loaded correctly

### Receipt Formatting Issues
- **Text cut off**: Check paper width setting (should be 80mm)
- **Faint printing**: Check thermal paper quality and printer heat settings
- **Missing content**: Ensure browser print preview shows all content

### Browser Print Dialog Not Appearing
1. Check browser permissions for printing
2. Disable pop-up blockers for the app
3. Try different browser (Chrome recommended)
4. Clear browser cache and reload

---

## Best Practices

1. **Always preview** before printing
2. **Keep thermal paper dry** and away from heat
3. **Test print** at start of day
4. **Keep extra thermal rolls** in stock
5. **For online orders**, print immediately after order creation
6. **For in-store**, verify cash amount before confirming
7. **Keep receipts** for record-keeping and accounting

---

## Technical Details

### Print Specifications
- **Paper Width**: 80mm
- **Font**: Courier New (monospace for alignment)
- **Font Size**: 11px (body), 18px (headers)
- **Page Size**: 80mm width × auto height
- **Margins**: 3mm all around
- **Color**: Black text on white background (thermal)

### Browser Compatibility
- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari
- ⚠️ Mobile browsers (limited print support)

---

## Support

For technical issues:
- Check printer manual
- Verify USB connection
- Ensure correct paper size
- Contact X-POS support for hardware issues

For app issues:
- Check browser console for errors
- Verify internet connection
- Clear cache and reload
- Contact system administrator
