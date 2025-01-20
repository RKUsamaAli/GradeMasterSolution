import { getData, queryByKeyValue } from "./firebaseConfig.js";

// Constants
const COLLECTIONS = {
  courses: "courses",
  semesters: "semesters",
  subjects: "subjects",
  students: "students",
  marks: "marks",
  users: "users"
};

// Check user authentication on page load
document.addEventListener("DOMContentLoaded", async () => {
  validateLogin();
});

function validateLogin() {
  const token = getCookie("token");
  const user = getCookie("user");
  const loggedIn = token && user;

  if (!!loggedIn && window.location.pathname.includes("login")) {
    redirectToHome();
    return;
  };

  if (!loggedIn && !window.location.pathname.includes("login")) {
    redirectToLogin();
    return;
  }
}

// Logout Function
const logoutButton = document.getElementById("logout");
logoutButton?.addEventListener("click", () => {
  ["token", "user"].forEach(cname => {
    document.cookie = `${cname}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });
});

// Utility Functions
function getCookie(cname) {
  const cookies = document.cookie.split(";").map(c => c.trim());
  const cookie = cookies.find(c => c.startsWith(`${cname}=`));
  return cookie ? cookie.split("=")[1] : "";
}

// Set cookie with expiration
function setCookie(name, value, hours) {
  const expires = new Date(Date.now() + hours * 3600000).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; Secure; SameSite=Strict`;
}

function redirectToLogin() {
  window.location.href = "/login";
}

function redirectToHome() {
  window.location.href = "/users-profile";
}

// Generic Data Fetch Function
async function fetchData(collection) {
  try {
    const snapshot = await getData(collection);
    if (!snapshot.exists()) return [];
    const data = [];
    for (const key in snapshot.val()) {
      data.push({ id: key, ...snapshot.val()[key] });
    }
    return data;
  } catch (error) {
    console.error(`Error fetching data from ${collection}:`, error);
    return [];
  }
}

// Getters
async function getUsers() {
  return await fetchData(COLLECTIONS.users);
}

async function getCourses() {
  return await fetchData(COLLECTIONS.courses);
}

async function getSemesters() {
  const semArray = await queryByKeyValue(COLLECTIONS.semesters, "status", true);
  return await enrichWithCourseData(semArray, "courseId");
}

async function getSubjects() {
  const subArray = await queryByKeyValue(COLLECTIONS.subjects, "status", true);
  return await enrichWithRelatedData(subArray, ["courseId", "semesterId"]);
}

async function getStudents() {
  const stdArray = await queryByKeyValue(COLLECTIONS.students, "status", true);
  return await enrichWithRelatedData(stdArray, ["courseId", "semesterId"]);
}

async function getMarks() {
  const marksArray = await queryByKeyValue(COLLECTIONS.marks, "status", true);
  return await enrichWithRelatedData(marksArray, ["courseId", "semesterId", "subjectId", "studentId"]);
}

// Helper Functions for Data Enrichment
async function enrichWithCourseData(array, key) {
  const promises = array.map(async item => {
    const courseSnap = await getData(`${COLLECTIONS.courses}/${item[key]}`);
    item.course = courseSnap.exists() ? courseSnap.val().name : 'Unknown';
    return item;
  });
  return await Promise.all(promises);
}

async function enrichWithRelatedData(array, keys) {
  const promises = array.map(async item => {
    for (const key of keys) {
      const collection = key.includes("course") ? COLLECTIONS.courses
        : key.includes("semester") ? COLLECTIONS.semesters
          : key.includes("subject") ? COLLECTIONS.subjects
            : COLLECTIONS.students;
      const snap = await getData(`${collection}/${item[key]}`);
      item[key.replace("Id", "")] = snap.exists() ? snap.val().name : 'Unknown';
    }
    return item;
  });
  return await Promise.all(promises);
}

// Dropdown Options
async function dropdownOptions(id, index = "", selected = "") {
  const element = document.getElementById(`${id}${index}`);
  if (!element) return;

  const array = await getDropdownData(id, index);
  element.innerHTML = array.length
    ? array.map((item, i) => `<option value="${item.id}" ${i === 0 || item.name === selected ? "selected" : ""}>${item.name}</option>`).join("")
    : `<option value="" hidden disabled selected>No ${id} is present</option>`;
}

async function getDropdownData(id, index) {
  const course = document.getElementById(`course${index}`)?.value;
  const semester = document.getElementById(`semester${index}`)?.value;

  switch (id) {
    case 'course':
      return await queryByKeyValue(COLLECTIONS.courses, "status", true);
    case 'semester':
      return course ? await queryByKeyValue(COLLECTIONS.semesters, "courseId", course, "status", true) : [];
    case 'subject':
      return semester ? await queryByKeyValue(COLLECTIONS.subjects, "semesterId", semester, "status", true) : [];
    case 'student':
      return semester ? await queryByKeyValue(COLLECTIONS.students, "semesterId", semester) : [];
    default:
      console.error('Invalid dropdown ID');
      return [];
  }
}

// Grade Conversion
function convertMarksToGrade(marks) {
  return marks >= 90 ? 'A+' :
    marks >= 85 ? 'A' :
      marks >= 80 ? 'A-' :
        marks >= 75 ? 'B+' :
          marks >= 70 ? 'B' :
            marks >= 65 ? 'B-' :
              marks >= 60 ? 'C+' :
                marks >= 55 ? 'C' :
                  marks >= 50 ? 'C-' : 'F';
}

function gradeToGPA(grade) {
  const grades = { 'A+': 4.0, 'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7, 'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D': 1.0, 'F': 0.0 };
  return grades[grade.toUpperCase()] ?? null;
}

function calculateGPA(marks, subjects) {
  try {
    // Initialize total credits
    const totalCredits = subjects.map(x => Number(x.credit)).reduce((accumulator, current) => accumulator + current, 0);
    let totalPoints = 0;

    // Loop through marks and calculate GPA
    for (const mark of marks) {
      const gp = gradeToGPA(mark.grade); // Assuming this function converts the grade to GPA points
      const subject = subjects.find(x => x.id == mark.subjectId);

      if (subject) {
        totalPoints += gp * Number(subject.credit);
      }
    }

    // Calculate GPA
    const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0.0;
    return parseFloat(gpa);
  } catch (error) {
    console.error("Error calculating GPA:", error);
    return null;
  }
}


// Create JWT token
function createJWT(payload, secret) {
  const header = base64Encode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payloadEncoded = base64Encode(JSON.stringify({ ...payload, iat: Date.now() }));
  const signature = base64Encode(`${header}.${payloadEncoded}.${secret}`);
  return `${header}.${payloadEncoded}.${signature}`;
}
function base64Encode(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

export {
  COLLECTIONS,
  dropdownOptions,
  getCookie,
  setCookie,
  createJWT,

  redirectToHome,

  getUsers,
  getCourses,
  getSemesters,
  getSubjects,
  getStudents,
  getMarks,
  convertMarksToGrade,
  gradeToGPA,
  calculateGPA
};