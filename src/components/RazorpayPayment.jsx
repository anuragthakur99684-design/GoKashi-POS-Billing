import React from "react";
import { loadRazorpayScript } from "../utils/loadRazorpay";

const RazorpayPayment = ({ amount = 500, customerName = "Anurag Singh" }) => {
  const handlePayment = async () => {
    const isLoaded = await loadRazorpayScript();

    if (!isLoaded) {
      alert("Razorpay SDK load nahi ho paya. Internet connection check karein.");
      return;
    }

    // Standard Options Configuration
    const options = {
      key: "YOUR_RAZORPAY_KEY_ID", // Apna Razorpay Key ID yahan daalein
      amount: amount * 100, // Amount paise me hota hai (e.g., 500 INR = 50000 paise)
      currency: "INR",
      name: "Retail SaaS Platform",
      description: "Order Payment",
      // order_id: "order_xxxxxx", // Backend/Firebase se create hua Order ID yahan pass karein

      handler: function (response) {
        // Success Callback
        alert(`Payment Successful! Payment ID: ${response.razorpay_payment_id}`);
        console.log("Payment Details:", response);
        // Is response ko apne backend pe verify karne ke liye bhejein
      },
      prefill: {
        name: customerName,
        email: "user@example.com",
        contact: "9876543210",
      },
      theme: {
        color: "#6366f1", // Custom UI theme color
      },
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  };

  return (
    <button
      onClick={handlePayment}
      style={{
        padding: "12px 24px",
        backgroundColor: "#6366f1",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "bold",
      }}
    >
      Pay ₹{amount} Now
    </button>
  );
};

export default RazorpayPayment;