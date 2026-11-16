
const contactForm = document.getElementById("contactUsForm");
const contactStatus = document.getElementById("contactUsStatus");
const sendButton = document.getElementById("sendMessageBtn");

const CONTACT_EMAIL = "safesignal100@gmail.com";
const FORM_ENDPOINT = `https://formsubmit.co/ajax/${CONTACT_EMAIL}`;
const DRAFT_KEY = "safesignal_contact_draft_v1";

const nameField = document.getElementById("senderName");
const emailField = document.getElementById("senderEmail");
const messageField = document.getElementById("senderMessage");

if (contactForm && nameField && emailField && messageField && sendButton && contactStatus) {

  // Save draft automatically
  function saveDraft() {
    const draft = {
      name: nameField.value,
      email: emailField.value,
      message: messageField.value
    };

    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (error) {
      console.warn("Could not save contact draft:", error);
    }
  }

  // Restore draft after refresh
  function restoreDraft() {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (!saved) return;

      const draft = JSON.parse(saved);

      nameField.value = draft.name || "";
      emailField.value = draft.email || "";
      messageField.value = draft.message || "";

      if (draft.name || draft.email || draft.message) {
        contactStatus.textContent =
          "Your previous draft has been restored.";
      }
    } catch (error) {
      console.warn("Could not restore contact draft:", error);
    }
  }

  // Clear form and saved draft only after successful sending
  function clearDraft() {
    contactForm.reset();

    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (error) {
      console.warn("Could not clear saved draft:", error);
    }
  }

  // Restore saved content when page opens
  restoreDraft();

  // Save whenever the user types
  nameField.addEventListener("input", saveDraft);
  emailField.addEventListener("input", saveDraft);
  messageField.addEventListener("input", saveDraft);

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

    if (message.length > 1500) {
      contactStatus.textContent = "Message must be under 1500 characters.";
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
          _captcha: "true"
        })
      });

      const responseText = await response.text();

      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error("Email service returned an invalid response.");
      }

      if (
        !response.ok ||
        result.success === false ||
        result.success === "false" ||
        result.success !== true && result.success !== "true"
      ) {
        throw new Error(
          result.message || "Email service could not accept your message."
        );
      }

      // Success: clear fields and saved draft
      clearDraft();

      contactStatus.textContent =
        "Message sent successfully! Thank you for contacting SafeSignal.";

    } catch (error) {
      console.error("SafeSignal contact form error:", error);

      // Keep the draft so the user does not lose their message
      saveDraft();

      contactStatus.textContent =
        "Message could not be sent. Your draft is saved. Please try again.";
    } finally {
      sendButton.disabled = false;
      sendButton.textContent = "Send Message";
    }
  });
}
