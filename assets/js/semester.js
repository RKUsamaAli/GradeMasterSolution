import {
  setData,
  removeData,
  randomID,
  queryByKeyValue
} from "./firebaseConfig.js";

import {
  COLLECTIONS,
  getSemesters,
  dropdownOptions,
  getCookie
} from "./common.js";

import { delSTD } from './student.js';
import { delSub } from './subject.js';
var semesters = [];
let flagTab = false;

let user = JSON.parse(getCookie("user"));
document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("username").innerHTML = user.name;
  document.getElementById("username1").innerHTML = user.name;
  document.getElementById("role").innerHTML = user.role;
});

async function initializtion() {
  try {
    document.getElementById('loader').style.display = 'block';
    document.getElementById('contentSection').style.display = 'none';
    semesters.length = 0;
    semesters = await getSemesters();
    if (!flagTab) {
      tab();
      flagTab = true;
    }
    dataTable.clear().rows.add(semesters).draw();
    document.getElementById('contentSection').style.display = 'block';
    document.getElementById('loader').style.display = 'none';
    // Populate dropdown options
    dropdownOptions("course");
  } catch (error) {
    console.error("Error initializing data:", error);
  }
}
var dataTable;
function tab() {
  // Initialize DataTable
  dataTable = $("#semTable").DataTable({
    columns: [
      { data: "name" },
      { data: "course" },
      {
        data: null,
        orderable: false,
        searchable: false,
        render: function (data, type, row, meta) {
          const modalId = `delSem${meta.row}`;
          return `
          <div class="text-end">
            <a href="#" data-bs-toggle="modal" data-bs-target="#${modalId}" style="margin-right: 10px;">
              <i class="fa-solid fa-trash fa-lg" style="color: #f00000;"></i>
            </a>
            <div class="modal fade" id="${modalId}" tabindex="-1">
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
                    <button type="button" class="btn btn-danger" onclick="delSemester('${row.id}')" data-bs-dismiss="modal">Yes</button>
                  </div>
                </div>
              </div>
            </div><!-- End Basic Modal-->
          </div>
        `;
        },
      },
    ],
  });
}

// validation
function validateAndAdd() {
  var name = document.getElementById("semesterName").value.trim();
  var course = document.getElementById("course").value;

  const errormsgname = document.getElementById("error-msg-name");
  const errormsgcourse = document.getElementById("error-msg-course");

  let flag = true;

  if (name === "") {
    errormsgname.style.display = "block";
    flag = false;
  }

  if (course === "") {
    errormsgcourse.style.display = "block";
    flag = false;
  }

  if (flag) {
    errormsgname.style.display = "none";
    errormsgcourse.style.display = "none";

    AddSemester();

    document.getElementById("semesterName").value = "";
    document.getElementById("course").value = "";

    bootstrap.Modal.getInstance(document.getElementById('basicModal')).hide();
  }
}

// CRUD Operations

// Add Semester

function AddSemester() {
  var name = document.getElementById("semesterName").value.trim();
  var course = document.getElementById("course").value;
  var courseSelect = $('#course option:selected').text();

  var exists = semesters.some(function (semester) {
    return semester.name === name && semester.course.toUpperCase() === courseSelect.toUpperCase();
  });

  if (exists) {
    alert("This semester already exists!");
  } else if (name !== "") {
    setData(`${COLLECTIONS.semesters}/${randomID()}`, { name: name, courseId: course, status: true })
      .then(() => {
        initializtion();
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }
}

// Delete Semester

async function delSemester(id) {
  var std = await queryByKeyValue(COLLECTIONS.students, "semesterId", id);
  std.forEach(async (mark) => {
    delSTD(mark.id);
  });
  var sub = await queryByKeyValue(COLLECTIONS.subjects, "semesterId", id);
  sub.forEach(async (mark) => {
    delSub(mark.id);
  });
  removeData(`${COLLECTIONS.semesters}/${id}`)
    .then(() => {
      initializtion();
    })
    .catch((error) => console.error("Error deleting semester:", error));
}

if (user.role === "Admin" || user.role === "Super Admin") {
  document.getElementById("showTranscript").innerHTML = `<li class="nav-item">
      <a class="nav-link collapsed" href="admin-transcript.html">
        <i class="fa-regular fa-file"></i>
        <span>Transcript</span>
      </a>
    </li>`
}

// Course selection in addition

window.validateAndAdd = validateAndAdd;
window.delSemester = delSemester;
window.dropdownOptions = dropdownOptions;

initializtion();

export { delSemester }