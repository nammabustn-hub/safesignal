
import { auth, db, googleProvider } from "./firebase-config.js";

import {
  signInWithPopup,
  signInAnonymously,
  linkWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

/* ==================================
   SAFESIGNAL MAIN APPLICATION
================================== */

let currentUser = null;
let editingContactId = null;
let currentLanguage = "en";

const MAX_CONTACTS = 3;

const $ = id => document.getElementById(id);

/* ==================================
   LANGUAGE TRANSLATIONS
================================== */

const translations = {
  en: {
    homeLink: "Home",
    privacyLink: "Privacy",
    termsLink: "Terms and Conditions",
    aboutLink: "About Us",
    contactLink: "Contact Us",
    tagline: "PERSONAL SAFETY COMPANION",
    heroTitle: 'One Tap.<br><span class="gradient">Someone Knows.</span>',
    heroDesc: "Keep your trusted people close. Prepare your emergency contacts before you need them.",
    sosCaption: "Tap to view the emergency demo. This button does not send a real alert.",
    notice: "⚠️ SafeSignal is currently a website demo. It does not send emergency SMS, calls, alarms or live location. In a real emergency in India, call 112 directly.",
    accountTitle: "Your SafeSignal Account",
    accountDesc: "Sign in to save your trusted emergency contacts securely.",
    welcome: "Welcome to SafeSignal",
    loginDesc: "Choose Google login or continue as a guest.",
    loggedInAs: "Logged in as",
    logout: "Logout",
    accountInfo: "Your contacts are saved to your SafeSignal account.",
    upgrade: "Link Google account",
    floatingTitle: "Floating SOS Button",
    floatingDesc: "Enable this option to show the SOS shortcut on your screen.",
    floatingLabel: "Show side SOS button",
    contactsTitle: "Trusted Contacts",
    contactsDesc: "Add up to 3 people you trust.",
    loginRequired: "Please login to manage your contacts.",
    savedContacts: "Your saved contacts",
    addContact: "Add contact",
    contactPrivacy: "Only your signed-in account can manage these contacts. Add contacts only with their consent.",
    featuresTitle: "Designed for preparedness",
    featuresDesc: "Simple tools to help you prepare before an emergency.",
    feature1Title: "Trusted Contacts",
    feature1Desc: "Keep up to three trusted people saved in your account.",
    feature2Title: "Location-ready concept",
    feature2Desc: "Live location sharing is planned for a future release.",
    feature3Title: "Quick access",
    feature3Desc: "A simple interface designed to make important actions easy to find.",
    aboutTitle: "About SafeSignal",
    aboutDesc: "SafeSignal is a personal safety preparedness project. The current website is an early version and does not provide a real emergency dispatch service.",
    privacyTitle: "Privacy",
    privacyDesc: "Your contact details are stored in Firebase Firestore under your account. Do not add information without consent. You can delete saved contacts from this page.",
    termsTitle: "Terms and Conditions",
    termsDesc: "SafeSignal is an early-stage preparedness demo. It is not a replacement for emergency services or official authorities. In India, call 112 directly in an emergency.",
    contactTitle: "Contact Us",
    contactDesc: "Have a question or suggestion? Send us a message.",
    contactHeading: "Get in touch with SafeSignal",
    contactInfo: "We welcome your feedback and suggestions.",
    sendMessage: "Send Message",
    footerLine: "One Tap. Someone Knows.",
    footerNote: "Demo version. Not an emergency response service.",
    editTitle: "Edit contact",
    save: "Save",
    cancel: "Cancel"
  },

  ta: {
    homeLink: "முகப்பு",
    privacyLink: "தனியுரிமை",
    termsLink: "விதிமுறைகள்",
    aboutLink: "எங்களை பற்றி",
    contactLink: "தொடர்பு",
    tagline: "தனிப்பட்ட பாதுகாப்பு உதவியாளர்",
    heroTitle: 'ஒரு தொடுதல்.<br><span class="gradient">யாரோ அறிந்துகொள்வார்கள்.</span>',
    heroDesc: "உங்களுக்கு நம்பிக்கையானவர்களை அருகில் வைத்திருங்கள். அவசர நேரத்திற்கு முன்பே தொடர்புகளை தயார் செய்யுங்கள்.",
    sosCaption: "அவசரநிலை டெமோவை பார்க்க அழுத்தவும். உண்மையான எச்சரிக்கை அனுப்பப்படாது.",
    notice: "⚠️ SafeSignal தற்போது இணையதள டெமோ மட்டுமே. உண்மையான அவசரநிலையில் இந்தியாவில் 112 என்ற எண்ணை அழைக்கவும்.",
    accountTitle: "உங்கள் SafeSignal கணக்கு",
    accountDesc: "உங்கள் நம்பகமான அவசர தொடர்புகளை சேமிக்க உள்நுழையுங்கள்.",
    welcome: "SafeSignal-க்கு வரவேற்கிறோம்",
    loginDesc: "Google மூலம் உள்நுழையவும் அல்லது Guest ஆக தொடரவும்.",
    loggedInAs: "உள்நுழைந்த கணக்கு",
    logout: "வெளியேறு",
    accountInfo: "உங்கள் தொடர்புகள் SafeSignal கணக்கில் சேமிக்கப்படும்.",
    upgrade: "Google கணக்கை இணைக்கவும்",
    floatingTitle: "மிதக்கும் SOS பட்டன்",
    floatingDesc: "உங்கள் திரையில் SOS குறுக்குவழியைக் காட்ட இதை இயக்கவும்.",
    floatingLabel: "பக்க SOS பட்டனைக் காட்டு",
    contactsTitle: "நம்பகமான தொடர்புகள்",
    contactsDesc: "நீங்கள் நம்பும் அதிகபட்சம் 3 பேரை சேர்க்கலாம்.",
    loginRequired: "தொடர்புகளை நிர்வகிக்க முதலில் உள்நுழையுங்கள்.",
    savedContacts: "சேமிக்கப்பட்ட தொடர்புகள்",
    addContact: "தொடர்பை சேர்க்கவும்",
    contactPrivacy: "உங்கள் கணக்கில் மட்டுமே இந்த தொடர்புகளை நிர்வகிக்க முடியும். அனுமதியுடன் மட்டுமே தொடர்புகளை சேர்க்கவும்.",
    featuresTitle: "முன்னேற்பாட்டிற்காக உருவாக்கப்பட்டது",
    featuresDesc: "அவசரநிலைக்கு முன்பே தயாராக இருக்க உதவும் எளிய வசதிகள்.",
    feature1Title: "நம்பகமான தொடர்புகள்",
    feature1Desc: "அதிகபட்சம் மூன்று நம்பகமான நபர்களை சேமிக்கலாம்.",
    feature2Title: "இருப்பிட வசதி",
    feature2Desc: "நேரடி இருப்பிடப் பகிர்வு எதிர்காலத்தில் அறிமுகப்படுத்தப்படும்.",
    feature3Title: "விரைவான அணுகல்",
    feature3Desc: "முக்கியமான வசதிகளை எளிதில் கண்டுபிடிக்க உதவும் வடிவமைப்பு.",
    aboutTitle: "SafeSignal பற்றி",
    aboutDesc: "SafeSignal ஒரு தனிப்பட்ட பாதுகாப்பு முன்னேற்பாட்டுத் திட்டம். தற்போதைய இணையதளம் ஆரம்பகட்ட டெமோ மட்டுமே.",
    privacyTitle: "தனியுரிமை",
    privacyDesc: "உங்கள் தொடர்பு விவரங்கள் Firebase Firestore-ல் உங்கள் கணக்கின் கீழ் சேமிக்கப்படும். அனுமதி இல்லாமல் தகவல்களை சேர்க்க வேண்டாம்.",
    termsTitle: "விதிமுறைகள் மற்றும் நிபந்தனைகள்",
    termsDesc: "SafeSignal ஒரு முன்னேற்பாட்டு டெமோ மட்டுமே. அவசர சேவைகளுக்கு மாற்றாகாது. இந்தியாவில் அவசரநிலையில் 112-ஐ அழைக்கவும்.",
    contactTitle: "எங்களை தொடர்பு கொள்ளுங்கள்",
    contactDesc: "கேள்வி அல்லது ஆலோசனை உள்ளதா? எங்களுக்கு செய்தி அனுப்புங்கள்.",
    contactHeading: "SafeSignal-ஐ தொடர்பு கொள்ளுங்கள்",
    contactInfo: "உங்கள் கருத்துகளையும் ஆலோசனைகளையும் வரவேற்கிறோம்.",
    sendMessage: "செய்தி அனுப்பு",
    footerLine: "ஒரு தொடுதல். யாரோ அறிந்துகொள்வார்கள்.",
    footerNote: "டெமோ பதிப்பு. அவசர சேவை அல்ல.",
    editTitle: "தொடர்பை திருத்து",
    save: "சேமி",
    cancel: "ரத்து செய்"
  }
};

/* ==================================
   TOAST MESSAGE
================================== */

function showToast(message) {
  const toast = $("toast");

  if (!toast) {
    alert(message);
    return;
  }

  toast.textContent = message;
  toast.classList.remove("hidden");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 3000);
}

