'use server';

/**
 * @fileOverview Server-side actions for handling SMS OTP generation and verification.
 * This file handles the secure logic of creating codes and calling SMS providers.
 */

import { initializeFirebase } from '@/firebase';
import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

// In a real app, you'd store these in .env
const SMS_API_KEY = process.env.SMS_PROVIDER_API_KEY || 'YOUR_API_KEY';
const SMS_PROVIDER_URL = 'https://www.fast2sms.com/dev/bulkV2'; // Example for Fast2SMS

/**
 * Sends a 4-digit OTP to the provided phone number.
 */
export async function sendSMSOTP(phoneNumber: string) {
  const { db } = initializeFirebase();
  
  // 1. Generate a random 4-digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes from now

  try {
    // 2. Store the OTP in Firestore for verification
    // We use a dedicated collection 'otp_codes' keyed by phone number
    const otpRef = doc(db, 'otp_codes', phoneNumber);
    await setDoc(otpRef, {
      otp,
      expiresAt,
      createdAt: serverTimestamp(),
    });

    // 3. Call the SMS Provider API
    // This is a placeholder for your actual provider call (e.g., Fast2SMS, MSG91, Twilio)
    console.log(`[SMS Provider] Sending OTP ${otp} to +91${phoneNumber}`);
    
    /* 
    // Example implementation for Fast2SMS:
    const response = await fetch(SMS_PROVIDER_URL, {
      method: 'POST',
      headers: {
        'authorization': SMS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "variables_values": otp,
        "route": "otp",
        "numbers": phoneNumber,
      })
    });
    const result = await response.json();
    if (!result.return) throw new Error(result.message);
    */

    return { success: true, message: 'OTP sent successfully' };
  } catch (error: any) {
    console.error('Failed to send OTP:', error);
    return { success: false, message: error.message || 'Failed to send OTP' };
  }
}

/**
 * Verifies the 4-digit OTP for the provided phone number.
 */
export async function verifySMSOTP(phoneNumber: string, enteredOtp: string) {
  const { db } = initializeFirebase();
  const otpRef = doc(db, 'otp_codes', phoneNumber);

  try {
    const otpSnap = await getDoc(otpRef);

    if (!otpSnap.exists()) {
      return { success: false, message: 'OTP expired or not requested' };
    }

    const { otp, expiresAt } = otpSnap.data();

    // Check if expired
    if (Date.now() > expiresAt) {
      await deleteDoc(otpRef);
      return { success: false, message: 'OTP has expired' };
    }

    // Check if matches
    if (otp !== enteredOtp) {
      return { success: false, message: 'Invalid OTP code' };
    }

    // Success! Delete the used OTP
    await deleteDoc(otpRef);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to verify OTP:', error);
    return { success: false, message: 'Verification failed' };
  }
}
