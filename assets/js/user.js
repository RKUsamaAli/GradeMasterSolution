import { getData, setData, updateData, removeData, randomID } from "./firebaseConfig.js";

import { getCookie, getUsers, COLLECTIONS } from "./common.js";
import { delSTD } from "./student.js";
var users = [];
let flagTab = false;

let user = JSON.parse(getCookie("user"));
document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("username").innerHTML = user.name;
  document.getElementById("username1").innerHTML = user.name;
  document.getElementById("role1").innerHTML = user.role;
});
async function initializtion() {
  try {
    document.getElementById('loader').style.display = 'block';
    document.getElementById('contentSection').style.display = 'none';
    users.length = 0;
    users = await getUsers();
    if (!flagTab) {
      tab();
      flagTab = true;
    }
    roleTable.clear().rows.add(users).draw();
    document.getElementById('contentSection').style.display = 'block';
    document.getElementById('loader').style.display = 'none';
  } catch (error) {
    console.error("Error initializing data:", error);
  }
}

var roleTable = null;
function tab() {
  // Initialize DataTable
  roleTable = $("#roleTable").DataTable({
    columns: [
      { data: "name" },
      { data: "email" },
      { data: "role" },
      {
        data: null,
        orderable: false,
        searchable: false,
        render: function (data, type, row, meta) {
          const modalId = `delCourse${meta.row}`;
          const updateMID = `updateCourse${meta.row}`;
          return `
          <div class="text-end">
            <!-- Edit course -->
            <a href="#" data-bs-toggle="modal" data-bs-target="#${updateMID}" style="margin-right: 10px;">
              <i class="fa-solid fa-pencil fa-lg" style="color: #0f54ae;"></i>
            </a>       
            <div class="modal fade" id="${updateMID}" tabindex="-1">
              <div class="modal-dialog">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title" style="font-weight:bold;">Update User</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                  </div>
                  <div class="modal-body">
                    <!-- Role -->
                    <div class="row mb-3">
                      <label class="col-sm-3 col-form-label">Role</label>
                      <div class="col-sm-9">
                        <select class="form-select" id="Urole${meta.row}" value="${row.role}">
                          <option value="Admin" selected>Admin</option>
                          <option value="Teacher">Teacher</option>
                          <option value="Student">Student</option>
                        </select>
                      </div>
                    </div>
                    <!-- User name -->
                    <div class="row mb-3">
                      <label for="inputText" class="col-sm-3 col-form-label">Name</label>
                      <div class="col-sm-9">
                        <input type="text" class="form-control" id="Uname${meta.row}" value="${row.name}" />
                        <span id="errormsgname" class="text-danger" style="display:none;">Please enter user name</span>
                      </div>
                    </div>
                    <!-- User email -->
                    <div class="row mb-3">
                      <label for="inputText" class="col-sm-3 col-form-label">Email</label>
                      <div class="col-sm-9">
                        <input type="email" class="form-control" id="Uemail${meta.row}" value="${row.email}"/>
                      </div>
                    </div>
                    <!-- password -->
                    <div class="row">
                      <label class="col-sm-3 col-form-label">password</label>
                      <div class="col-sm-9">
                        <input type="password" class="form-control" id="Upassword${meta.row}" />
                      </div>
                    </div>
                  </div>
                  <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary" onclick="updateUser('${meta.row}','${data.id}')" data-bs-dismiss="modal">Update</button>
                  </div>
                </div>
              </div>
            </div>
            <!-- Delete user -->
            <a href="#" data-bs-toggle="modal" data-bs-target="#${modalId}">
              <i class="fa-solid fa-trash fa-lg" style="color: #f00000;"></i>
            </a>
            <div class="modal fade" id="${modalId}" tabindex="-1">
              <div class="modal-dialog">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title" style="font-weight:bold;">Delete User</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                  </div>
                  <div class="modal-body text-start">
                    <p>Are you sure you want to delete user "${row.name}"?</p>
                    <p>If you delete this user then he/she will not be able to login again.</p>
                  </div>
                  <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">No</button>
                    <button type="button" class="btn btn-danger" onclick="delUser('${row.id}')" data-bs-dismiss="modal">Yes</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
        },
      },
    ],
  });
}

// validation
function validateAndAdd() {
  var role = document.getElementById("role").value;
  var name = document.getElementById("name").value.trim();
  var email = document.getElementById("email").value.trim();
  var password = document.getElementById("password").value.trim();

  const errormsgrole = document.getElementById("errormsgrole");
  const errormsgname = document.getElementById("errormsgname");
  const errormsgemail = document.getElementById("errormsgemail");
  const errormsgpassword = document.getElementById("errormsgpassword");

  let flag = true;

  // Validate Role
  if (role === "") {
    errormsgrole.style.display = "block";
    flag = false;
  } else {
    errormsgrole.style.display = "none";
  }

  // Validate Name
  if (name === "") {
    errormsgname.style.display = "block";
    errormsgname.textContent = "Name cannot be empty";
    flag = false;
  } else if (!/^[a-zA-Z\s]+$/.test(name)) {
    errormsgname.style.display = "block";
    errormsgname.textContent = "Name must contain only letters and spaces";
    flag = false;
  } else {
    errormsgname.style.display = "none";
  }

  // Validate Email
  if (email === "") {
    errormsgemail.style.display = "block";
    errormsgemail.textContent = "Email cannot be empty";
    flag = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errormsgemail.style.display = "block";
    errormsgemail.textContent = "Invalid email format";
    flag = false;
  } else {
    errormsgemail.style.display = "none";
  }

  // Validate Password
  if (password.length === "") {
    errormsgpassword.style.display = "block";
    flag = false;
  } else {
    errormsgpassword.style.display = "none";
  }

  // If all validations pass, proceed to add user
  if (flag) {
    errormsgrole.style.display = "none";
    errormsgname.style.display = "none";
    errormsgemail.style.display = "none";
    errormsgpassword.style.display = "none";

    // Call function to add user
    AddUser();

  }
}


// CRUD Operations

// Add Course
async function AddUser() {
  var user = {};
  user.name = document.getElementById("name").value.trim().toUpperCase();
  user.email = document.getElementById("email").value.trim();
  user.role = document.getElementById("role").value;
  user.password = document.getElementById("password").value;

  // Check for duplicate email
  var duplicate = users.some(function (object) {
    return object.email === user.email;
  });
  let flag = true;
  if (duplicate) {
    document.getElementById("errormsgemail").style.display = "block";
    document.getElementById("errormsgemail").textContent = "User with this email already exists!";
    flag = false;
  } else {
    // hash password
    user.password = CryptoJS.SHA256(user.password).toString();

    user.secret = CryptoJS.SHA256(`${user.name}${password}`).toString();
    console.log(user)

    // Add user data to the database
    setData(`${COLLECTIONS.users}/${randomID()}`, user)
      .then(() => {
        initializtion();
      })
      .catch((error) => {
        console.error("Error adding user:", error);
      });
  }
  if (flag) {
    // Reset the form fields
    document.getElementById("name").value = "";
    document.getElementById("email").value = "";
    document.getElementById("password").value = "";
    document.getElementById("errormsgemail").style.display = "none";
    // Hide the modal after successful addition
    bootstrap.Modal.getInstance(document.getElementById('basicModal')).hide();
  }
}

// Update User
async function updateUser(index, id) {
  var name = document.getElementById(`Uname${index}`).value.trim().toUpperCase();
  var email = document.getElementById(`Uemail${index}`).value.trim();
  var password = document.getElementById(`Upassword${index}`).value.trim();
  var role = document.getElementById(`Urole${index}`).value;

  // Check for duplicates
  var duplicate = users.some(function (user) {
    return (
      user.email === email &&
      user.id !== id
    );
  });

  if (duplicate) {
    alert("The email already exists.");
  } else if (name === "" || email === "") {
    // Validate the inputs
    alert("Name and Email fields cannot be empty.");
  } else {
    // Prepare updated data
    var updatedUser = {
      name: name,
      email: email,
      role: role,
    };

    // If password is provided, update it
    if (password !== "") {
      updatedUser.password = CryptoJS.SHA256(password).toString();
    }


    // check for Super Admin
    if (id !== "nmVKNhl16oQt3rlHDH8VqHl3T3l1") {
      // Update user data in the database
      await updateData(`${COLLECTIONS.students}/${id}`, { email: email, name: name });
      await updateData(`${COLLECTIONS.users}/${id}`, updatedUser)
        .then(() => {
          initializtion();
        })
        .catch((error) => console.error("Error updating user:", error));
    }
    else {
      alert("Super Admin can't be updated!!!");
    }
  }
}


async function delUser(id) {
  let email = "";
  await getData(`${COLLECTIONS.users}/${id}`).then((snap) => {
    if (snap.exists()) {
      email = snap.val().email;
    }
  });
  if (email !== "usamaali@gmail.com") {
    await delSTD(id)
    removeData(`${COLLECTIONS.users}/${id}`)
      .then(() => {
        initializtion();
      })
      .catch((error) => console.error("Error deleting semester:", error));
  }
  else {
    alert("Super Admin can't be deleted!!!");
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

// Expose functions to global scope
window.validateAndAdd = validateAndAdd;
window.delUser = delUser;
window.updateUser = updateUser;
initializtion();
