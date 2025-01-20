import { getData, queryByKeyValue } from "./firebaseConfig.js";
import {
  dropdownOptions,
  getCookie,
  COLLECTIONS,
  gradeToGPA
} from "./common.js";

const user = JSON.parse(getCookie("user"));

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("username").textContent = user.name;
  document.getElementById("username1").textContent = user.name;
  document.getElementById("role").textContent = user.role;
});

async function initialize() {
  try {
    toggleVisibility(['loader'], true);
    toggleVisibility(['AddMarksTable', 'footer'], false);

    // Load dropdown options sequentially
    await Promise.all([
      dropdownOptions("course"),
      dropdownOptions("semester"),
      dropdownOptions("student"),
    ]);

    await showTable();
    toggleVisibility(['AddMarksTable', 'footer'], true);
  } catch (error) {
    console.error("Error initializing data:", error);
  } finally {
    toggleVisibility(['loader'], false);
  }
}

// Utility function to toggle visibility of elements
function toggleVisibility(elementIds, show) {
  elementIds.forEach((id) => {
    const element = document.getElementById(id);
    if (element) element.style.display = show ? 'block' : 'none';
  });
}

// Show students' marks table
async function showTable() {
  toggleVisibility(['loader'], true);
  toggleVisibility(['semeterLoader', 'footer'], false);

  const studentId = document.getElementById("student").value;
  const semesterId = document.getElementById("semester").value;
  const stdDetailElement = document.getElementById("stdDetail");
  const semesterGPAElement = document.getElementById("semesterGPA");
  let studentDetailHtml = "";
  let gpaHtml = "";

  if (studentId) {
    try {
      const studentData = await getData(`${COLLECTIONS.students}/${studentId}`);
      const student = studentData.val();
      const [semestersData, subjectsData, marksData] = await Promise.allSettled([
        queryByKeyValue(COLLECTIONS.semesters, "courseId", student.courseId),
        queryByKeyValue(COLLECTIONS.subjects, "courseId", student.courseId),
        queryByKeyValue(COLLECTIONS.marks, "studentId", studentId),
      ])

      const semesters = semestersData.status === "fulfilled" ? semestersData.value : [];
      const subjects = subjectsData.status === "fulfilled" ? subjectsData.value : [];
      const marks = marksData.status === "fulfilled" ? marksData.value : [];

      const cgpa = calculateGPA(marks, subjects);
      studentDetailHtml = getStudentDetailsHtml(student, cgpa);

      gpaHtml = await getSemestersGPAHtml(student, semesters, subjects, marks);
    } catch (error) {
      console.error("Error fetching student data:", error);
    }
  } else {
    studentDetailHtml = `<h5 class="card-title mt-3">Student Detail</h5>Select a student to get the Transcript`;
  }

  stdDetailElement.innerHTML = studentDetailHtml;
  semesterGPAElement.innerHTML = gpaHtml;

  toggleVisibility(['loader'], false);
  toggleVisibility(['semeterLoader', 'footer'], true);
}

// Generate HTML for student details
function getStudentDetailsHtml(student, cgpa) {
  return `
    <h5 class="card-title mt-3">Student Detail</h5>
    <div class="row" style="font-weight: bold;">
      ${getDetailRow("Name", student.name)}
      ${getDetailRow("Roll No", student.rollNo)}
      ${getDetailRow("CGPA", cgpa)}
    </div>`;
}

// Utility to create detail row HTML
function getDetailRow(label, value) {
  return `
    <div class="col-md-4" style="display: flex; align-items: center; margin-bottom: 10px;">
      <span style="width: 30%; min-width: 80px;">${label}:</span>
      <span style="font-weight: normal; padding-left: 10px; flex-grow: 1;">${value}</span>
    </div>`;
}

// Generate HTML for semesters GPA
async function getSemestersGPAHtml(student, semesters, subjects, marks) {
  let html = "";
  for (const semester of semesters) {
    try {
      const semMarks = marks.filter(x => x.semesterId == semester.id)
      const semSubjects = subjects.filter(x => x.semesterId == semester.id)

      if (semMarks.length > 0) {
        html += `
          <div class="col-lg-12">
            <div class="card">
              <div class="card-body">
                <h5 class="card-title">Semester: ${semester.name}</h5>
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>Subjects</th>
                      <th>Cr Hr</th>
                      <th>Marks</th>
                      <th>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${await getMarksHtml(semMarks, semSubjects)}
                  </tbody>
                </table>
                <span class="card-title">GPA: ${calculateGPA(semMarks, semSubjects)}</span>
              </div>
            </div>
          </div>`;
      }
    } catch (error) {
      console.error("Error generating GPA HTML:", error);
    }
  }
  return html;
}

// Generate HTML for marks
async function getMarksHtml(marks, subjects) {
  const html = await Promise.all(marks.map(async (mark) => {
    const subject = subjects.find(x => x.id == mark.subjectId);
    return `
      <tr>
        <td>${subject.name}</td>
        <td>${subject.credit}</td>
        <td>${mark.marks}</td>
        <td>${mark.grade}</td>
      </tr>`;
  }));
  return html.join("")
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


// Generate sidebar content based on user role
function generateSidebarContent() {
  const sidebarNav = document.getElementById("sidebar-nav");
  let content = "";

  if (["Admin", "Super Admin"].includes(user.role)) {
    content += `
      ${getNavItem("user.html", "bi-person-circle", "Users")}
      ${getNavItem("course.html", "fa-solid fa-graduation-cap", "Courses")}
      ${getNavItem("semester.html", "bi-calendar3", "Semesters")}
      ${getNavItem("subject.html", "bi-book", "Subjects")}
      ${getNavItem("students.html", "bi-people", "Students")}
      ${getNavItem("admin-transcript.html", "fa-regular fa-file", "Transcript")}`;
  }

  if (["Admin", "Super Admin", "Teacher"].includes(user.role)) {
    content += getNavItem("marks.html", "fa-solid fa-check", "Marks");
  }

  content += getNavItem("users-profile.html", "bi-person", "Profile");
  sidebarNav.innerHTML = content;
}

// Utility for creating nav item
function getNavItem(href, iconClass, text) {
  return `
    <li class="nav-item">
      <a class="nav-link collapsed" href="${href}">
        <i class="${iconClass}"></i><span>${text}</span>
      </a>
    </li>`;
}

window.dropdownOptions = dropdownOptions;
window.showTable = showTable;
generateSidebarContent();
initialize();
