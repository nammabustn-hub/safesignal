
import { auth, db, googleProvider } from "./firebase-config.js";

import {
  signInAnonymously,
  signInWithPopup,
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

/* =====================================
   SAFESIGNAL - MAIN APPLICATION
===================================== */

let currentUser = null;
let editingContactId = null;
let currentLanguage = localStorage.getItem("safesignal-language") || "en";

const MAX_CONTACTS = 3;

/* =====================================
   TOAST MESSAGE
===================================== */

function showToast(message) {
  const toast = document.getElementById("toast");

  if (toast) {
    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  } else {
    alert(message);
  }
}

/* =====================================
   LANGUAGE SWITCH
===================================== */

window.setLang = function (language) {
  currentLanguage = language;
  localStorage.setItem("safesignal-language", language);

  document.documentElement.lang = language;

  document.querySelectorAll("[data-en]").forEach(element => {
    const translatedText =
      language === "ta"
        ? element.getAttribute("data-ta")
        : element.getAttribute("data-en");

    if (translatedText !== null) {
      element.innerHTML = translatedText;
    }
  });

  document.getElementById("enBtn")?.classList.toggle(
    "active",
    language === "en"
  );

  document.getElementById("taBtn")?.classList.toggle(
    "active",
    language === "ta"
  );
};

/* =====================================
   SOS DEMO
===================================== */

window.demoSOS = function () {
  const message =
    currentLanguage === "ta"
      ? "Idhu SafeSignal demo mattum. Unmaiyana emergency alert anuppappadavillai. Emergency-na India-la 112-ku call pannunga."
      : "This is only a SafeSignal demo. No emergency alert has been sent. For a real emergency in India, call 112.";

  alert(message);
};

/* =====================================
   FLOATING SOS BUTTON
===================================== */

window.toggleFloating = function () {
  const toggle = document.getElementById("floatSwitch");
  const floatingButton = document.getElementById("floatingSOS");

  if (!toggle || !floatingButton) return;

  const enabled = toggle.checked;

  floatingButton.classList.toggle("off", !enabled);

  localStorage.setItem(
    "safesignal-floating-sos",
    enabled ? "on" : "off"
  );
};

function initializeFloatingSOS() {
  const toggle = document.getElementById("floatSwitch");
  const floatingButton = document.getElementById("floatingSOS");

  if (!toggle || !floatingButton) return;

  const enabled =
    localStorage.getItem("safesignal-floating-sos") === "on";

  toggle.checked = enabled;
  floatingButton.classList.toggle("off", !enabled);

  toggle.addEventListener("change", window.toggleFloating);

  floatingButton.addEventListener("click", window.demoSOS);
}

/* =====================================
   AUTH MESSAGE
===================================== */

function setAuthMessage(message, isError = false) {
  const element = document.getElementById("authMessage");

  if (!element) return;

  element.textContent = message;
  element.style.color = isError ? "#ff3155" : "#35e6a1";
}

/* =====================================
   GUEST LOGIN
===================================== */

window.guestLogin = async function () {
  try {
    setAuthMessage("Signing in as guest...");

    await signInAnonymously(auth);

    showToast(
      currentLanguage === "ta"
        ? "Guest login success!"
        : "Guest login successful!"
    );
  } catch (error) {
    console.error("Guest login error:", error);
    setAuthMessage(error.message, true);
  }
};

/* =====================================
   GOOGLE LOGIN / GUEST UPGRADE
===================================== */

window.googleLogin = async function () {
  try {
    setAuthMessage("Connecting to Google...");

    if (auth.currentUser && auth.currentUser.isAnonymous) {
      await linkWithPopup(auth.currentUser, googleProvider);

      showToast(
        currentLanguage === "ta"
          ? "Google account connect aagiduchu!"
          : "Google account connected successfully!"
      );
    } else {
      await signInWithPopup(auth, googleProvider);

      showToast(
        currentLanguage === "ta"
          ? "Google login success!"
          : "Google login successful!"
      );
    }
  } catch (error) {
    console.error("Google login error:", error);

    if (error.code === "auth/credential-already-in-use") {
      setAuthMessage(
        "This Google account is already connected to another account. Please sign in with Google.",
        true
      );
    } else if (error.code === "auth/popup-closed-by-user") {
      setAuthMessage("Google login was cancelled.", true);
    } else {
      setAuthMessage(error.message, true);
    }
  }
};

/* =====================================
   LINK GUEST TO GOOGLE
===================================== */

window.linkGuestToGoogle = async function () {
  if (!auth.currentUser || !auth.currentUser.isAnonymous) {
    showToast("Please sign in as a guest first.");
    return;
  }

  await window.googleLogin();
};

/* =====================================
   LOGOUT
===================================== */

window.logout = async function () {
  try {
    await signOut(auth);

    showToast(
      currentLanguage === "ta"
        ? "Logout success!"
        : "Logged out successfully!"
    );
  } catch (error) {
    console.error("Logout error:", error);
    showToast(error.message);
  }
};

/* =====================================
   AUTH STATE
===================================== */

onAuthStateChanged(auth, async user => {
  currentUser = user;

  const loginPanel = document.getElementById("loginPanel");
  const dashboard = document.getElementById("dashboard");
  const userType = document.getElementById("userType");
  const userEmail = document.getElementById("userEmail");
  const userId = document.getElementById("userId");
  const guestUpgrade = document.getElementById("guestUpgrade");
  const contactsLoginNotice =
    document.getElementById("contactsLoginNotice");
  const contactsApp = document.getElementById("contactsApp");

  if (user) {
    if (loginPanel) loginPanel.hidden = true;
    if (dashboard) dashboard.hidden = false;

    if (userType) {
      userType.textContent = user.isAnonymous ? "Guest Account" : "Google Account";
    }

    if (userEmail) {
      userEmail.textContent = user.email || "Guest User";
    }

    if (userId) {
      userId.textContent = user.uid;
    }

    if (guestUpgrade) {
      guestUpgrade.hidden = !user.isAnonymous;
    }

    if (contactsLoginNotice) contactsLoginNotice.hidden = true;
    if (contactsApp) contactsApp.hidden = false;

    await loadContacts();
  } else {
    if (loginPanel) loginPanel.hidden = false;
    if (dashboard) dashboard.hidden = true;

    if (guestUpgrade) guestUpgrade.hidden = true;

    if (contactsLoginNotice) contactsLoginNotice.hidden = false;
    if (contactsApp) contactsApp.hidden = true;

    clearContactForm();
    clearContactList();
  }
});

/* =====================================
   CONTACT COLLECTION
===================================== */

function getContactsCollection() {
  if (!currentUser) {
    throw new Error("Please login first.");
  }

  return collection(db, "users", currentUser.uid, "contacts");
}

/* =====================================
   LOAD CONTACTS
===================================== */

async function loadContacts() {
  if (!currentUser) return;

  const contactList = document.getElementById("contactList");
  const contactCount = document.getElementById("contactCount");

  if (!contactList) return;

  contactList.innerHTML = "<p>Loading contacts...</p>";

  try {
    const snapshot = await getDocs(getContactsCollection());

    contactList.innerHTML = "";

    if (contactCount) {
      contactCount.textContent =
        `${snapshot.size}/${MAX_CONTACTS}`;
    }

    if (snapshot.empty) {
      contactList.innerHTML =
        "<p>No emergency contacts added yet.</p>";
      return;
    }

    snapshot.forEach(contactDocument => {
      const contact = contactDocument.data();
      const contactId = contactDocument.id;

      const item = document.createElement("div");
      item.className = "contact-item";

      const details = document.createElement("div");

      const name = document.createElement("strong");
      name.textContent = contact.name || "Unnamed Contact";

      const phone = document.createElement("p");
      phone.textContent = contact.phone || "";

      details.append(name, phone);

      const actions = document.createElement("div");
      actions.className = "contact-actions";

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.textContent = "Edit";
      editButton.addEventListener("click", () => {
        editContact(contactId, contact);
      });

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", () => {
        deleteContact(contactId);
      });

      actions.append(editButton, deleteButton);
      item.append(details, actions);
      contactList.appendChild(item);
    });

  } catch (error) {
    console.error("Load contacts error:", error);

    contactList.innerHTML =
      "<p>Unable to load contacts. Please try again.</p>";
  }
}

