import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import process from "node:process";

// Helper to get Razorpay credentials from environment variables securely
function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  return { keyId, keySecret };
}

// 1. Create Razorpay Split Order (transferring to Landlord account ID)
export const createRazorpayOrder = createServerFn({ method: "POST" })
  .validator(
    z.object({
      amount: z.number().positive(),
      receiptId: z.string(),
      landlordAccountId: z.string().optional(),
      unitName: z.string()
    })
  )
  .handler(async ({ data }) => {
    const { keyId, keySecret } = getRazorpayCredentials();

    if (!keyId || !keySecret) {
      console.warn("Razorpay API credentials not found in .env variables.");
      return {
        success: false,
        error: "Razorpay credentials not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env file.",
        mockOrderId: "order_mock_" + Math.random().toString(36).substring(7)
      };
    }

    try {
      const amountInPaise = Math.round(data.amount * 100);
      const authHeader = btoa(`${keyId}:${keySecret}`);

      // Build split transfer payload if landlord has linked their account
      const transfers = data.landlordAccountId
        ? [
            {
              account: data.landlordAccountId,
              amount: amountInPaise,
              currency: "INR"
            }
          ]
        : [];

      const payload: Record<string, any> = {
        amount: amountInPaise,
        currency: "INR",
        receipt: data.receiptId,
        notes: {
          unit: data.unitName
        }
      };

      if (transfers.length > 0) {
        payload.transfers = transfers;
      }

      const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${authHeader}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Razorpay Order creation failed: ${errorText}`);
      }

      const orderData = await response.json();
      return {
        success: true,
        orderId: orderData.id,
        keyId: keyId,
        amount: amountInPaise
      };
    } catch (err: any) {
      console.error("Razorpay Order API Error:", err);
      return {
        success: false,
        error: err.message || "Failed to create Razorpay Order."
      };
    }
  });

// 2. Onboard Landlord to Razorpay Route
export const createLandlordRouteAccount = createServerFn({ method: "POST" })
  .validator(
    z.object({
      email: z.string().email(),
      phone: z.string().min(10),
      name: z.string().min(3)
    })
  )
  .handler(async ({ data }) => {
    const { keyId, keySecret } = getRazorpayCredentials();

    if (!keyId || !keySecret) {
      console.warn("Razorpay API credentials not found in .env variables.");
      return {
        success: false,
        error: "Razorpay credentials not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env file.",
        mockAccountId: "acc_mock_" + Math.random().toString(36).substring(7)
      };
    }

    try {
      const authHeader = btoa(`${keyId}:${keySecret}`);

      const response = await fetch("https://api.razorpay.com/v1/beta/accounts", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${authHeader}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: data.email,
          phone: data.phone,
          legal_business_name_value: data.name,
          business_type: "individual",
          profile: {
            category: "real_estate",
            subcategory: "real_estate_agents_and_brokers"
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Razorpay Account onboarding failed: ${errorText}`);
      }

      const accountData = await response.json();
      return {
        success: true,
        accountId: accountData.id
      };
    } catch (err: any) {
      console.error("Razorpay Account API Error:", err);
      return {
        success: false,
        error: err.message || "Failed to onboard Razorpay sub-merchant."
      };
    }
  });
