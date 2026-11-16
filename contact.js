
const CONTACT_EMAIL = "safesignal100@gmail.com";

const contactForm = document.getElementById("contactForm");

const contactStatus =
  document.getElementById("contactStatus") ||
  document.getElementById("contactMessage");

if (contactForm) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = contactForm.querySelector('[name="name"]')?.value.trim();
    const email = contactForm.querySelector('[name="email"]')?.value.trim();
    const message = contactForm.querySelector('[name="message"]')?.value.trim();

    const submitButton = contactForm.querySelector(
      'button[type="submit"], input[type="submit"]'
    );

    function showStatus(text, success = false) {
      if (!contactStatus) {
        alert(text);
        return;
      }

      contactStatus.textContent = text;
      contactStatus.style.color = success ? "#35e6a1" : "#ff3155";
    }

    if (!name || !email || !message) {
      showStatus("Please fill in all fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showStatus("Please enter a valid email address.");
      return;
    }

    if (message.length < 5) {
      showStatus("Please enter a longer message.");
      return;
    }

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Sending...";
      }

      showStatus("Sending your message...");

      const response = await fetch(
        `https://formsubmit.co/ajax/${CONTACT_EMAIL}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            name: name,
            email: email,
            message: message,
            _subject: "New SafeSignal Contact Message",
            _template: "table",
            _url: "https://nammabustn-hub.github.io/safesignal/"
          })
        }
      );

      const result = await response.json();

      if (String(result.success) !== "true") {
        throw new Error(
          result.message || "Message could not be sent."
        );
      }

      showStatus(
        "Your message has been sent successfully. Thank you!",
        true
      );

      contactForm.reset();

    } catch (error) {
      console.error("Contact form error:", error);

      showStatus(
        error.message ||
        "Unable to send your message. Please try again later."
      );

    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Send Message";
      }
    }
  });
} else {
  console.warn("SafeSignal contact form not found.");
}
