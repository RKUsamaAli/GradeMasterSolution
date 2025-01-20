import {
  setData,
  updateData,
  removeData,
  randomID,
  queryByKeyValue,
} from "./firebaseConfig.js";
import {
  getStudents,
  COLLECTIONS,
  dropdownOptions,
  getCookie,
} from "./common.js";

var students = [];
var subjects = [];
let flagTab = false;

let user = JSON.parse(getCookie("user"));
document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("username").innerHTML = user.name;
  document.getElementById("username1").innerHTML = user.name;
  let x = document.getElementById("userrole");
  if (x) {
    x.innerHTML = user.role
  }
});

async function initializtion() {
  try {
    document.getElementById('loader').style.display = 'block';
    document.getElementById('contentSection').style.display = 'none';
    students.length = 0;
    students = await getStudents();

    if (!flagTab) {
      tab();
      flagTab = true;
    }
    dataTable.clear().rows.add(students).draw();
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
  dataTable = $("#stdTable").DataTable({
    columns: [
      { title: "Roll No", data: "rollNo" },
      { title: "Name", data: "name" },
      { title: "Email", data: "email" },
      { title: "Course", data: "course" },
      { title: "Semester", data: "semester" },
      { title: "DOB", data: "dob" },
      {
        data: null,
        orderable: false,
        searchable: false,
        render: function (data, type, row, meta) {
          const modalId = `delSem${meta.row}`;
          const updateMID = `updateSem${meta.row}`;
          let txt = `
            <div class="text-end">
          <!-- Edit Student -->
          <a onclick="dropdownOptions('course', '${meta.row}', '${data.course}').then(() => dropdownOptions('semester', '${meta.row}', '${data.semester}'))"
            data-bs-toggle="modal" data-bs-target="#${updateMID}" style="margin-right: 10px;">
            <i class="fa-solid fa-pencil fa-lg" style="color: #0f54ae;"></i></a>
          <div class="modal fade" id="${updateMID}" tabindex="-1">
            <div class="modal-dialog">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title" style="font-weight:bold;"><b>Update Student</b></h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                  <!-- course -->
                  <div class="row mb-3">
                    <label class="col-sm-3 col-form-label">Course</label>
                    <div class="col-sm-9">
                      <select class="form-select" id="course${meta.row}" disabled>
                      </select>
                    </div>
                  </div>
                  <!-- Semester -->
                  <div class="row mb-3">
                    <label class="col-sm-3 col-form-label">Semester</label>
                    <div class="col-sm-9">
                      <select class="form-select" id="semester${meta.row}">
                      </select>
                    </div>
                  </div>
                  <!-- Roll No -->
                  <div class="row mb-3">
                    <label for="inputText" class="col-sm-3 col-form-label">Roll No</label>
                    <div class="col-sm-9">
                      <input type="text" class="form-control" id="rollNo${meta.row}" value="${data.rollNo}" disabled />
                    </div>
                  </div>
                  <!-- Name -->
                  <div class="row mb-3">
                    <label for="inputText" class="col-sm-3 col-form-label">Name</label>
                    <div class="col-sm-9">
                      <input type="text" class="form-control" id="name${meta.row}" value="${data.name}" required />
                    </div>
                  </div>
                  <!-- Email -->
                  <div class="row mb-3">
                    <label for="inputText" class="col-sm-3 col-form-label">Email</label>
                    <div class="col-sm-9">
                      <input type="email" class="form-control" id="email${meta.row}" value="${data.email}" required />
                    </div>
                  </div>
                  <!-- Name -->
                  <div class="row mb-3">
                    <label for="inputText" class="col-sm-3 col-form-label">Password</label>
                    <div class="col-sm-9">
                      <input type="password" class="form-control" id="password${meta.row}" value="" required />
                    </div>
                  </div>
                  <!-- DOB -->
                  <div class="row mb-3">
                    <label for="inputDate" class="col-sm-3 col-form-label">DOB</label>
                    <div class="col-sm-9">
                      <input type="date" id="dob${meta.row}" class="form-control" value="${data.dob}" />
                    </div>
                  </div>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                  <button type="button" class="btn btn-primary" onclick="updateSTD('${meta.row}','${data.id}')" data-bs-dismiss="modal">Update</button>
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
                  <h5 class="modal-title" style="font-weight:bold;">Delete Student</h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body text-start">
                  <p>Are you sure you want to delete this Student?</p>
                  <p>If you delete this student then all its data will be deleted permanently.</p>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">No</button>
                  <button type="button" class="btn btn-danger" onclick="delSTD('${data.id}')" data-bs-dismiss="modal">Yes</button>
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

function validateAndAdd() {
  var course = document.getElementById("course").value;
  var semester = document.getElementById("semester").value;
  var name = document.getElementById("name").value.trim();
  var dob = document.getElementById("dob").value.trim();
  var rollNo = document.getElementById("rollNo").value.trim();
  var email = document.getElementById("email").value.trim();
  var password = document.getElementById("password").value.trim();

  const errormsgcourse = document.getElementById("errormsgcourse");
  const errormsgsem = document.getElementById("errormsgsem");
  const errormsgname = document.getElementById("errormsgname");
  const errormsgdob = document.getElementById("errormsgdob");
  const errormsgrollno = document.getElementById("errormsgrollno");
  const errormsgemail = document.getElementById("errormsgemail");
  const errormsgpassword = document.getElementById("errormsgpassword");

  let flag = true;

  if (course === "") {
    errormsgcourse.style.display = "block";
    flag = false;
  } else {
    errormsgcourse.style.display = "none";
  }

  if (semester === "") {
    errormsgsem.style.display = "block";
    flag = false;
  } else {
    errormsgsem.style.display = "none";
  }

  if (rollNo === "") {
    errormsgrollno.style.display = "block";
    flag = false;
  } else {
    errormsgrollno.style.display = "none";
  }

  if (name === "") {
    errormsgname.style.display = "block";
    flag = false;
  } else {
    errormsgname.style.display = "none";
  }

  if (email === "") {
    errormsgemail.style.display = "block";
    flag = false;
  } else {
    errormsgemail.style.display = "none";
  }

  if (password === "") {
    errormsgpassword.style.display = "block";
    flag = false;
  } else {
    errormsgpassword.style.display = "none";
  }

  if (dob === "") {
    errormsgdob.style.display = "block";
    flag = false;
  } else {
    errormsgdob.style.display = "none";
  }

  if (flag) {
    errormsgcourse.style.display = "none";
    errormsgsem.style.display = "none";
    errormsgname.style.display = "none";
    errormsgdob.style.display = "none";
    errormsgrollno.style.display = "none";
    errormsgemail.style.display = "none";
    errormsgpassword.style.display = "none";

    Addstd();
  }
}


// CRUD Operation

// Add Student
async function Addstd() {
  var std = {};
  std.name = document.getElementById("name").value.toUpperCase();
  std.courseId = document.getElementById("course").value;
  std.semesterId = document.getElementById("semester").value;
  std.dob = document.getElementById("dob").value;
  std.rollNo = document.getElementById("rollNo").value;
  std.email = document.getElementById("email").value;
  std.status = true;
  let password = document.getElementById("password").value;
  var user = {};
  user.role = "Student";
  user.name = std.name;
  user.email = std.email;
  user.password = CryptoJS.SHA256(password).toString();

  let flag = true;
  var duplicate = students.some(function (object) {
    return (
      object.rollNo === std.rollNo
    );
  });
  // Check for duplicate email
  var duplicate1 = students.some(function (object) {
    return object.email === std.email;
  });
  if (duplicate) {
    document.getElementById("errormsgrollno").style.display = "block";
    document.getElementById("errormsgrollno").textContent = "User with this roll no already exists!";
    flag = false;
  }
  else if (duplicate1) {
    document.getElementById("errormsgemail").style.display = "block";
    document.getElementById("errormsgemail").textContent = "User with this email already exists!";
    flag = false;
  }

  else {
    if (flag) {
      document.getElementById("course").value = "";
      document.getElementById("semester").value = "";
      document.getElementById("name").value = "";
      document.getElementById("dob").value = "";
      document.getElementById("rollNo").value = "";
      document.getElementById("email").value = "";
      document.getElementById("password").value = "";

      bootstrap.Modal.getInstance(document.getElementById('basicModal')).hide();
    }
    var stdID = randomID();
    subjects.length = 0;
    subjects = await queryByKeyValue(COLLECTIONS.subjects, "semesterId", std.semesterId);
    for (let i = 0; i < subjects.length; i++) {
      var mark = {}
      mark.courseId = std.courseId;
      mark.semesterId = std.semesterId;
      mark.subjectId = subjects[i].id;
      mark.studentId = stdID;
      mark.marks = 0;
      mark.totalMarks = subjects[i].marks;
      mark.status = true;
      mark.grade = 'F';
      await setData(`${COLLECTIONS.marks}/${randomID()}`, mark);
    }
    await setData(`${COLLECTIONS.students}/${stdID}`, std)
    await setData(`${COLLECTIONS.users}/${stdID}`, user)
      .then(() => {
        initializtion();
      })
      .catch((error) => {
        console.error("Error:", error);
      });

  }
}

async function delSTD(index) {
  var markData = await queryByKeyValue(COLLECTIONS.marks, "studentId", index);
  markData.forEach(async (mark) => {
    await removeData(`${COLLECTIONS.marks}/${mark.id}`);
  });
  await removeData(`${COLLECTIONS.students}/${index}`);
  await removeData(`${COLLECTIONS.users}/${index}`)
    .then(() => {
      initializtion();
    })
    .catch((error) => console.error("Error deleting student:", error));
}

async function updateSTD(index, id) {
  var std = {};
  std.name = document.getElementById(`name${index}`).value.toUpperCase();
  std.courseId = document.getElementById(`course${index}`).value;
  std.semesterId = document.getElementById(`semester${index}`).value;
  std.dob = document.getElementById(`dob${index}`).value;
  std.rollNo = document.getElementById(`rollNo${index}`).value;
  std.email = document.getElementById(`email${index}`).value;
  std.rollNo = document.getElementById(`rollNo${index}`).value;

  let password = document.getElementById(`password${index}`).value;
  var duplicate = students.some(function (object) {
    return (
      object.name === std.name &&
      object.courseId === std.courseId &&
      object.semesterId === std.semesterId &&
      object.rollNo != std.rollNo
    );
  });
  if (duplicate) alert("Student already exists!");
  else if (std.name === "" || std.email === "") { alert("Name and Email is required"); }
  else {
    let preSTD = students.find((temp) => {
      return temp.id == id;
    })
    let marks1 = await queryByKeyValue(COLLECTIONS.marks, "studentId", id, "semesterId", preSTD.semesterId);
    marks1.forEach(async (mark) => {
      await updateData(`${COLLECTIONS.marks}/${mark.id}`, { status: false });
    });
    if (preSTD.semesterId != std.semesterId) {
      console.log("Semester changed");
      let marks_ = await queryByKeyValue(COLLECTIONS.marks, "studentId", id, "semesterId", std.semesterId)
      if (marks_.length == 0) {
        console.log("No marks found")
        var subjects_ = [];
        subjects_.length = 0;
        subjects_ = await queryByKeyValue(COLLECTIONS.subjects, "semesterId", std.semesterId);
        for (let i = 0; i < subjects_.length; i++) {
          var mark = {}
          mark.courseId = std.courseId;
          mark.semesterId = std.semesterId;
          mark.subjectId = subjects_[i].id;
          mark.studentId = id;
          mark.marks = 0;
          mark.totalMarks = subjects_[i].marks;
          mark.status = true;
          mark.grade = 'F';
          setData(`${COLLECTIONS.marks}/${randomID()}`, mark);
        }
      }
      else {
        marks_.forEach(async (mark) => {
          await updateData(`${COLLECTIONS.marks}/${mark.id}`, { status: true });
        });
      }
    }
    if (students)
      await updateData(`${COLLECTIONS.users}/${id}`, { email: std.email, name: std.name });
    if (password !== "") {
      await updateData(`${COLLECTIONS.users}/${id}`, { password: CryptoJS.SHA256(password).toString() });
    }
    updateData(`${COLLECTIONS.students}/${students[index].id}`, std)
      .then(() => {
        initializtion();
      })
      .catch((error) => console.error("Error updating student:", error));
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

window.validateAndAdd = validateAndAdd;
window.delSTD = delSTD;
window.updateSTD = updateSTD;
window.dropdownOptions = dropdownOptions;
// Initial call
initializtion();

export { delSTD }
