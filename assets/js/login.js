import { updateData, queryByKeyValue } from "./firebaseConfig.js";
import { COLLECTIONS, setCookie, createJWT, redirectToHome } from "./common.js";

// Cache DOM elements
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const nouserError = document.getElementById("nouserError");
const form = document.getElementById("submitForm");

// Form submission handler
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearErrors();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!validateInputs(email, password)) return;

  const hashedPassword = CryptoJS.SHA256(password).toString();

  try {
    const users = await queryByKeyValue(COLLECTIONS.users);
    const user = users.find(
      (u) => u.email === email && u.password === hashedPassword
    );

    if (!user) {
      displayError(nouserError, "No user found with this email and password.");
      return;
    }

    // Generate token and update user data
    const token = createJWT({ email: user.email }, user.secret);
    setCookie("token", `Bearer ${token}`, 2);
    setCookie("user", JSON.stringify({
      name: user.name,
      email: user.email,
      role: user.role,
      id: user.id,
    }), 2);

    await updateData(`${COLLECTIONS.users}/${user.id}`, {
      token,
      last_login: new Date(),
    });

    redirectToHome();
  } catch (error) {
    console.error("Login Error:", error);
    displayError(nouserError, "An error occurred during login. Please try again.");
  }
});

// Utility Functions
function clearErrors() {
  emailError.textContent = "";
  passwordError.textContent = "";
  nouserError.textContent = "";
}

function validateInputs(email, password) {
  let isValid = true;

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    displayError(emailError, "Please enter a valid email address.");
    isValid = false;
  }


  if (password.length < 6) {
    displayError(passwordError, "Password must be at least 6 characters.");
    isValid = false;
  }

  return isValid;
}

function displayError(element, message) {
  element.textContent = message;
  element.classList.add("d-block");
}
