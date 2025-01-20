import {
  setData,
  updateData,
  removeData,
  randomID,
  queryByKeyValue
} from "./firebaseConfig.js";
import { getSubjects, COLLECTIONS, dropdownOptions, getCookie } from "./common.js";
var subjects = [];
let flagTab = false;

let user = JSON.parse(getCookie("user"));
document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("username").innerHTML = user.name;
  document.getElementById("username1").innerHTML = user.name;
  let x = document.getElementById("role1");
  if (x)
    x.innerHTML = user.role;
});

async function initializtion() {
  try {
    document.getElementById('loader').style.display = 'block';
    document.getElementById('contentSection').style.display = 'none';
    subjects.length = 0;
    subjects = await getSubjects();
    if (!flagTab) {
      tab();
      flagTab = true;
    }
    dataTable.clear().rows.add(subjects).draw();
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
  dataTable = $("#subTable").DataTable({
    columns: [
      { data: "name" },
      { data: "marks" },
      { data: "credit" },
      { data: "course" },
      { data: "semester" },
      {
        data: null,
        orderable: false,
        searchable: false,
        render: function (data, type, row, meta) {
          const modalId = `delSem${meta.row}`;
          const updateMID = `updateSub${meta.row}`;
          let txt = `
        <div class="text-end">
          <!-- Edit Subject -->
          <a onclick="dropdownOptions('course','${meta.row}','${data.course}'); dropdownOptions('semester','${meta.row}','${data.semester}')" data-bs-toggle="modal" data-bs-target="#${updateMID}" style="margin-right: 10px;">
            <i class="fa-solid fa-pencil fa-lg" style="color: #0f54ae;"></i>
          </a>
          <div class="modal fade" id="${updateMID}" tabindex="-1">
            <div class="modal-dialog">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title" style="font-weight:bold;">Update Subject</h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                  <!-- course -->
                  <div class="row mb-3">
                    <label class="col-sm-3 col-form-label">Course</label>
                    <div class="col-sm-9">
                      <select class="form-select" id="course${meta.row}" onchange="dropdownOptions('semester','${meta.row}')" disabled>
                      </select>
                    </div>
                  </div>
                  <!-- Semester -->
                  <div class="row mb-3">
                    <label class="col-sm-3 col-form-label">Semester</label>
                    <div class="col-sm-9">
                      <select class="form-select" id="semester${meta.row}" disabled>
                      </select>
                    </div>
                  </div>
                  <!-- Name -->
                  <div class="row mb-3">
                    <label for="inputText" class="col-sm-3 col-form-label">Name</label>
                    <div class="col-sm-9">
                      <input type="text" class="form-control" id="name${meta.row}" value="${data.name}" />
                    </div>
                  </div>
                  <!-- Total Marks -->
                  <div class="row mb-3">
                    <label for="inputText" class="col-sm-3 col-form-label">Marks</label>
                    <div class="col-sm-9">
                      <input type="number" class="form-control" id="marks${meta.row}" value="${data.marks}" disabled/>
                    </div>
                  </div>
                  <!-- Credit Hour -->
                  <div class="row mb-3">
                    <label for="inputText" class="col-sm-3 col-form-label">Credit Hour</label>
                    <div class="col-sm-9">
                      <input type="number" class="form-control" id="credit${meta.row}" value="${data.credit}" />
                    </div>
                  </div>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                  <button type="button" class="btn btn-primary" onclick="updateSub('${meta.row}','${data.id}')" data-bs-dismiss="modal">Update</button>
                </div>
              </div>
            </div>
          </div>
          <!-- Delete Subject -->
          <a href="#" data-bs-toggle="modal" data-bs-target="#${modalId}">
            <i class="fa-solid fa-trash fa-lg" style="color: #f00000;"></i>
          </a>
          <div class="modal fade" id="${modalId}" tabindex="-1">
            <div class="modal-dialog">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title" style="font-weight:bold;">Delete Subject</h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body text-start">
                  <p>Are you sure you want to delete this subject?</p>
                  <p>If you delete this subject then its data from students relevent to that semester will be deleted.</p>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">No</button>
                  <button type="button" class="btn btn-danger" onclick="delSub('${data.id}')" data-bs-dismiss="modal">Yes</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        `;
          return txt;
        },
      },
    ],
  });
}

function validateAndAddSub() {
  var course = document.getElementById("course").value;
  var semester = document.getElementById("semester").value;
  var subject = document.getElementById("subject").value.trim();
  var marks = document.getElementById("marks").value.trim();
  var credit = document.getElementById("credit").value.trim();

  const errormsgcourse = document.getElementById("errormsgcourse");
  const errormsgsem = document.getElementById("errormsgsem");
  const errormsgsubject = document.getElementById("errormsgsubject");
  const errormsgmarks = document.getElementById("errormsgmarks");
  const errormsgcredit = document.getElementById("errormsgcredit");

  let flag = true;

  // Validate Course
  if (course === "") {
    errormsgcourse.style.display = "block";
    flag = false;
  } else {
    errormsgcourse.style.display = "none";
  }

  // Validate Semester
  if (semester === "") {
    errormsgsem.style.display = "block";
    flag = false;
  } else {
    errormsgsem.style.display = "none";
  }

  // Validate Subject
  if (subject === "") {
    errormsgsubject.style.display = "block";
    flag = false;
  } else {
    errormsgsubject.style.display = "none";
  }

  // Validate Marks
  if (marks === "" || isNaN(marks) || marks < 0 || marks > 100) {
    errormsgmarks.style.display = "block";
    flag = false;
  } else {
    errormsgmarks.style.display = "none";
  }

  // Validate Credit Hour
  if (credit === "" || isNaN(credit) || credit < 0 || credit > 3) {
    errormsgcredit.style.display = "block";
    flag = false;
  } else {
    errormsgcredit.style.display = "none";
  }

  // If validation passes, proceed with adding the subject
  if (flag) {
    // Hide all error messages
    errormsgcourse.style.display = "none";
    errormsgsem.style.display = "none";
    errormsgsubject.style.display = "none";
    errormsgmarks.style.display = "none";
    errormsgcredit.style.display = "none";

    // Call the function to add the subject
    AddSub();

    // Clear fields after adding
    document.getElementById("course").value = "";
    document.getElementById("semester").value = "";
    document.getElementById("subject").value = "";
    document.getElementById("credit").value = "";

    // Hide the modal
    bootstrap.Modal.getInstance(document.getElementById('basicModal')).hide();
  }
}



// CRUD Operations

// Add Subject
async function AddSub() {
  var name = document.getElementById("subject").value;
  var marks = document.getElementById("marks").value;
  var credit = document.getElementById("credit").value;
  var course = document.getElementById("course").value;
  var courseSelect = $("#course option:selected").text();
  var semester = document.getElementById("semester").value;
  var semesterSelect = $("#semester option:selected").text();
  // Check for duplicates
  var duplicate = subjects.some(function (subject) {
    return (
      subject.name.toUpperCase() === name.toUpperCase() &&
      subject.course.toUpperCase() === courseSelect.toUpperCase() &&
      subject.semester.toUpperCase() === semesterSelect.toUpperCase()
    );
  });
  if (duplicate) {
    alert("The subject already exists in the same course and semester.");
  } else {
    var subID = randomID();
    var std = [];
    std.length = 0;
    std = await queryByKeyValue(COLLECTIONS.students, "semesterId", semester);
    for (let i = 0; i < std.length; i++) {
      var mark = {}
      mark.courseId = course;
      mark.semesterId = semester;
      mark.subjectId = subID;
      mark.studentId = std[i].id;
      mark.marks = 0;
      mark.totalMarks = marks;
      mark.status = true;
      mark.grade = 'F';
      setData(`${COLLECTIONS.marks}/${randomID()}`, mark);
    }
    setData(`${COLLECTIONS.subjects}/${subID}`, {
      name: name.toUpperCase(),
      marks: marks,
      courseId: course,
      semesterId: semester,
      credit: credit,
      status: true,
    })
      .then(() => {
        initializtion();
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }
}

// Delete Subject
async function delSub(id) {
  var markData = await queryByKeyValue(COLLECTIONS.marks, "subjectId", id);
  markData.forEach(async (mark) => {
    await removeData(`${COLLECTIONS.marks}/${mark.id}`);
  });
  removeData(`${COLLECTIONS.subjects}/${id}`)
    .then(() => {
      initializtion();
    })
    .catch((error) => console.error("Error deleting subject:", error));
}

//Update Subject
function updateSub(index, id) {
  var name = document.getElementById(`name${index}`).value.trim();
  var marks = document.getElementById(`marks${index}`).value.trim();
  var credit = document.getElementById(`credit${index}`).value.trim();
  var course = document.getElementById(`course${index}`).value.trim();
  var courseSelect = $(`#course${index} option:selected`).text();
  var semester = document.getElementById(`semester${index}`).value.trim();
  var semesterSelect = $(`#semester${index} option:selected`).text();

  // Check for duplicates
  var duplicate = subjects.some(function (subject) {
    return (
      subject.name.toUpperCase() === name.toUpperCase() &&
      subject.course.toUpperCase() === courseSelect.toUpperCase() &&
      subject.semester.toUpperCase() === semesterSelect.toUpperCase() &&
      subject.id != id
    );
  });
  if (name == "" || credit == "") {
    alert("Name and credit hour fields are required.");
    return;
  }
  if (duplicate) {
    {
      alert("The subject already exists in the same course and semester.");
      return;
    }

  } else {
    updateData(`${COLLECTIONS.subjects}/${subjects[index].id}`, {
      name: name.toUpperCase(),
      marks: marks,
      courseId: course,
      semesterId: semester,
      credit: credit,
    })
      .then(() => {
        initializtion();
      })
      .catch((error) => console.error("Error updating course:", error));
  }
}
if (user.role === "Admin" || user.role === "Super Admin") {
  document.getElementById("showTranscript").innerHTML = `<li class="nav-item">
      <a class="nav-link collapsed" href="admin-transcript.html">
        <i class="fa-regular fa-file"></i>
        <span>Transcript</span>
      </a>
    </li>`
}
window.delSub = delSub;
window.updateSub = updateSub;
window.validateAndAddSub = validateAndAddSub;
window.dropdownOptions = dropdownOptions;

// Initial call
initializtion();

export { delSub }