
// Seamless App Support, PWA Install & 1-Click Native Notification Prompt
let deferredPrompt;

const firebaseConfig = {
  apiKey: "AIzaSyBRQU2V576OXBWKq8nHUJMiW0YUsWBgaW4",
  authDomain: "yuvraj-properties.firebaseapp.com",
  projectId: "yuvraj-properties",
  storageBucket: "yuvraj-properties.firebasestorage.app",
  messagingSenderId: "591264229381",
  appId: "1:591264229381:web:3b07a4fdb355c22816d46c"
};

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    setTimeout(() => {
        showAppInstallBanner();
    }, 2500);
});

window.addEventListener('DOMContentLoaded', () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/firebase-messaging-sw.js').catch(() => {});
    }

    // Auto-sync token if already granted, otherwise ensure bell trigger is present
    if ('Notification' in window && Notification.permission === 'granted') {
        syncFCMTokenSilently();
    } else {
        createNotificationBellTrigger();
    }
});

function createNotificationBellTrigger() {
    if (document.getElementById('notifBellBtn')) return;
    if ('Notification' in window && Notification.permission === 'granted') return;

    const bell = document.createElement('div');
    bell.id = 'notifBellBtn';
    bell.innerHTML = '🔔';
    bell.title = 'Enable Property Notifications';

    // Clean, static high-visibility styling without overlay-triggering transforms
    bell.style.cssText = `
        position: fixed;
        bottom: 145px;
        right: 18px;
        width: 48px;
        height: 48px;
        background: #0f172a;
        border: 2px solid #c5a059;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        cursor: pointer;
        z-index: 1000;
        box-shadow: 0 4px 16px rgba(0,0,0,0.6);
        transition: transform 0.15s ease;
        user-select: none;
    `;

    bell.onmouseenter = () => bell.style.transform = 'scale(1.08)';
    bell.onmouseleave = () => bell.style.transform = 'scale(1)';

    // Direct clean 1-click user gesture
    bell.onclick = (e) => {
        e.stopPropagation();
        requestNativeNotificationPermission();
    };

    document.body.appendChild(bell);
}

async function syncFCMTokenSilently() {
    try {
        const { initializeApp, getApps, getApp } = await import("https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js");
        const { getMessaging, getToken } = await import("https://www.gstatic.com/firebasejs/9.17.1/firebase-messaging.js");
        const { getFirestore, doc, setDoc } = await import("https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js");

        const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
        const db = getFirestore(app);
        const messaging = getMessaging(app);

        const registration = await navigator.serviceWorker.ready;
        const currentToken = await getToken(messaging, {
            vapidKey: "BEPGAyC_7JG0wEnBZXqdQv9PdIlwhFct3Ia5e-ifYKNyXcXajyq2Ju8eLd9OgQEKG3UDd8J0vRnNBOecisdjtjA",
            serviceWorkerRegistration: registration
        });

        if (currentToken) {
            await setDoc(doc(db, "fcm_tokens", currentToken), {
                token: currentToken,
                lastSeen: new Date(),
                userAgent: navigator.userAgent
            }, { merge: true });
        }
    } catch (err) {
        console.error("Token sync error:", err);
    }
}

async function requestNativeNotificationPermission() {
    if (!('Notification' in window)) {
        alert("Aapka browser notifications support nahi karta.");
        return;
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const bell = document.getElementById('notifBellBtn');
            if (bell) bell.remove();
            await syncFCMTokenSilently();
        } else if (permission === 'denied') {
            alert("Notification blocked hai. Upar URL bar me Lock (🔒) icon par tap karke 'Allow' karein.");
        }
    } catch (err) {
        console.error("Permission request error:", err);
    }
}

function showAppInstallBanner() {
    if (document.getElementById('pwaInstallBanner')) return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const banner = document.createElement('div');
    banner.id = 'pwaInstallBanner';
    banner.style.cssText = `
        position: fixed;
        bottom: 68px;
        left: 14px;
        right: 14px;
        background: #0f172a;
        border: 1.5px solid #c5a059;
        border-radius: 14px;
        padding: 10px 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
.        box-shadow: 0 8px 24px rgba(0,0,0,0.85);
        z-index: 900;
    `;
    
    banner.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <img src="/IMG-20260913-182256.png" style="width: 38px; height: 38px; border-radius: 50%; border: 1px solid #c5a059; object-fit: cover;">
            <div>
                <b style="color: #c5a059; font-size: 12px; display: block; text-transform: uppercase;">Yuvraj Properties App</b>
                <span style="font-size: 10px; color: #94a3b8;">Install for instant property alerts</span>
            </div>
        </div>
        <div style="display: flex; gap: 6px; align-items: center;">
            <button id="installAppBtn" style="background: #c5a059; color: #020617; border: none; font-weight: 800; font-size: 11px; padding: 7px 12px; border-radius: 8px; cursor: pointer;">Install</button>
            <button id="closeInstallBanner" style="background: none; border: none; color: #94a3b8; font-size: 16px; cursor: pointer; padding: 0 4px;">✕</button>
        </div>
    `;

    document.body.appendChild(banner);

    document.getElementById('installAppBtn').onclick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            deferredPrompt = null;
        } else {
            alert('App install karne ke liye browser menu (⋮) me "Add to Home screen" select karein.');
        }
        banner.remove();
    };

    document.getElementById('closeInstallBanner').onclick = () => {
        banner.remove();
    };
}