/* =====================================
   SAVE / UPDATE CONTACT
===================================== */

const contactForm = document.getElementById("contactForm");

if (contactForm) {
  contactForm.addEventListener("submit", async event => {
    event.preventDefault();

    if (!currentUser) {
      showToast("Please login first.");
      return;
    }

    const nameInput = document.getElementById("contactName");
    const phoneInput = document.getElementById("contactPhone");
    const consentInput = document.getElementById("contactConsent");
    const saveButton = document.getElementById("saveContactBtn");

    const name = nameInput?.value.trim();
    const phone = phoneInput?.value.trim();

    if (!name || !phone) {
      showContactMessage("Please enter name and phone number.", true);
      return;
    }

    if (!consentInput?.checked) {
      showContactMessage(
        "Please confirm that you have permission to add this contact.",
        true
      );
      return;
    }

    if (!/^\+?[0-9\s()-]{7,20}$/.test(phone)) {
      showContactMessage("Please enter a valid phone number.", true);
      return;
    }

    try {
      if (saveButton) saveButton.disabled = true;

      const contactsCollection = getContactsCollection();

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

        showContactMessage("Contact updated successfully.");
      } else {
        const existingContacts = await getDocs(contactsCollection);

        if (existingContacts.size >= MAX_CONTACTS) {
          showContactMessage(
            "Maximum 3 emergency contacts allowed.",
            true
          );
          return;
        }

        await addDoc(contactsCollection, {
          name,
          phone,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        showContactMessage("Contact saved successfully.");
      }

      clearContactForm();
      await loadContacts();

    } catch (error) {
      console.error("Save contact error:", error);
      showContactMessage(error.message, true);
    } finally {
      if (saveButton) saveButton.disabled = false;
    }
  });
}

/* =====================================
   EDIT CONTACT
===================================== */

function editContact(contactId, contact) {
  editingContactId = contactId;

  const nameInput = document.getElementById("contactName");
  const phoneInput = document.getElementById("contactPhone");
  const editId = document.getElementById("editId");
  const saveButton = document.getElementById("saveContactBtn");

  if (nameInput) nameInput.value = contact.name || "";
  if (phoneInput) phoneInput.value = contact.phone || "";
  if (editId) editId.value = contactId;

  if (saveButton) saveButton.textContent = "Update Contact";

  document.getElementById("contactForm")?.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

/* =====================================
   DELETE CONTACT
===================================== */

async function deleteContact(contactId) {
  const confirmed = confirm(
    "Are you sure you want to delete this contact?"
  );

  if (!confirmed) return;

  try {
    const contactReference = doc(
      db,
      "users",
      currentUser.uid,
      "contacts",
      contactId
    );

    await deleteDoc(contactReference);

    showToast("Contact deleted successfully.");

    await loadContacts();

  } catch (error) {
    console.error("Delete contact error:", error);
    showToast(error.message);
  }
}

/* =====================================
   CANCEL EDIT
===================================== */

window.cancelEdit = function () {
  clearContactForm();
};

/* =====================================
   CLEAR CONTACT FORM
===================================== */

function clearContactForm() {
  editingContactId = null;

  document.getElementById("contactForm")?.reset();

  const editId = document.getElementById("editId");
  const saveButton = document.getElementById("saveContactBtn");

  if (editId) editId.value = "";
  if (saveButton) saveButton.textContent = "Save Contact";

  showContactMessage("");
}

/* =====================================
   CLEAR CONTACT LIST
===================================== */

function clearContactList() {
  const contactList = document.getElementById("contactList");
  const contactCount = document.getElementById("contactCount");

  if (contactList) contactList.innerHTML = "";
  if (contactCount) contactCount.textContent = "0/3";
}

/* =====================================
   CONTACT MESSAGE
===================================== */

function showContactMessage(message, isError = false) {
  const element = document.getElementById("contactMessage");

  if (!element) return;

  element.textContent = message;
  element.style.color = isError ? "#ff3155" : "#35e6a1";
}

/* =====================================
   BUTTON CONNECTIONS
===================================== */

document.getElementById("guestBtn")?.addEventListener(
  "click",
  window.guestLogin
);

document.getElementById("googleBtn")?.addEventListener(
  "click",
  window.googleLogin
);

document.getElementById("enBtn")?.addEventListener(
  "click",
  () => window.setLang("en")
);

document.getElementById("taBtn")?.addEventListener(
  "click",
  () => window.setLang("ta")
);

document.getElementById("cancelEditBtn")?.addEventListener(
  "click",
  window.cancelEdit
);

document.querySelectorAll(
  "#logoutBtn, [data-action='logout']"
).forEach(button => {
  button.addEventListener("click", window.logout);
});

/* =====================================
   INITIALIZE
===================================== */

window.setLang(currentLanguage);
initializeFloatingSOS();

console.log("SafeSignal application initialized.");
