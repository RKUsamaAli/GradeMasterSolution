import {
  setData,
  updateData,
  removeData,
  randomID,
  queryByKeyValue,
} from "./firebaseConfig.js";

import { delSemester } from "./semester.js";
import { COLLECTIONS, getCourses, getCookie } from "./common.js";

let courses = [];
let courseTable = null;
let isTabInitialized = false;

// Fetch user information
const user = JSON.parse(await getCookie("user"));

document.addEventListener("DOMContentLoaded", () => {
  displayUserInfo(user);
  if (isAdmin(user.role)) {
    showAdminTranscriptOption();
  }
});

// Display user information in the UI
function displayUserInfo(user) {
  document.getElementById("username").textContent = user.name;
  document.getElementById("username1").textContent = user.name;
  document.getElementById("role").textContent = user.role;
}

// Check if the user is an admin
function isAdmin(role) {
  return role === "Admin" || role === "Super Admin";
}

// Show admin transcript option in the navigation
function showAdminTranscriptOption() {
  document.getElementById("showTranscript").innerHTML = `
    <li class="nav-item">
      <a class="nav-link collapsed" href="admin-transcript.html">
        <i class="fa-regular fa-file"></i><span>Transcript</span>
      </a>
    </li>`;
}

// Initialize data and UI components
async function initialize() {
  toggleLoader(true);
  try {
    courses = await getCourses();
    if (!isTabInitialized) {
      initializeDataTable();
      isTabInitialized = true;
    }
    updateCourseTable();
  } catch (error) {
    console.error("Error initializing data:", error);
  } finally {
    toggleLoader(false);
  }
}

// Toggle loader visibility
function toggleLoader(isLoading) {
  document.getElementById("loader").style.display = isLoading ? "block" : "none";
  document.getElementById("contentSection").style.display = isLoading
    ? "none"
    : "block";
}

// Initialize DataTable for courses
function initializeDataTable() {
  courseTable = $("#courseTable").DataTable({
    columns: [
      { data: "name" },
      {
        data: null,
        orderable: false,
        searchable: false,
        render: (data, type, row, meta) => renderCourseActions(row, meta.row),
      },
    ],
  });
}

// Update DataTable with current course data
function updateCourseTable() {
  courseTable.clear().rows.add(courses).draw();
}

// Render action buttons (edit, toggle status, delete)
function renderCourseActions(row, rowIndex) {
  return `
    <div class="text-end">
      <a href="#" data-bs-toggle="modal" data-bs-target="#updateModel${row.id}">
        <i class="fa-solid fa-pencil fa-lg" style="color: #0f54ae;"></i>
      </a>
      <div class="modal fade" id="updateModel${row.id}" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" style="font-weight:bold;">Update Course</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="row">
                <label for="inputText" class="col-sm-2 col-form-label">Name</label>
                <div class="col-sm-10">
                  <input type="text" class="form-control" id="${row.id}updateCourseName" value="${row.name}" />
                  <span id="error-msg" class="text-danger" style="display:none;">Please enter a course
                    name</span>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                Close
              </button>
              <button type="button" class="btn btn-primary" onclick="validateAndAdd('${row.id}')" data-bs-dismiss="modal">
                Update Course
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <span class="form-switch mx-2">
        <input type="checkbox" class="form-check-input" id="${row.id}" ${row.status ? "checked" : ""} 
        onchange="changestatus('${row.id}')">
      </span>
      <a href="#" data-bs-toggle="modal" data-bs-target="#deleteCourseModal${rowIndex}">
        <i class="fa-solid fa-trash fa-lg" style="color: #f00000;"></i>
      </a>
      <div class="modal fade" id="deleteCourseModal${rowIndex}" tabindex="-1">
              <div class="modal-dialog">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title" style="font-weight:bold;">Delete Semester</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                  </div>
                  <div class="modal-body text-start">
                    <p>Are you sure you want to delete Semester "${row.name}" from "${row.course}"?</p>
                    <p>If you delete this semester then all its subjects and students will be deleted</p>
                  </div>
                  <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">No</button>
                    <button type="button" class="btn btn-danger" onclick="delCourse('${row.id}')" data-bs-dismiss="modal">Yes</button>
                  </div>
                </div>
              </div>
            </div><!-- End Basic Modal-->
    </div>`;
}

// Validate and add a new course
function validateAndAdd(uId = '') {
  let courseName;

  if (uId) {
    courseName = document.getElementById( uId + "updateCourseName").value.trim().toUpperCase();
  } else {
    courseName = document.getElementById("courseName").value.trim().toUpperCase();
  }
  const errorMsg = document.getElementById("error-msg");

  if (!courseName) {
    errorMsg.style.display = "block";
    return;
  }

  errorMsg.style.display = "none";
  addCourse(courseName, uId);
}

// Add a new course to the database
async function addCourse(name, id = '') {

  if (!/^[a-zA-Z\s]+$/.test(name)) {
    alert("Course name must be a string containing only letters and spaces!");
    return;
  }

  if (courses.some(course => course.name === name)) {
    alert("This course already exists!");
    return;
  }

  try {
    await setData(`${COLLECTIONS.courses}/${id || randomID()}`, { name, status: true });
    await initialize();
  } catch (error) {
    console.error("Error adding course:", error);
  }
}

// Change course status
async function changestatus(courseId) {
  const status = document.getElementById(courseId).checked;
  try {
    await updateData(`${COLLECTIONS.courses}/${courseId}`, { status });
  } catch (error) {
    console.error("Error updating course status:", error);
  }
}

// Delete a course along with its related data
async function delCourse(courseId) {
  try {
    const semesters = await queryByKeyValue(COLLECTIONS.semesters, "courseId", courseId);
    for (const semester of semesters) {
      await delSemester(semester.id);
    }
    await removeData(`${COLLECTIONS.courses}/${courseId}`);
    await initialize();
  } catch (error) {
    console.error("Error deleting course:", error);
  }
}

// Update course name
async function updateCourse(rowIndex) {
  const newName = document.getElementById(`updateCoursename${rowIndex}`).value.trim().toUpperCase();
  const currentName = courses[rowIndex]?.name;

  if (!/^[a-zA-Z\s]+$/.test(newName)) {
    alert("Course name must be a string containing only letters and spaces!");
    return;
  }
  if (!newName || newName === currentName) {
    alert("Course name cannot be empty or the same as the current name!");
    return;
  }

  if (courses.some(course => course.name === newName)) {
    alert("Course with this name already exists!");
    return;
  }

  try {
    const courseId = courses[rowIndex].id;
    await updateData(`${COLLECTIONS.courses}/${courseId}`, { name: newName });
    await initialize();
  } catch (error) {
    console.error("Error updating course:", error);
  }
}

// Expose functions to global scope
window.validateAndAdd = validateAndAdd;
window.delCourse = delCourse;
window.updateCourse = updateCourse;
window.changestatus = changestatus;

initialize();
