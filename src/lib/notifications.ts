import { PushNotifications } from "@capacitor/push-notifications";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export async function registerPushNotifications(userId: string) {
  try {
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === "prompt") {
      permStatus = await PushNotifications.requestPermissions();
    }
    if (permStatus.receive !== "granted") {
      console.warn("Push notification permission not granted:", permStatus.receive);
      return;
    }

    PushNotifications.addListener("registration", async (token) => {
      const { error } = await supabase.from("push_tokens").upsert(
        { user_id: userId, token: token.value, platform: "android" },
        { onConflict: "user_id" },
      );
      if (error) {
        console.error("Failed to save push token", error);
        toast.error("Errore salvataggio token notifiche");
      } else {
        console.log("Push token saved successfully");
      }
    });

    PushNotifications.addListener("registrationError", (err) => {
      console.error("Push registration error", err);
      toast.error("Errore registrazione notifiche push");
    });

    PushNotifications.addListener("pushNotificationReceived", (n) => {
      console.log("Push received", n);
    });

    await PushNotifications.register();
  } catch (e) {
    console.error("Push setup error", e);
    toast.error("Impossibile inizializzare le notifiche push");
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