/* ==================================
   LANGUAGE SWITCH
================================== */

function applyLanguage() {
  const dictionary = translations[currentLanguage];

  document.querySelectorAll("[data-i18n]").forEach(element => {
    const key = element.dataset.i18n;

    if (dictionary[key]) {
      element.innerHTML = dictionary[key];
    }
  });

  const langButton = $("langBtn");

  if (langButton) {
    langButton.textContent =
      currentLanguage === "en" ? "தமிழ்" : "English";
  }

  document.documentElement.lang = currentLanguage === "ta" ? "ta" : "en";
}

$("langBtn")?.addEventListener("click", () => {
  currentLanguage = currentLanguage === "en" ? "ta" : "en";
  applyLanguage();
});

/* ==================================
   SOS DEMO
================================== */

function runSOSDemo() {
  const message = currentLanguage === "ta"
    ? "இது SafeSignal டெமோ மட்டுமே. உண்மையான எச்சரிக்கை அனுப்பப்படவில்லை. அவசரநிலையில் இந்தியாவில் 112-ஐ அழைக்கவும்."
    : "This is only a SafeSignal demo. No real emergency alert has been sent. For emergencies in India, call 112.";

  alert(message);
}

$("mainSOS")?.addEventListener("click", runSOSDemo);
$("floatingSOS")?.addEventListener("click", runSOSDemo);

