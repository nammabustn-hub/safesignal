
const contactForm = document.getElementById("contactUsForm");
const contactStatus = document.getElementById("contactUsStatus");
const sendButton = document.getElementById("sendMessageBtn");

const CONTACT_EMAIL = "safesignal100@gmail.com";
const FORM_ENDPOINT = `https://formsubmit.co/ajax/${CONTACT_EMAIL}`;
const DRAFT_KEY = "safesignal_contact_draft_v1";

const nameField = document.getElementById("senderName");
const emailField = document.getElementById("senderEmail");
const messageField = document.getElementById("senderMessage");

if (contactForm && contactStatus && sendButton && nameField && emailField && messageField) {

  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        name: nameField.value,
        email: emailField.value,
        message: messageField.value
      }));
    } catch (e) {
      console.error("Draft save error:", e);
    }
  }

  function restoreDraft() {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (!saved) return;

      const draft = JSON.parse(saved);
      nameField.value = draft.name || "";
      emailField.value = draft.email || "";
      messageField.value = draft.message || "";
    } catch (e) {
      console.error("Draft restore error:", e);
    }
  }

  function clearDraft() {
    contactForm.reset();
    localStorage.removeItem(DRAFT_KEY);
  }

  restoreDraft();

  [nameField, emailField, messageField].forEach(field => {
    field.addEventListener("input", saveDraft);
  });

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = nameField.value.trim();
    const email = emailField.value.trim();
    const message = messageField.value.trim();

    if (!name || !email || !message) {
      contactStatus.textContent = "Please fill in all fields.";
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      contactStatus.textContent = "Please enter a valid email address.";
      return;
    }

    sendButton.disabled = true;
    sendButton.textContent = "Sending...";
    contactStatus.textContent = "Sending your message...";

    try {
      const response = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          name,
          email,
          message,
          _subject: "New SafeSignal Website Message",
          _replyto: email,
          _template: "table",
          _captcha: "true",
          _url: window.location.href
        })
      });

      const result = await response.json();

      console.log("FormSubmit response:", result);

      if (
        !response.ok ||
        result.success === false ||
        result.success === "false" ||
        !(result.success === true || result.success === "true")
      ) {
        throw new Error(result.message || "Email service rejected the message.");
      }

      clearDraft();

      contactStatus.textContent =
        "Message sent successfully! Thank you for contacting SafeSignal.";

    } catch (error) {
      console.error("Contact form error:", error);
      saveDraft();

      contactStatus.textContent =
        "Send failed: " + (error.message || "Please try again.");
    } finally {
      sendButton.disabled = false;
      sendButton.textContent = "Send Message";
    }
  });
}
