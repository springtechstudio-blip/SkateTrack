import { PushNotifications } from "@capacitor/push-notifications";
import { supabase } from "@/integrations/supabase/client";

export async function registerPushNotifications(userId: string) {
  try {
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === "prompt") {
      permStatus = await PushNotifications.requestPermissions();
    }
    if (permStatus.receive !== "granted") return;

    await PushNotifications.register();

    PushNotifications.addListener("registration", async (token) => {
      const { error } = await supabase.from("push_tokens").upsert(
        { user_id: userId, token: token.value, platform: "android" },
        { onConflict: "user_id" },
      );
      if (error) console.error("Failed to save push token", error);
    });

    PushNotifications.addListener("registrationError", (err) => {
      console.error("Push registration error", err);
    });

    PushNotifications.addListener("pushNotificationReceived", (n) => {
      console.log("Push received", n);
    });
  } catch (e) {
    console.error("Push setup error", e);
  }
}

export async function unregisterPushNotifications(userId: string) {
  try {
    await PushNotifications.unregister();
    if (userId) {
      await supabase.from("push_tokens").delete().eq("user_id", userId);
    }
  } catch (e) {
    console.error("Push unregister error", e);
  }
}