/* ==================================
   FLOATING SOS SETTING
================================== */

function updateFloatingButton() {
  const toggle = $("floatingToggle");
  const floating = $("floatingSOS");
  const status = $("floatingStatus");

  if (!toggle || !floating) return;

  floating.classList.toggle("off", !toggle.checked);

  if (status) {
    status.textContent = toggle.checked
      ? "Currently ON"
      : "Currently OFF";
  }

  localStorage.setItem(
    "safesignal-floating",
    toggle.checked ? "on" : "off"
  );
}

const floatingToggle = $("floatingToggle");

if (floatingToggle) {
  floatingToggle.checked =
    localStorage.getItem("safesignal-floating") === "on";

  updateFloatingButton();

  floatingToggle.addEventListener("change", updateFloatingButton);
}

/* ==================================
   AUTH STATUS
================================== */

function authMessage(message, error = false) {
  const status = $("authStatus");

  if (!status) return;

  status.textContent = message;
  status.style.color = error ? "#ff3155" : "#35e6a1";
}

/* ==================================
   GOOGLE LOGIN
================================== */

$("googleBtn")?.addEventListener("click", async () => {
  try {
    authMessage("Connecting to Google...");

    if (auth.currentUser?.isAnonymous) {
      await linkWithPopup(auth.currentUser, googleProvider);
    } else {
      await signInWithPopup(auth, googleProvider);
    }

    authMessage("Google login successful!");

  } catch (error) {
    console.error("Google login:", error);

    if (error.code === "auth/credential-already-in-use") {
      authMessage(
        "This Google account is already linked to another account. Please sign in with Google.",
        true
      );
    } else if (error.code === "auth/popup-closed-by-user") {
      authMessage("Login cancelled.", true);
    } else {
      authMessage(error.message, true);
    }
  }
});

