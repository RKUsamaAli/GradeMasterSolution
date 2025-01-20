import { getData, updateData } from "./firebaseConfig.js";
import { getCookie, COLLECTIONS, calculateGPA } from "./common.js";

// Show loader and hide content initially
const loader = document.getElementById('loader');
const contentSection = document.getElementById('contentSection');
loader.style.display = 'block';
contentSection.style.display = 'none';

const user = JSON.parse(getCookie("user"));

// Fetch and display user details
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const userData = await getData(`${COLLECTIONS.users}/${user.id}`);
    const userDetails = userData.val();

    // Fill user details dynamically
    ["username", "username1", "username2", "username3"].forEach(id => {
      document.getElementById(id).textContent = userDetails.name;
    });
    ["role", "role1", "role2"].forEach(id => {
      document.getElementById(id).textContent = userDetails.role;
    });
    document.getElementById("useremail").textContent = userDetails.email;
  } catch (error) {
    console.error("Error fetching user data:", error);
  }
});

// Dynamically generate sidebar content based on user role
const generateSidebarContent = (role) => {
  const isAdmin = role === "Admin" || role === "Super Admin";
  const isTeacher = role === "Teacher";
  const isStudent = role === "Student";

  let content = `
    ${isAdmin ? `
      <li class="nav-item"><a class="nav-link" href="user.html"><i class="bi bi-person-circle"></i> Users</a></li>
      <li class="nav-item"><a class="nav-link" href="course.html"><i class="fa-solid fa-graduation-cap"></i> Courses</a></li>
      <li class="nav-item"><a class="nav-link" href="semester.html"><i class="bi bi-calendar3"></i> Semesters</a></li>
      <li class="nav-item"><a class="nav-link" href="subject.html"><i class="bi bi-book"></i> Subjects</a></li>
      <li class="nav-item"><a class="nav-link" href="students.html"><i class="bi bi-people"></i> Students</a></li>` : ''}

    ${(isAdmin || isTeacher) ? `
      <li class="nav-item"><a class="nav-link" href="marks.html"><i class="fa-solid fa-check"></i> Marks</a></li>` : ''}

    ${isStudent ? `
      <li class="nav-item"><a class="nav-link" href="transcript.html"><i class="fa-regular fa-file"></i> Transcript</a></li>` : ''}

    ${isAdmin ? `
      <li class="nav-item"><a class="nav-link" href="admin-transcript.html"><i class="fa-regular fa-file"></i> Transcript</a></li>` : ''}

    <li class="nav-item"><a class="nav-link" href="users-profile.html"><i class="bi bi-person"></i> Profile</a></li>
  `;
  return content;
};

document.getElementById("sidebar-nav").innerHTML = generateSidebarContent(user.role);

// Change Password
async function changePassword() {
  const newPwdInput = document.getElementById("newPassword");
  const newPwd = newPwdInput.value.trim();

  if (!newPwd) {
    document.getElementById("pwderror").textContent = "Please enter password";
    return;
  }

  try {
    const hashedPwd = CryptoJS.SHA256(newPwd).toString();
    await updateData(`${COLLECTIONS.users}/${user.id}`, { password: hashedPwd });
    newPwdInput.value = "";
    alert("Password changed successfully!");
  } catch (error) {
    console.error("Error changing password:", error);
  }
}

// Edit Profile
async function editProfile() {
  const fullName = document.getElementById("UfullName").value.trim();
  const email = document.getElementById("UEmail").value.trim();
  const fullNameError = document.getElementById("fullNameError");
  const emailError = document.getElementById("emailError");

  let isValid = true;
  if (!fullName) {
    fullNameError.textContent = "Please enter full name";
    isValid = false;
  } else {
    fullNameError.textContent = "";
  }

  if (!email) {
    emailError.textContent = "Please enter email";
    isValid = false;
  } else if (!email.endsWith("@gmail.com")) {
    emailError.textContent = "Please enter a valid email address";
    isValid = false;
  } else {
    emailError.textContent = "";
  }

  if (isValid) {
    try {
      await updateData(`${COLLECTIONS.users}/${user.id}`, { name: fullName, email: email });
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  }
}

// Display student info if user is a Student
async function displayStudentInfo() {
  try {
    if (user.role !== "Student") return;

    const cgpa = await calculateGPA(user.id);
    const studentData = await getData(`${COLLECTIONS.students}/${user.id}`);
    const { rollNo, courseId, semesterId, dob } = studentData.val();

    const courseData = await getData(`${COLLECTIONS.courses}/${courseId}`);
    const semesterData = await getData(`${COLLECTIONS.semesters}/${semesterId}`);
    
    const courseName = courseData.exists() ? courseData.val().name : "N/A";
    const semesterName = semesterData.exists() ? semesterData.val().name : "N/A";

    document.getElementById("cgpa").innerHTML = `
      <div class="row"><div class="col-md-4 label">CGPA</div><div class="col-md-8">${cgpa}</div></div>
      <div class="row"><div class="col-md-4 label">Roll No</div><div class="col-md-8">${rollNo}</div></div>
      <div class="row"><div class="col-md-4 label">Course</div><div class="col-md-8">${courseName}</div></div>
      <div class="row"><div class="col-md-4 label">Semester</div><div class="col-md-8">${semesterName}</div></div>
      <div class="row"><div class="col-md-4 label">Date of Birth</div><div class="col-md-8">${dob}</div></div>
    `;
  } catch (error) {
    console.error("Error displaying student info:", error);
  }
}

// Initialize UI after loading user data
(async function initializeUI() {
  await displayStudentInfo();
  contentSection.style.display = 'block';
  loader.style.display = 'none';
})();

window.editProfile = editProfile;
window.changePassword = changePassword;
