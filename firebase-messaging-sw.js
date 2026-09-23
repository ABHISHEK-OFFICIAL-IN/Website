importScripts('https://www.gstatic.com/firebasejs/9.17.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.17.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBRQU2V576OXBWKq8nHUJMiW0YUsWBgaW4",
  projectId: "yuvraj-properties",
  messagingSenderId: "591264229381",
  appId: "1:591264229381:web:3b07a4fdb355c22816d46c"
});

const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  // Agar Firebase Console notification payload pehle se bhej raha hai, 
  // toh SDK use auto-display kar deta hai. Is check se phone par 2 baar duplicate alert nahi aayega.
  if (payload.notification) {
    return;
  }

  const notificationTitle = payload.data?.title || "Yuvraj Properties";
  const targetUrl = payload.data?.url || payload.data?.link || "https://yuvrajproperties.netlify.app/";

  const notificationOptions = {
    body: payload.data?.body || "Nayi property live ho gayi hai!",
    icon: 'https://i.postimg.cc/LXNj4VSd/IMG-20260913-182256.png',
    badge: 'https://i.postimg.cc/LXNj4VSd/IMG-20260913-182256.png',
    data: { url: targetUrl }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification click par website ya specific property open karne ka handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Firebase Console aur Custom payload dono ke link format ko safely read karta hai
  const targetUrl = event.notification.data?.url || 
                    event.notification.data?.link || 
                    event.notification.data?.FCM_MSG?.notification?.click_action || 
                    "https://yuvrajproperties.netlify.app/";

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