/* ==================================
   GUEST LOGIN
================================== */

$("guestBtn")?.addEventListener("click", async () => {
  try {
    authMessage("Creating guest account...");

    await signInAnonymously(auth);

    authMessage("Guest login successful!");

  } catch (error) {
    console.error("Guest login:", error);
    authMessage(error.message, true);
  }
});

/* ==================================
   UPGRADE GUEST ACCOUNT
================================== */

$("upgradeBtn")?.addEventListener("click", async () => {
  try {
    if (!auth.currentUser?.isAnonymous) return;

    await linkWithPopup(auth.currentUser, googleProvider);

    showToast("Google account linked successfully!");

  } catch (error) {
    console.error("Account linking:", error);
    authMessage(error.message, true);
  }
});

/* ==================================
   LOGOUT
================================== */

$("logoutBtn")?.addEventListener("click", async () => {
  try {
    await signOut(auth);
    showToast("Logged out successfully!");
  } catch (error) {
    console.error("Logout:", error);
    showToast(error.message);
  }
});

/* ==================================
   FIRESTORE COLLECTION
================================== */

function contactsCollection() {
  if (!currentUser) {
    throw new Error("Please login first.");
  }

  return collection(
    db,
    "users",
    currentUser.uid,
    "contacts"
  );
}

/* ==================================
   AUTH STATE
================================== */

onAuthStateChanged(auth, async user => {
  currentUser = user;

  $("signedOut")?.classList.toggle("hidden", !!user);
  $("signedIn")?.classList.toggle("hidden", !user);

  $("contactsLocked")?.classList.toggle("hidden", !!user);
  $("contactsArea")?.classList.toggle("hidden", !user);

  if (user) {
    $("userEmail").textContent =
      user.email || "Guest User";

    $("upgradeBtn")?.classList.toggle(
      "hidden",
      !user.isAnonymous
    );

    authMessage(
      user.isAnonymous
        ? "You are using a guest account."
        : "Welcome back!"
    );

    await loadContacts();

  } else {
    $("userEmail").textContent = "";
    $("upgradeBtn")?.classList.add("hidden");

    clearContactList();
    resetContactForm();
  }
});

/* ==================================
   LOAD CONTACTS
================================== */

async function loadContacts() {
  if (!currentUser) return;

  const list = $("contactList");
  const count = $("contactCount");

  if (!list) return;

  list.innerHTML = '<div class="empty">Loading contacts...</div>';

  try {
    const snapshot = await getDocs(contactsCollection());

    list.innerHTML = "";

    if (count) {
      count.textContent = `${snapshot.size} / ${MAX_CONTACTS}`;
    }

    if (snapshot.empty) {
      list.innerHTML =
        '<div class="empty">No contacts added yet.</div>';
      return;
    }

    snapshot.forEach(contactDocument => {
      const data = contactDocument.data();

      const item = document.createElement("div");
      item.className = "contact-item";

      const details = document.createElement("div");

      const name = document.createElement("strong");
      name.textContent = data.name || "Unnamed contact";

      const phone = document.createElement("p");
      phone.textContent = data.phone || "";

      details.append(name, phone);

      const actions = document.createElement("div");
      actions.className = "contact-actions";

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.textContent = "Edit";

      editButton.addEventListener("click", () => {
        openEditModal(contactDocument.id, data);
      });

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.textContent = "Delete";

      deleteButton.addEventListener("click", () => {
        removeContact(contactDocument.id);
      });

      actions.append(editButton, deleteButton);
      item.append(details, actions);

      list.appendChild(item);
    });

  } catch (error) {
    console.error("Load contacts:", error);

    list.innerHTML =
      '<div class="empty">Unable to load contacts. Check Firebase rules.</div>';
  }
}

