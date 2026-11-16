
const contactForm = document.getElementById("contactUsForm");
const contactStatus = document.getElementById("contactUsStatus");
const sendButton = document.getElementById("sendMessageBtn");

const CONTACT_EMAIL = "safesignal100@gmail.com";
const FORM_ENDPOINT = `https://formsubmit.co/ajax/${CONTACT_EMAIL}`;

if (contactForm) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("senderName")?.value.trim();
    const email = document.getElementById("senderEmail")?.value.trim();
    const message = document.getElementById("senderMessage")?.value.trim();

    if (!name || !email || !message) {
      contactStatus.textContent = "Please fill in all fields.";
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      contactStatus.textContent = "Please enter a valid email address.";
      return;
    }

    if (message.length > 3000) {
      contactStatus.textContent = "Message must be under 3000 characters.";
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
          name: name,
          email: email,
          message: message,
          _subject: "New SafeSignal Website Message",
          _template: "table",
          _captcha: "true"
        })
      });

      const result = await response.json();

      if (!response.ok || result.success === "false" || result.success === false) {
        throw new Error(result.message || "Message could not be sent.");
      }

      contactStatus.textContent =
        "Message submitted successfully! Thank you for contacting SafeSignal.";

      contactForm.reset();

    } catch (error) {
      console.error("Contact form error:", error);

      contactStatus.textContent =
        "Unable to send right now. Please try again later.";
    } finally {
      sendButton.disabled = false;
      sendButton.textContent = "Send Message";
    }
  });
}
