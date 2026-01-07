import { UserStats } from "../types";

export const saveUserProgress = async (scriptUrl: string, email: string, stats: UserStats) => {
  if (!scriptUrl) return false;
  try {
    // Note: Google Apps Script Web App POST requests with JSON body require 'no-cors' mode
    // in the browser, which results in an opaque response. We assume success if no network error.
    await fetch(scriptUrl, {
      method: "POST",
      body: JSON.stringify({ email, stats }),
      mode: "no-cors",
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Helps some proxies/GAS versions
      }
    });
    return true;
  } catch (error) {
    console.error("Sync Error:", error);
    return false;
  }
};

export const loadUserProgress = async (scriptUrl: string, email: string): Promise<UserStats | null> => {
  if (!scriptUrl) return null;
  try {
    // Adding a timestamp (t) prevents browser caching which causes issues with GAS
    // credentials: 'omit' is CRITICAL to avoid issues if the user is signed into multiple Google accounts
    const url = `${scriptUrl}?email=${encodeURIComponent(email)}&t=${Date.now()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'omit', 
      redirect: 'follow'
    });

    if (!response.ok) {
        // If the script returns 404/500/403, we handle it gracefully
        console.warn(`Sync Warning: Server returned ${response.status}`);
        return null;
    }

    const json = await response.json();
    if (json.result === "success") {
      return json.data;
    }
    return null;
  } catch (error) {
    // "Failed to fetch" usually happens here due to network/CORS/AdBlockers
    console.error("Load Error (Check network/deployment):", error);
    return null;
  }
};