/* ==================================
   CONTACT FORM
================================== */

$("contactForm")?.addEventListener("submit", async event => {
  event.preventDefault();

  if (!currentUser) {
    showToast("Please login first.");
    return;
  }

  const name = $("contactName").value.trim();
  const phone = $("contactPhone").value.trim();
  const saveButton = $("saveContactBtn");
  const status = $("contactStatus");

  if (!name || !phone) {
    status.textContent = "Please enter name and phone number.";
    return;
  }

  if (!/^\+?[0-9\s()-]{7,20}$/.test(phone)) {
    status.textContent = "Please enter a valid phone number.";
    return;
  }

  try {
    saveButton.disabled = true;
    status.textContent = "Saving contact...";

    if (editingContactId) {
      const contactReference = doc(
        db,
        "users",
        currentUser.uid,
        "contacts",
        editingContactId
      );

      await updateDoc(contactReference, {
        name,
        phone,
        updatedAt: serverTimestamp()
      });

      showToast("Contact updated successfully!");

    } else {
      const existing = await getDocs(contactsCollection());

      if (existing.size >= MAX_CONTACTS) {
        status.textContent = "Maximum 3 contacts allowed.";
        return;
      }

      await addDoc(contactsCollection(), {
        name,
        phone,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      showToast("Contact saved successfully!");
    }

    resetContactForm();
    await loadContacts();

  } catch (error) {
    console.error("Save contact:", error);
    status.textContent = error.message;

  } finally {
    saveButton.disabled = false;
  }
});

/* ==================================
   EDIT CONTACT MODAL
================================== */

function openEditModal(id, data) {
  editingContactId = id;

  $("editName").value = data.name || "";
  $("editPhone").value = data.phone || "";

  $("editModal").classList.remove("hidden");
}

$("saveEditBtn")?.addEventListener("click", async () => {
  if (!currentUser || !editingContactId) return;

  const name = $("editName").value.trim();
  const phone = $("editPhone").value.trim();

  if (!name || !phone) {
    showToast("Please enter name and phone number.");
    return;
  }

  if (!/^\+?[0-9\s()-]{7,20}$/.test(phone)) {
    showToast("Please enter a valid phone number.");
    return;
  }

  try {
    await updateDoc(
      doc(
        db,
        "users",
        currentUser.uid,
        "contacts",
        editingContactId
      ),
      {
        name,
        phone,
        updatedAt: serverTimestamp()
      }
    );

    closeEditModal();
    await loadContacts();

    showToast("Contact updated successfully!");

  } catch (error) {
    console.error("Edit contact:", error);
    showToast(error.message);
  }
});

/* ==================================
   CLOSE EDIT MODAL
================================== */

function closeEditModal() {
  editingContactId = null;
  $("editModal")?.classList.add("hidden");
}

$("cancelEditBtn")?.addEventListener("click", closeEditModal);

/* ==================================
   DELETE CONTACT
================================== */

async function removeContact(id) {
  if (!currentUser) return;

  if (!confirm("Are you sure you want to delete this contact?")) {
    return;
  }

  try {
    await deleteDoc(
      doc(db, "users", currentUser.uid, "contacts", id)
    );

    showToast("Contact deleted successfully!");

    await loadContacts();

  } catch (error) {
    console.error("Delete contact:", error);
    showToast(error.message);
  }
}

/* ==================================
   RESET FORM
================================== */

function resetContactForm() {
  $("contactForm")?.reset();

  editingContactId = null;

  if ($("saveContactBtn")) {
    $("saveContactBtn").textContent = "Add contact";
  }

  if ($("contactStatus")) {
    $("contactStatus").textContent = "";
  }
}

function clearContactList() {
  if ($("contactList")) {
    $("contactList").innerHTML =
      '<div class="empty">No contacts added yet.</div>';
  }

  if ($("contactCount")) {
    $("contactCount").textContent = "0 / 3";
  }
}

/* ==================================
   INITIALIZE
================================== */

applyLanguage();

console.log("SafeSignal initialized successfully.");
